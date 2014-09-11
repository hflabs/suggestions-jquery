// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    'use strict';

    var
        keys = {
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            SPACE: 32,
            UP: 38,
            DOWN: 40
        },
        types = {},
        initializeHooks = [],
        disposeHooks = [],
        setOptionsHooks = [],
        fixPositionHooks = [],
        resetPositionHooks = [],
        requestParamsHooks = [],
        assignSuggestionsHooks = [],
        eventNS = '.suggestions',
        dataAttrKey = 'suggestions',
        QC_COMPLETE = {
            OK: 0,
            NO_REGION: 1,
            NO_CITY: 2,
            NO_STREET: 3,
            NO_HOUSE: 4,
            NO_FLAT: 5,
            BAD: 6,
            FOREIGN: 7
        },
        rWordBreak = '[\\s\"-]+',
        rWordPart = '[^\\s\"-]+',
        defaultOptions = {
            autoSelectFirst: false,
            serviceUrl: null,
            onInvalidateSelection: $.noop,
            onSearchStart: $.noop,
            onSearchComplete: $.noop,
            onSearchError: $.noop,
            onSelect: null,
            onSelectNothing: null,
            minChars: 1,
            width: 'auto',
            zIndex: 9999,
            maxHeight: 300,
            deferRequestBy: 100,
            params: {},
            paramName: 'query',
            formatResult: null,
            delimiter: null,
            noCache: false,
            containerClass: 'suggestions-suggestions',
            tabDisabled: false,
            triggerSelectOnSpace: true,
            preventBadQueries: false,
            hint: 'Выберите вариант ниже или продолжите ввод',
            type: null,
            count: 5,
            $helpers: null,
            headers: null
        };

//include "utils.js"

//include "matchers.js"

