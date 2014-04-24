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
        };

//include "utils.js"

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
        var that = this,
            defaults = {
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
                deferRequestBy: 0,
                params: {},
                paramName: 'query',
                formatResult: Suggestions.formatResult,
                delimiter: null,
                noCache: false,
                containerClass: 'suggestions-suggestions',
                tabDisabled: false,
                triggerSelectOnSpace: true,
                preventBadQueries: false,
                usePreloader: true,
                hint: Suggestions.defaultHint,
                useDadata: true,
                type: null,
                count: Suggestions.defaultCount,
                constraints: null,
                $helpers: null
            };

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
        that.currentEnrichRequest = null;
        that.onChangeTimeout = null;
        that.$wrapper = null;
        that.options = $.extend({}, defaults, options);
        that.classes = {
            hint: 'suggestions-hint',
            selected: 'suggestions-selected',
            suggestion: 'suggestions-suggestion',
            removeConstraint: 'suggestions-remove'
        };
        that.selection = null;
        that.$viewport = $(window);
        that.matchers = [utils.matchByNormalizedQuery, utils.matchByWords];
        that.type = null;

        // Initialize and set options:
        that.initialize();
        that.setOptions(options);
    }

    Suggestions.utils = utils;

    Suggestions.formatResult = function (suggestion, currentValue) {
        var pattern = '(^|\\s+)(' + utils.escapeRegExChars(currentValue) + ')';
        return suggestion.value.replace(new RegExp(pattern, 'gi'), '$1<strong>$2<\/strong>');
    };

    Suggestions.defaultHint = 'Выберите вариант ниже или продолжите ввод';

    Suggestions.defaultCount = 10;

    $.Suggestions = Suggestions;

    Suggestions.prototype = {

        // Creation and destruction

        initialize: function () {
            var that = this;

            // Remove autocomplete attribute to prevent native suggestions:
            that.element.setAttribute('autocomplete', 'off');

            that.uniqueId = utils.uniqueId('i');

            that.createWrapper();
            that.applyHooks(initializeHooks);

            that.bindWindowEvents();

            that.fixPosition();
        },

        dispose: function () {
            var that = this;
            that.applyHooks(disposeHooks);
            that.el.removeData(dataAttrKey);
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

            // reset input's padding to default, determined by css
            that.el.css('paddingLeft', '');
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
            utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
            that.hide();
        },

        enable: function () {
            this.disabled = false;
        },

        setSuggestion: function(suggestion){
            var that = this;

            if ($.isPlainObject(suggestion) && suggestion.value) {
                that.currentValue = suggestion.value;
                that.el.val(suggestion.value);
                that.selection = suggestion;
                utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
            }
        },

        // Querying related methods

        getAjaxParams: function (method) {
            var that = this,
                token = $.trim(that.options.token),
                serviceUrl = that.options.serviceUrl,
                serviceMethod = serviceMethods[method],
                params = $.extend({}, serviceMethod.defaultParams);

            if (!/\/$/.test(serviceUrl)) {
                serviceUrl += '/';
            }
            serviceUrl += method;
            if (serviceMethod.addTypeInUrl) {
                serviceUrl += '/' + that.type.urlSuffix;
            }

            params.url = serviceUrl;

            if (token) {
                params.headers = {
                    'Authorization': 'Token ' + token
                }
            }
            return params;
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

        constructRequestParams: function(q){
            var that = this,
                options = that.options,
                params = $.extend({}, options.params);

            $.each(that.applyHooks(requestParamsHooks), function(i, hookParams){
                $.extend(params, hookParams);
            });
            params[options.paramName] = q;
            if ($.isNumeric(options.count) && options.count > 0) {
                params.count = options.count;
            }

            return params;
        },

        getSuggestions: function (q) {
            var response,
                that = this,
                options = that.options,
                serviceUrl = options.serviceUrl,
                params = that.constructRequestParams(q),
                cacheKey;

            cacheKey = serviceUrl + '?' + $.param(params || {});
            response = that.cachedResponse[cacheKey];
            if (response && $.isArray(response.suggestions)) {
                that.assignSuggestions(response.suggestions, q);
            } else if (!that.isBadQuery(q)) {
                if (options.onSearchStart.call(that.element, params) === false) {
                    return;
                }
                utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
                that.showPreloader();
                that.currentRequest = $.ajax(
                        $.extend(that.getAjaxParams('suggest'), {
                            data: utils.serialize(params)
                        })
                    ).always(function () {
                        that.currentRequest = null;
                    }).done(function (response) {
                        that.enrichService.enrichResponse.call(that, response, q)
                            .done(function (enrichedResponse) {
                                that.processResponse(enrichedResponse, q, cacheKey);
                                options.onSearchComplete.call(that.element, q, enrichedResponse.suggestions);
                                that.hidePreloader();
                            })
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        options.onSearchError.call(that.element, q, jqXHR, textStatus, errorThrown);
                        that.hidePreloader();
                    });
            }
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

        verifySuggestionsFormat: function (suggestions) {
            // If suggestions is string array, convert them to supported format:
            if (suggestions.length && typeof suggestions[0] === 'string') {
                return $.map(suggestions, function (value) {
                    return { value: value, data: null };
                });
            }

            return suggestions;
        },

        processResponse: function (response, originalQuery, cacheKey) {
            var that = this,
                options = that.options;

            if (!response || !$.isArray(response.suggestions)) {
                return;
            }

            response.suggestions = that.verifySuggestionsFormat(response.suggestions);

            // Cache results if cache is not disabled:
            if (!options.noCache) {
                that.cachedResponse[cacheKey] = response;
                if (options.preventBadQueries && response.suggestions.length === 0) {
                    that.badQueries.push(originalQuery);
                }
            }

            // Return if originalQuery is not matching current query:
            if (originalQuery !== that.getQuery(that.currentValue)) {
                return;
            }

            that.assignSuggestions(response.suggestions, originalQuery);
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

        findSuggestionIndex: function (query) {
            var that = this,
                index = -1,
                stopwords = that.type.STOPWORDS || [];

            if (query.trim() !== '') {
                $.each(that.matchers, function(i, matcher) {
                    index = matcher(query, that.suggestions, stopwords);
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
