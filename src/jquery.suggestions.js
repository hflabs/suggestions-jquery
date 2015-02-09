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
            ENTER: 13,
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            SPACE: 32,
            UP: 38,
            DOWN: 40
        },
        types = {},
        eventNS = '.suggestions',
        dataAttrKey = 'suggestions',
        wordDelimiters = '\\s"\'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№',
        wordSplitter = new RegExp('[' + wordDelimiters + ']+', 'g'),
        wordPartsDelimiters = '\\-\\+\\/\\\\\\?!@#$%^&',
        wordPartsSplitter = new RegExp('[' + wordPartsDelimiters + ']+', 'g'),
        defaultOptions = {
            autoSelectFirst: false,
            serviceUrl: null,
            onSearchStart: $.noop,
            onSearchComplete: $.noop,
            onSearchError: $.noop,
            onSelect: null,
            onSelectNothing: null,
            onInvalidateSelection: null,
            minChars: 1,
            width: 'auto',
            deferRequestBy: 100,
            params: {},
            paramName: 'query',
            formatResult: null,
            formatSelected: null,
            noCache: false,
            containerClass: 'suggestions-suggestions',
            tabDisabled: false,
            triggerSelectOnSpace: true,
            preventBadQueries: false,
            hint: 'Выберите вариант или продолжите ввод',
            type: null,
            count: 5,
            $helpers: null,
            headers: null,
            scrollOnFocus: true,
            mobileWidth: 980
        };

    var notificator = {

        chains: {},

        'on': function (name, method) {
            this.get(name).push(method);
            return this;
        },

        'get': function (name) {
            var chains = this.chains;
            return chains[name] || (chains[name] = []);
        }
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
        that.enrichmentCache = {};
        that.currentRequest = null;
        that.inputPhase = $.Deferred();
        that.dataPhase = $.Deferred();
        that.onChangeTimeout = null;
        that.$wrapper = null;
        that.options = $.extend({}, defaultOptions, options);
        that.classes = {
            hint: 'suggestions-hint',
            mobile: 'suggestions-mobile',
            nowrap: 'suggestions-nowrap',
            selected: 'suggestions-selected',
            suggestion: 'suggestions-suggestion',
            subtext: 'suggestions-subtext',
            subtext_inline: 'suggestions-subtext suggestions-subtext_inline',
            subtext_delimiter: 'suggestions-subtext-delimiter',
            subtext_label: 'suggestions-subtext suggestions-subtext_label',
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
            that.notify('initialize');

            that.bindWindowEvents();

            that.fixPosition();
        },

        dispose: function () {
            var that = this;
            that.notify('dispose');
            that.el.removeData(dataAttrKey)
                .removeClass('suggestions-input');
            that.unbindWindowEvents();
            that.removeWrapper();
            that.el.trigger('suggestions-dispose');
        },

        notify: function(chainName) {
            var that = this,
                args = utils.slice(arguments, 1);

            return $.map(notificator.get(chainName), function(method){
                return method.apply(that, args);
            });
        },

        createWrapper: function () {
            var that = this;

            that.$wrapper = $('<div class="suggestions-wrapper"/>');
            that.el.after(that.$wrapper);

            that.$wrapper.add(that.options.$helpers).on('mousedown' + eventNS, $.proxy(that.onMousedown, that));
        },

        removeWrapper: function () {
            var that = this;

            that.$wrapper.remove();
            $(that.options.$helpers).off(eventNS);
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

        scrollToTop: function () {
            var that = this,
                scrollTarget = that.options.scrollOnFocus;

            if (scrollTarget === true) {
                scrollTarget = that.el;
            }
            if (scrollTarget instanceof $ && scrollTarget.length > 0) {
                $('body,html').animate({
                    scrollTop: scrollTarget.offset().top
                }, 'fast');
            }
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

            that.notify('setOptions');
        },

        // Common public methods

        fixPosition: function () {
            var that = this,
                elLayout = {},
                wrapperOffset,
                origin;

            that.isMobile = that.$viewport.width() <= that.options.mobileWidth;

            that.notify('resetPosition');
            // reset input's padding to default, determined by css
            that.el.css('paddingLeft', '');
            that.el.css('paddingRight', '');
            elLayout.paddingLeft = parseFloat(that.el.css('paddingLeft'));
            elLayout.paddingRight = parseFloat(that.el.css('paddingRight'));

            $.extend(elLayout, that.el.offset());
            elLayout.borderTop = that.el.css('border-top-style') == 'none' ? 0 : parseFloat(that.el.css('border-top-width'));
            elLayout.borderLeft = that.el.css('border-left-style') == 'none' ? 0 : parseFloat(that.el.css('border-left-width'));
            elLayout.innerHeight = that.el.innerHeight();
            elLayout.innerWidth = that.el.innerWidth();
            elLayout.outerHeight = that.el.outerHeight();
            elLayout.componentsLeft = 0;
            elLayout.componentsRight = 0;
            wrapperOffset = that.$wrapper.offset();

            origin = {
                top: elLayout.top - wrapperOffset.top,
                left: elLayout.left - wrapperOffset.left
            };

            that.notify('fixPosition', origin, elLayout);

            if (elLayout.componentsLeft > elLayout.paddingLeft) {
                that.el.css('paddingLeft', elLayout.componentsLeft + 'px');
            }
            if (elLayout.componentsRight > elLayout.paddingRight) {
                that.el.css('paddingRight', elLayout.componentsRight + 'px');
            }
        },

        clearCache: function () {
            this.cachedResponse = {};
            this.enrichmentCache = {};
            this.badQueries = [];
        },

        clear: function () {
            var that = this;
            
            that.clearCache();
            that.currentValue = '';
            that.selection = null;
            that.hide();
            that.suggestions = [];
            that.el.val('');
            that.el.trigger('suggestions-clear');
            that.notify('clear');
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
                query = that.el.val();

            if (this.isQueryRequestable(query)) {
                that.updateSuggestions(query);
            } else {
                that.hide();
            }
        },

        setSuggestion: function(suggestion){
            var that = this,
                value;

            if ($.isPlainObject(suggestion)) {
                value = suggestion.value || '';
                that.currentValue = value;
                that.el.val(value);
                that.selection = suggestion;
                that.suggestions = [suggestion];
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

        isQueryRequestable: function (query) {
            var that = this,
                result;

            result = query.length >= that.options.minChars;
            if (that.type.isQueryRequestable) {
                result = result && that.type.isQueryRequestable.call(that, query);
            }

            return result;
        },

        constructRequestParams: function (query, customParams){
            var that = this,
                options = that.options,
                params = $.isFunction(options.params)
                    ? options.params.call(that.element, query)
                    : $.extend({}, options.params);

            if (that.type.constructRequestParams) {
                $.extend(params, that.type.constructRequestParams.call(that));
            }
            $.each(that.notify('requestParams'), function(i, hookParams){
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

            that.dataPhase = that.getSuggestions(query)
                .done(function(suggestions){
                    that.assignSuggestions(suggestions, query);
                })
        },

        /**
         * Get suggestions from cache or from server
         * @param {String} query
         * @param {Object} customParams parameters specified here will be passed to request body
         * @param {Object} requestOptions
         *          - noCallbacks flag, request competence callbacks will not be invoked
         *          - useEnrichmentCache flag
         * @return {$.Deferred} waiter which is to be resolved with suggestions as argument
         */
        getSuggestions: function (query, customParams, requestOptions) {
            var response,
                that = this,
                options = that.options,
                noCallbacks = requestOptions && requestOptions.noCallbacks,
                useEnrichmentCache = requestOptions && requestOptions.useEnrichmentCache,
                params = that.constructRequestParams(query, customParams),
                cacheKey = $.param(params || {}),
                resolver = $.Deferred();

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
                        that.doGetSuggestions(params)
                            .done(function (response) {
                                // if response is correct and current value has not been changed
                                if (that.processResponse(response) && query == that.currentValue) {

                                    // Cache results if cache is not disabled:
                                    if (!options.noCache) {
                                        if (useEnrichmentCache) {
                                            that.enrichmentCache[query] = response.suggestions[0];
                                        } else {
                                            that.enrichResponse(response, query);
                                            that.cachedResponse[cacheKey] = response;
                                            if (options.preventBadQueries && response.suggestions.length === 0) {
                                                that.badQueries.push(query);
                                            }
                                        }
                                    }

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
            var that = this,
                request = $.ajax(
                    that.getAjaxParams('suggest', { data: utils.serialize(params) })
                );

            that.abortRequest();
            that.currentRequest = request;
            that.notify('request');

            request.always(function () {
                that.currentRequest = null;
                that.currentRequestIsEnrich = false;
                that.notify('request');
            });

            return request;
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
         * Checks response format and data
         * @return {Boolean} response contains acceptable data
         */
        processResponse: function (response) {
            var that = this;

            if (!response || !$.isArray(response.suggestions)) {
                return false;
            }

            that.verifySuggestionsFormat(response.suggestions);
            that.setUnrestrictedValues(response.suggestions);

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
            that.notify('assignSuggestions', query);
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

        areSuggestionsSame: function (a, b) {
            return a && b &&
                a.value === b.value &&
                utils.areSame(a.data, b.data);
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

//include "addon.js"

//include "constraints.js"

//include "select.js"

//include "bounds.js"

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