//include "types.js"

    var serviceMethods = {
        'suggest': {
            defaultParams: {
                type: utils.getDefaultType(),
                dataType: 'json',
                contentType: utils.getDefaultContentType()
            },
            addTypeInUrl: true
        },
        'detectAddressByIp': {
            defaultParams: {
                type: 'GET',
                dataType: 'json'
            },
            addTypeInUrl: false
        }
    };

    function Suggestions(el, options) {
        var that = this;

        // Shared variables:
        that.element = el;
        that.el = $(el);
        that.suggestions = [];
        that.badQueries = [];
        that.selectedIndex = -1;
        that.currentValue = that.element.value;
        that.intervalId = 0;
        that.cachedResponse = {};
        that.currentRequest = null;
        that.onChangeTimeout = null;
        that.$wrapper = null;
        that.options = $.extend({}, defaultOptions, options);
        that.classes = {
            hint: 'suggestions-hint',
            selected: 'suggestions-selected',
            suggestion: 'suggestions-suggestion',
            subtext: 'suggestions-subtext',
            subtext_inline: 'suggestions-subtext suggestions-subtext_inline',
            subtext_delimiter: 'suggestions-subtext-delimiter',
            removeConstraint: 'suggestions-remove'
        };
        that.selection = null;
        that.$viewport = $(window);
        that.type = null;

        // Initialize and set options:
        that.initialize();
        that.setOptions(options);
    }

    Suggestions.utils = utils;

    Suggestions.defaultOptions = defaultOptions;

    Suggestions.version = '%VERSION%';

    $.Suggestions = Suggestions;

    Suggestions.prototype = {

        // Creation and destruction

        initialize: function () {
            var that = this;

            // Remove autocomplete attribute to prevent native suggestions:
            that.element.setAttribute('autocomplete', 'off');
            this.el.addClass('suggestions-input')
                .css('box-sizing', 'border-box');

            that.uniqueId = utils.uniqueId('i');

            that.createWrapper();
            that.applyHooks(initializeHooks);

            that.bindWindowEvents();

            that.fixPosition();
        },

        dispose: function () {
            var that = this;
            that.applyHooks(disposeHooks);
            that.el.removeData(dataAttrKey)
                .removeClass('suggestions-input');
            that.unbindWindowEvents();
            that.removeWrapper();
        },

        applyHooks: function(hooks) {
            var that = this,
                args = utils.slice(arguments, 1);

            return $.map(hooks, function(hook){
                return hook.apply(that, args);
            });
        },

        createWrapper: function () {
            var that = this;

            that.$wrapper = $('<div class="suggestions-wrapper"/>');
            that.el.after(that.$wrapper);

            that.$wrapper.add(that.options.$helpers).on('mousedown' + eventNS, $.proxy(that.onMousedown, that));
        },

        removeWrapper: function () {
            this.$wrapper.remove();
        },

        /** This whole handler is needed to prevent blur event on textbox
         * when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
         * See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
         */
        onMousedown: function (event) {
            var that = this;

            // prevent moving focus out of the text field
            event.preventDefault();

            // IE doesn't prevent moving focus even with event.preventDefault()
            // so we set a flag to know when we should ignore the blur event
            that.cancelBlur = true;
            utils.delay(function () {
                delete that.cancelBlur;
            });

            // clicking on the scrollbar causes focus to shift to the body
            // but we can't detect a mouseup or a click immediately afterward
            // so we have to track the next mousedown and close the menu if
            // the user clicks somewhere outside of the autocomplete
            if (!$(event.target).closest(".ui-menu-item").length) {
                utils.delay(function () {
                    $(document).one("mousedown", function (event) {
                        var $elements = that.el
                            .add(that.$wrapper)
                            .add(that.options.$helpers);

                        $elements = $elements.filter(function(){
                            return this === event.target || $.contains(this, event.target);
                        });

                        if (!$elements.length) {
                            that.hide();
                        }
                    });
                });
            }
        },

        bindWindowEvents: function () {
            var that = this;
            that.$viewport.on('resize' + eventNS + that.uniqueId, $.proxy(that.fixPosition, that));
        },

        unbindWindowEvents: function () {
            this.$viewport.off('resize' + eventNS + this.uniqueId);
        },

        // Configuration methods

        setOptions: function (suppliedOptions) {
            var that = this;

            $.extend(that.options, suppliedOptions);

            that.type = types[that.options.type];
            if (!that.type) {
                that.disable();
                throw '`type` option is incorrect! Must be one of: ' + $.map(types, function(i, type){ return '"' + type + '"'; }).join(', ');
            }

            that.applyHooks(setOptionsHooks);
        },

        // Common public methods

        fixPosition: function () {
            var that = this,
                elLayout = {},
                elOffset,
                wrapperOffset,
                origin;

            that.applyHooks(resetPositionHooks);
            // reset input's padding to default, determined by css
            that.el.css('paddingLeft', '');
            that.el.css('paddingRight', '');
            elLayout.paddingLeft = parseFloat(that.el.css('paddingLeft'));
            elLayout.paddingRight = parseFloat(that.el.css('paddingRight'));

            elOffset = that.el.offset();
            elLayout.borderTop = that.el.css('border-top-style') == 'none' ? 0 : parseFloat(that.el.css('border-top-width'));
            elLayout.borderLeft = that.el.css('border-left-style') == 'none' ? 0 : parseFloat(that.el.css('border-left-width'));
            elLayout.innerHeight = that.el.innerHeight();
            elLayout.innerWidth = that.el.innerWidth();
            wrapperOffset = that.$wrapper.offset();

            origin = {
                top: elOffset.top - wrapperOffset.top,
                left: elOffset.left - wrapperOffset.left
            };

            that.applyHooks(fixPositionHooks, origin, elLayout);

            that.el.css('paddingLeft', elLayout.paddingLeft + 'px');
        },

        clearCache: function () {
            this.cachedResponse = {};
            this.badQueries = [];
        },

        clear: function () {
            this.clearCache();
            this.currentValue = '';
            this.selection = null;
            this.suggestions = [];
        },

        disable: function () {
            var that = this;
            that.disabled = true;
            that.abortRequest();
            that.hide();
        },

        enable: function () {
            this.disabled = false;
        },

        update: function () {
            var that = this,
                value = that.el.val(),
                query = that.getQuery(value);

            if (query.length >= that.options.minChars) {
                that.updateSuggestions(query);
            } else {
                that.hide();
            }
        },

        setSuggestion: function(suggestion){
            var that = this;

            if ($.isPlainObject(suggestion) && suggestion.value) {
                that.currentValue = suggestion.value;
                that.el.val(suggestion.value);
                that.selection = suggestion;
                that.abortRequest();
            }
        },

        // Querying related methods

        getAjaxParams: function (method, custom) {
            var that = this,
                token = $.trim(that.options.token),
                serviceUrl = that.options.serviceUrl,
                serviceMethod = serviceMethods[method],
                params = $.extend({}, serviceMethod.defaultParams),
                headers = {};

            if (!/\/$/.test(serviceUrl)) {
                serviceUrl += '/';
            }
            serviceUrl += method;
            if (serviceMethod.addTypeInUrl) {
                serviceUrl += '/' + that.type.urlSuffix;
            }

            serviceUrl = utils.fixURLProtocol(serviceUrl);

            if ($.support.cors) {
                // for XMLHttpRequest put token in header
                if (token) {
                    headers['Authorization'] = 'Token ' + token;
                }
                headers['X-Version'] = Suggestions.version;
                if (!params.headers) {
                    params.headers = {};
                }
                $.extend(params.headers, that.options.headers, headers);
            } else {
                // for XDomainRequest put token into URL
                if (token) {
                    headers['token'] = token;
                }
                headers['version'] = Suggestions.version;
                serviceUrl = utils.addUrlParams(serviceUrl, headers);
            }

            params.url = serviceUrl;

            return $.extend(params, custom);
        },

        getQuery: function (value) {
            var delimiter = this.options.delimiter,
                parts;

            if (!delimiter) {
                return value;
            }
            parts = value.split(delimiter);
            return $.trim(parts[parts.length - 1]);
        },

        constructRequestParams: function(query, customParams){
            var that = this,
                options = that.options,
                params = $.isFunction(options.params)
                    ? options.params.call(that.element, query)
                    : $.extend({}, options.params);

            $.each(that.applyHooks(requestParamsHooks), function(i, hookParams){
                $.extend(params, hookParams);
            });
            params[options.paramName] = query;
            if ($.isNumeric(options.count) && options.count > 0) {
                params.count = options.count;
            }

            return $.extend(params, customParams);
        },

        updateSuggestions: function (query) {
            var that = this;

            that.getSuggestions(query)
                .done(function(suggestions){
                    that.assignSuggestions(suggestions, query);
                })
        },

        /**
         * Get suggestions from cache or from server
         * @param {String} query
         * @param {Object} customParams parameters specified here will be passed to request body
         * @param {Object} requestOptions if contains noCallbacks flag, request completance callbacks will not be invoked
         * @return {$.Deferred} waiter which is to be resolved with suggestions as argument
         */
        getSuggestions: function (query, customParams, requestOptions) {
            var response,
                that = this,
                options = that.options,
                serviceUrl = options.serviceUrl,
                params = that.constructRequestParams(query, customParams),
                cacheKey = serviceUrl + '?' + $.param(params || {}),
                resolver = $.Deferred(),
                noCallbacks = requestOptions && requestOptions.noCallbacks;

            response = that.cachedResponse[cacheKey];
            if (response && $.isArray(response.suggestions)) {
                resolver.resolve(response.suggestions);
            } else {
                if (that.isBadQuery(query)) {
                    resolver.reject();
                } else {
                    if (!noCallbacks && options.onSearchStart.call(that.element, params) === false) {
                        resolver.reject();
                    } else {
                        that.abortRequest();
                        that.showPreloader();
                        that.currentRequest = that.doGetSuggestions(params);
                        that.currentRequest.always(function () {
                            that.currentRequest = null;
                            that.hidePreloader();
                        }).done(function (response) {
                            if (that.processResponse(response, query, cacheKey)) {
                                resolver.resolve(response.suggestions);
                            } else {
                                resolver.reject();
                            }
                            if (!noCallbacks) {
                                options.onSearchComplete.call(that.element, query, response.suggestions);
                            }
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            resolver.reject();
                            if (!noCallbacks) {
                                options.onSearchError.call(that.element, query, jqXHR, textStatus, errorThrown);
                            }
                        });
                    }
                }
            }
            return resolver;
        },

        /**
         * Sends an AJAX request to server suggest method.
         * @param {Object} params request params
         * @returns {$.Deferred} response promise
         */
        doGetSuggestions: function(params) {
            var that = this;
            return $.ajax(
                that.getAjaxParams('suggest', { data: utils.serialize(params) })
            );
        },

        isBadQuery: function (q) {
            if (!this.options.preventBadQueries) {
                return false;
            }

            var result = false;
            $.each(this.badQueries, function (i, query) {
                return !(result = q.indexOf(query) === 0);
            });
            return result;
        },

        abortRequest: function () {
            var that = this;

            if (that.currentRequest) {
                that.currentRequest.abort();
            }
        },

        /**
         * Checks response format and data, puts it in cache
         * @return {Boolean} response contains acceptable data
         */
        processResponse: function (response, originalQuery, cacheKey) {
            var that = this,
                options = that.options;

            if (!response || !$.isArray(response.suggestions)) {
                return false;
            }

            that.verifySuggestionsFormat(response.suggestions);
            that.setUnrestrictedValues(response.suggestions);

            // Cache results if cache is not disabled:
            if (!options.noCache) {
                that.cachedResponse[cacheKey] = response;
                if (options.preventBadQueries && response.suggestions.length === 0) {
                    that.badQueries.push(originalQuery);
                }
            }

            // Return if originalQuery is not matching current query:
            if (originalQuery !== that.getQuery(that.currentValue)) {
                return false;
            }

            return true;
        },

        verifySuggestionsFormat: function (suggestions) {
            if (typeof suggestions[0] === 'string') {
                $.each(suggestions, function(i, value){
                    suggestions[i] = { value: value, data: null };
                });
            }
        },

        assignSuggestions: function(suggestions, query) {
            var that = this;
            that.suggestions = suggestions;
            that.applyHooks(assignSuggestionsHooks, query);
        },

        getValue: function (value) {
            var that = this,
                delimiter = that.options.delimiter,
                currentValue,
                parts;

            if (!delimiter) {
                return value;
            }

            currentValue = that.currentValue;
            parts = currentValue.split(delimiter);

            if (parts.length === 1) {
                return value;
            }

            return currentValue.substr(0, currentValue.length - parts[parts.length - 1].length) + value;
        },

        shouldRestrictValues: function() {
            var that = this;
            // treat suggestions value as restricted only if there is one constraint
            // and restrict_value is true
            return that.options.restrict_value
                && that.constraints
                && Object.keys(that.constraints).length == 1;
        },

        /**
         * Fills suggestion.unrestricted_value property
         */
        setUnrestrictedValues: function(suggestions) {
            var that = this,
                shouldRestrict = that.shouldRestrictValues(),
                label = that.getFirstConstraintLabel();

            $.each(suggestions, function(i, suggestion) {
                suggestion.unrestricted_value = shouldRestrict ? label + ', ' + suggestion.value : suggestion.value;
            });
        },

        findSuggestionIndex: function (query) {
            var that = this,
                index = -1;

            if ($.trim(query) !== '') {
                $.each(that.type.matchers, function(i, matcher) {
                    index = matcher.call(that.type, query, that.suggestions);
                    return index === -1;
                });
            }
            return index;
        }

    };

//include "element.js"

//include "authorization.js"

//include "geolocation.js"

//include "enrich.js"

//include "container.js"

//include "preloader.js"

//include "constraints.js"

//include "select.js"

    // Create chainable jQuery plugin:
    $.fn.suggestions = function (options, args) {
        // If function invoked without argument return
        // instance of the first matched element:
        if (arguments.length === 0) {
            return this.first().data(dataAttrKey);
        }

        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataAttrKey);

            if (typeof options === 'string') {
                if (instance && typeof instance[options] === 'function') {
                    instance[options](args);
                }
            } else {
                // If instance already exists, destroy it:
                if (instance && instance.dispose) {
                    instance.dispose();
                }
                instance = new Suggestions(this, options);
                inputElement.data(dataAttrKey, instance);
            }
        });
    };

}));
