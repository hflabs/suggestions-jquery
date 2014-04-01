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
        utils = (function () {
            var uniqueId = 0;
            return {
                escapeRegExChars: function (value) {
                    return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                },
                getDefaultType: function () {
                    return ($.support.cors ? 'POST' : 'GET');
                },
                getDefaultContentType: function () {
                    return ($.support.cors ? 'application/json' : 'application/x-www-form-urlencoded');
                },
                serialize: function (data) {
                    if ($.support.cors) {
                        return JSON.stringify(data);
                    } else {
                        return $.param(data, true);
                    }
                },
                compact: function (array) {
                    return $.grep(array, function (el) {
                        return !!el;
                    });
                },
                delay: function (handler, delay) {
                    return setTimeout(handler, delay || 0);
                },
                uniqueId: function () {
                    return ++uniqueId;
                }
            };
        }()),

        keys = {
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            SPACE: 32,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40
        },
        types = ['NAME', 'ADDRESS'],

        eventNS = '.suggestions',
        dataAttrKey = 'suggestions',
        dadataConfig = {
            url: 'https://dadata.ru/api/v1/clean',
            timeout: 1000
        },
        tokensValid = {},
        enrichServices = {
            'default': {
                enrichSuggestion: function (suggestion) {
                    return $.Deferred().resolve(suggestion);
                },
                enrichResponse: function (response, query) {
                    return $.Deferred().resolve(response);
                }
            },
            'dadata': (function () {
                var fieldParsers = {};

                /**
                 * Values of `gender` from dadata.ru differ from ones in original suggestions
                 * @param value
                 * @returns {{gender: string}}
                 */
                fieldParsers.gender = function (value) {
                    return {
                        gender: value == 'М' ? 'MALE' :
                            value == 'Ж' ? 'FEMALE' : 'UNKNOWN'
                    }
                };

                /**
                 * Each of these fields in dadata's answer combines two fields of standard suggestion object
                 */
                $.each(['region', 'area', 'city', 'settlement', 'street'], function (i, field) {
                    function typeGoesFirst(addressPart) {
                        if (field === 'city' || field === 'settlement' || field === 'street') {
                            return true;
                        } else {
                            var typeRE = /^(г|Респ|тер|у)/i;
                            return typeRE.test(addressPart);
                        }
                    }

                    fieldParsers[field] = function (value) {
                        var addressPartType,
                            addressPartValue,
                            result = {};
                        if (value) {
                            var addressParts = value.split(' ');
                            if (typeGoesFirst(value)) {
                                addressPartType = addressParts.shift();
                            } else {
                                addressPartType = addressParts.pop();
                            }
                            addressPartValue = addressParts.join(' ');
                        } else {
                            addressPartType = null;
                            addressPartValue = value;
                        }
                        result[field + '_type'] = addressPartType;
                        result[field] = addressPartValue;
                        return result;
                    };
                });

                var valueComposer = {
                    'NAME': function (data) {
                        return utils.compact([data.surname, data.name, data.patronymic]).join(' ');
                    },
                    'ADDRESS': function (data) {
                        return utils.compact([data.country, data.region, data.area, data.city, data.settlement, data.street,
                            utils.compact([data.house_type, data.house]).join(' '),
                            utils.compact([data.block_type, data.block]).join(' '),
                            utils.compact([data.flat_type, data.flat]).join(' ')
                        ]).join(', ');
                    }
                };

                function startRequest(query) {
                    var that = this,
                        token = $.trim(that.options.token),
                        data = {
                            structure: [that.options.type],
                            data: [
                                [ query ]
                            ]
                        };

                    that.currentRequest = $.ajax(dadataConfig.url, {
                        type: 'POST',
                        headers: {
                            'Authorization': 'Token ' + token
                        },
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(data),
                        timeout: dadataConfig.timeout
                    });
                    return that.currentRequest;
                }

                return {
                    enrichSuggestion: function (suggestion) {
                        var that = this,
                            resolver = $.Deferred();

                        // if current suggestion is from dadata, use it
                        if (suggestion.data && 'qc' in suggestion.data) {
                            return resolver.resolve(suggestion);
                        }

                        that.showPreloader();
                        that.disableDropdown();
                        startRequest.call(that, suggestion.value)
                            .always(function () {
                                that.hidePreloader();
                                that.enableDropdown();
                                that.currentRequest = null;
                            })
                            .done(function (resp) {
                                var data = resp.data,
                                    s = data && data[0] && data[0][0];

                                if (s && s.qc === 0) {
                                    if (!suggestion.data) {
                                        suggestion.data = {};
                                    }
                                    delete s.source;
                                    $.each(s, function (field, value) {
                                        if (!(field in suggestion.data)) {
                                            var parser = fieldParsers[field];
                                            if (parser) {
                                                $.extend(suggestion.data, parser(value))
                                            } else {
                                                suggestion.data[field] = value;
                                            }
                                        }
                                    });
                                }
                                resolver.resolve(suggestion);
                            })
                            .fail(function () {
                                resolver.resolve(suggestion);
                            });
                        return resolver;
                    },
                    enrichResponse: function (response, query) {
                        var that = this,
                            suggestions = response.suggestions || [],
                            resolver = $.Deferred();

                        if (suggestions.length) {
                            return resolver.resolve(response);
                        }

                        startRequest.call(that, query)
                            .always(function () {
                                that.currentRequest = null;
                            })
                            .done(function (resp) {
                                var data = resp.data,
                                    value;
                                data = data && data[0] && data[0][0];
                                if (data) {
                                    delete data.source;
                                    value = valueComposer[that.options.type](data);
                                    if (value) {
                                        $.each(fieldParsers, function (field, parser) {
                                            if (field in data) {
                                                $.extend(data, parser(data[field]));
                                            }
                                        });
                                        response.suggestions = [
                                            {
                                                value: value,
                                                data: data
                                            }
                                        ];
                                    }
                                }
                                resolver.resolve(response);
                            })
                            .fail(function () {
                                resolver.resolve(response);
                            });
                        return resolver;
                    }
                }
            }())
        };

    function Suggestions(el, options) {
        var that = this,
            defaults = {
                autoSelectFirst: false,
                serviceUrl: null,
                onSelect: null,
                onInvalidateSelection: $.noop,
                onSearchStart: $.noop,
                onSearchComplete: $.noop,
                onSearchError: $.noop,
                minChars: 1,
                width: 'auto',
                zIndex: 9999,
                maxHeight: 300,
                deferRequestBy: 0,
                params: {},
                paramName: 'query',
                ignoreParams: false,
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
                constraints: null
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
        that.onChangeTimeout = null;
        that.$wrapper = null;
        that.$preloader = null;
        that.$constraints = null;
        that.options = $.extend({}, defaults, options);
        that.classes = {
            hint: 'suggestions-hint',
            selected: 'suggestions-selected',
            suggestion: 'suggestions-suggestion',
            removeConstraint: 'suggestions-remove'
        };
        that.selection = null;
        that.$viewport = $(window);
        that.cancelBlur = false;
        that.cancelFocus = false;
        that.enrichService = enrichServices.default;
        that.dropdownDisabled = false;
        that.expectedComponents = [];
        that.constraints = {};
        that.initialPaddingLeft = 0;
        that.uniqueId = utils.uniqueId();
        that._waitingForTriggerSelectOnSpace = false;
        that._constraintsUpdating = false;
        that._lastPressedKeyCode = 0;

        // Initialize and set options:
        that.initialize();
        that.setOptions(options);
    }

    Suggestions.utils = utils;

    Suggestions.formatResult = function (suggestion, currentValue) {
        var pattern = '(^|\\s+)(' + utils.escapeRegExChars(currentValue) + ')';
        return suggestion.value.replace(new RegExp(pattern, 'gi'), '$1<strong>$2<\/strong>');
    };

    Suggestions.resetTokens = function () {
        tokensValid = {};
    };

    Suggestions.defaultHint = 'Выберите вариант ниже или продолжите ввод';

    Suggestions.dadataConfig = dadataConfig;

    Suggestions.defaultCount = 10;

    $.Suggestions = Suggestions;

    Suggestions.prototype = {

        // Creation and destruction

        initialize: function () {
            var that = this;

            // Remove autocomplete attribute to prevent native suggestions:
            that.element.setAttribute('autocomplete', 'off');
            that.initialPaddingLeft = parseFloat(that.el.css('padding-left')) || 0;

            that.createWrapper();
            that.createPreloader();
            that.createConstraints();
            that.createContainer();

            that.bindElementEvents();
            that.bindWindowEvents();

            that.fixPosition();
        },

        dispose: function () {
            var that = this;
            that.unbindElementEvents();
            that.el.removeData(dataAttrKey)
            that.unbindWindowEvents();
            that.removeWrapper();
        },

        createWrapper: function () {
            var that = this;

            that.$wrapper = $('<div class="suggestions-wrapper"/>');
            that.el.after(that.$wrapper);
        },

        createPreloader: function () {
            var that = this;

            that.$preloader = $('<i class="suggestions-preloader"/>');
            that.$wrapper.append(that.$preloader);
        },

        createConstraints: function () {
            var that = this;

            that.$constraints = $('<ul class="suggestions-constraints"/>');
            that.$wrapper.append(that.$constraints);
            that.$constraints.on('click', '.' + that.classes.removeConstraint, $.proxy(that.onConstraintRemoveClick, that));
        },

        createContainer: function () {
            var that = this,
                suggestionSelector = '.' + that.classes.suggestion,
                options = that.options,
                $container = $('<div/>')
                    .addClass(options.containerClass)
                    .css({
                        position: 'absolute',
                        display: 'none'
                    });

            that.$container = $container;
            that.$wrapper.append($container);

            // Only set width if it was provided:
            if (options.width !== 'auto') {
                $container.width(options.width);
            }

            $container.on('mousedown' + eventNS, suggestionSelector, $.proxy(that.onSuggestionMousedown, that));
            $container.on('mouseover' + eventNS, suggestionSelector, $.proxy(that.onSuggestionMouseover, that));
            $container.on('click' + eventNS, suggestionSelector, $.proxy(that.onSuggestionClick, that));
            $container.on('mouseout' + eventNS, $.proxy(that.onSuggestionsMouseout, that));
        },

        bindElementEvents: function () {
            var that = this;

            that.el.on('keydown' + eventNS, $.proxy(that.onElementKeyDown, that));
            that.el.on('keyup' + eventNS, $.proxy(that.onElementKeyUp, that));
            that.el.on('blur' + eventNS, $.proxy(that.onElementBlur, that));
            that.el.on('focus' + eventNS, $.proxy(that.onElementFocus, that));
            that.el.on('change' + eventNS, $.proxy(that.onElementKeyUp, that));
        },

        unbindElementEvents: function () {
            this.el.off(eventNS);
        },

        bindWindowEvents: function () {
            var that = this;
            that.$viewport.on('resize' + eventNS + that.uniqueId, $.proxy(that.fixPosition, that));
        },

        unbindWindowEvents: function () {
            this.$viewport.off('resize' + eventNS + this.uniqueId);
        },

        removeWrapper: function () {
            this.$wrapper.remove();
        },

        // Element event handlers

        onElementBlur: function () {
            var that = this;
            // suggestion was clicked, blur should be ignored
            // see container mousedown handler
            if (that.cancelBlur) {
                delete that.cancelBlur;
                return;
            }
            that.selectCurrentValue({noSpace: true});
        },

        onElementFocus: function () {
            var that = this;
            if (!that.cancelFocus) {
                that.fixPosition();
                if (that.options.minChars <= that.el.val().length) {
                    that.onValueChange();
                }
            }
            that.cancelFocus = false;
        },

        onElementKeyDown: function (e) {
            var that = this,
                index;

            that._lastPressedKeyCode = e.which;

            // If suggestions are hidden and user presses arrow down, display suggestions:
            if (!that.disabled && !that.visible && e.which === keys.DOWN && that.currentValue) {
                that.suggest();
                return;
            }

            if (that.disabled || !that.visible) {
                return;
            }

            switch (e.which) {
                case keys.ESC:
                    that.el.val(that.currentValue);
                    that.hide();
                    break;

                case keys.RIGHT:
                    return;

                case keys.TAB:
                    if (that.selectedIndex === -1) {
                        that.hide();
                        return;
                    }
                    that.select(that.selectedIndex, {noSpace: true});
                    if (that.options.tabDisabled === false) {
                        return;
                    }
                    break;

                case keys.RETURN:
                    that.selectCurrentValue({noHide: true});
                    break;

                case keys.SPACE:
                    if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                        index = that.selectCurrentValue({noHide: true, noSpace: true});
                        that._waitingForTriggerSelectOnSpace = index !== -1;
                    }
                    return;
                case keys.UP:
                    that.moveUp();
                    break;
                case keys.DOWN:
                    that.moveDown();
                    break;
                default:
                    return;
            }

            // Cancel event if function did not return:
            e.stopImmediatePropagation();
            e.preventDefault();
        },

        onElementKeyUp: function (e) {
            var that = this;

            if (that.disabled) {
                return;
            }

            switch (e.which) {
                case keys.UP:
                case keys.DOWN:
                    return;
            }

            clearTimeout(that.onChangeTimeout);

            if (that.currentValue !== that.el.val()) {
                if (that.options.deferRequestBy > 0) {
                    // Defer lookup in case when value changes very quickly:
                    that.onChangeTimeout = utils.delay(function () {
                        that.onValueChange();
                    }, that.options.deferRequestBy);
                } else {
                    that.onValueChange();
                }
            }
        },

        onValueChange: function () {
            var that = this,
                options = that.options,
                value = that.el.val(),
                query = that.getQuery(value);

            if (that.selection) {
                (options.onInvalidateSelection || $.noop).call(that.element, that.selection);
                that.selection = null;
            }

            clearTimeout(that.onChangeTimeout);
            that.currentValue = value;
            that.selectedIndex = -1;

            if (query.length < options.minChars) {
                that.hide();
            } else {
                that.getSuggestions(query);
            }
        },

        // Suggestions event handlers

        /** This whole handler is needed to prevent blur event on textbox
         * when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
         * See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
         */
        onSuggestionMousedown: function (event) {
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
                        if (event.target !== that.element && !$.contains(that.$wrapper[0], event.target)) {
                            that.hide();
                        }
                    });
                });
            }
        },

        /**
         * Listen for mouse over event on suggestions list:
         */
        onSuggestionMouseover: function (e) {
            this.activate(this.getClosestSuggestionIndex(e.target));
        },

        /**
         * Listen for click event on suggestions list:
         */
        onSuggestionClick: function (e) {
            var that = this;
            if (!that.dropdownDisabled) {
                that.select(that.getClosestSuggestionIndex(e.target), {noHide: true});
            }
            that.cancelFocus = true;
            that.el.focus();
        },

        /**
         * Deselect active element when mouse leaves suggestions container:
         */
        onSuggestionsMouseout: function () {
            this.deactivate(false);
        },

        // Constraints event handlers

        onConstraintRemoveClick: function (e) {
            var that = this,
                $item = $(e.target).closest('li'),
                key = $item.attr('data-key');
            $item.fadeOut('fast', function () {
                that.removeConstraint(key);
            });
        },

        // Configuration methods

        setOptions: function (suppliedOptions) {
            var that = this,
                options = that.options;

            $.extend(options, suppliedOptions);

            // Adjust height, width and z-index:
            that.$container.css({
                'max-height': options.maxHeight + 'px',
                'z-index': options.zIndex,
                'width': options.width
            });

            that.checkToken();
            that.selectEnrichService();
            that.selectExpectedComponents();
            that.setupConstraints();
        },

        checkToken: function () {
            var that = this,
                token = $.trim(that.options.token),
                tokenValid = tokensValid[token],
                onTokenReady = function () {
                    that.checkToken();
                },
                serviceUrl;

            if (token) {
                if (tokenValid && $.isFunction(tokenValid.promise)) {
                    switch (tokenValid.state()) {
                        case 'resolved':
                            that.enable();
                            break;
                        case 'rejected':
                            that.disable();
                            break;
                        default:
                            tokenValid.always(onTokenReady);
                    }
                } else {
                    serviceUrl = that.options.serviceUrl;
                    if ($.isFunction(serviceUrl)) {
                        serviceUrl = serviceUrl.call(that.element);
                    }
                    tokensValid[token] = $.ajax(
                        $.extend(that.getAjaxParams(), {
                            url: serviceUrl
                        })
                    ).always(onTokenReady);
                }
            }
        },

        selectEnrichService: function () {
            var that = this,
                type = that.options.type,
                token = $.trim(that.options.token);

            if (that.options.useDadata && type && types.indexOf(type) >= 0 && token) {
                that.enrichService = enrichServices.dadata;
            } else {
                that.enrichService = enrichServices.default;
            }
        },

        selectExpectedComponents: function () {
            var that = this,
                type = that.options.type,
                params = that.options.params;

            switch (type) {
                case 'NAME':
                    that.expectedComponents = $.map(params && params.parts || ['surname', 'name', 'patronymic'], function (part) {
                        return part.toLowerCase();
                    });
                    break;
                case 'ADDRESS':
                    that.expectedComponents = ['house'];
                    break;
                default:
                    that.expectedComponents = [];
            }
        },

        setupConstraints: function () {
            var that = this,
                constraints = that.options.constraints;

            if (!constraints) {
                return;
            }
            that._constraintsUpdating = true;
            $.each(that.constraints, function (key) {
                if (!(key in constraints)) {
                    that.removeConstraint(key);
                }
            });
            $.each(constraints, $.proxy(that.addConstraint, that));
            that._constraintsUpdating = false;
            that.fixPosition();
        },

        // Common public methods

        fixPosition: function () {
            var that = this,
                borderTop = that.el.css('border-top-style') == 'none' ? 0 : parseFloat(that.el.css('border-top-width')),
                borderLeft = that.el.css('border-left-style') == 'none' ? 0 : parseFloat(that.el.css('border-left-width')),
                elOffset = that.el.offset(),
                elInnerHeight,
                wrapperOffset = that.$wrapper.offset(),
                origin = {
                    top: elOffset.top - wrapperOffset.top,
                    left: elOffset.left - wrapperOffset.left
                };

            elInnerHeight = that.el.innerHeight();

            that.$container.css({
                left: origin.left + 'px',
                top: origin.top + borderTop + elInnerHeight + 'px',
                width: (that.options.width === 'auto' ? that.el.outerWidth() : that.options.width) + 'px'
            });

            that.$preloader.css({
                left: origin.left + borderLeft + that.el.innerWidth() - that.$preloader.width() - 4 + 'px',
                top: origin.top + Math.round((elInnerHeight - that.$preloader.height()) / 2) + 'px'
            });

            that.$constraints.css({
                left: origin.left + that.initialPaddingLeft + 'px',
                top: origin.top + Math.round((elInnerHeight - that.$constraints.height()) / 2) + 'px'
            });

            that.el.css({
                'paddingLeft': that.initialPaddingLeft + that.$constraints.outerWidth(true) + 'px'
            });

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
            if (that.currentRequest) {
                that.currentRequest.abort();
            }
            that.hide();
        },

        enable: function () {
            this.disabled = false;
        },

        // Querying related methods

        getAjaxParams: function () {
            var that = this,
                params,
                token = $.trim(that.options.token);

            params = {
                type: utils.getDefaultType(),
                dataType: 'json',
                contentType: utils.getDefaultContentType()
            };
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

        getSuggestions: function (q) {
            var response,
                that = this,
                options = that.options,
                serviceUrl = options.serviceUrl,
                params = null,
                cacheKey;

            if (!options.ignoreParams) {
                params = $.extend({}, options.params);
                params[options.paramName] = q;
                if ($.isNumeric(options.count) && options.count > 0) {
                    params.count = options.count;
                }
            }

            if ($.isFunction(serviceUrl)) {
                serviceUrl = serviceUrl.call(that.element, q);
            }
            cacheKey = serviceUrl + '?' + $.param(params || {});
            response = that.cachedResponse[cacheKey];
            if (response && $.isArray(response.suggestions)) {
                that.suggestions = response.suggestions;
                that.trySelectOnSpace(q);
                that.suggest();
            } else if (!that.isBadQuery(q)) {
                if (options.onSearchStart.call(that.element, options.params) === false) {
                    return;
                }
                if (that.currentRequest) {
                    that.currentRequest.abort();
                }
                that.showPreloader();
                that.currentRequest = $.ajax(
                        $.extend(that.getAjaxParams(), {
                            url: serviceUrl,
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

            that.suggestions = response.suggestions;
            that.trySelectOnSpace(originalQuery);
            that.suggest();
        },

        // Preloader UI methods

        showPreloader: function () {
            if (this.options.usePreloader) {
                this.$preloader
                    .stop(true)
                    .delay(50)
                    .animate({'opacity': 1}, 'fast');
            }
        },

        hidePreloader: function () {
            if (this.options.usePreloader) {
                this.$preloader
                    .stop(true)
                    .animate({'opacity': 0}, 'fast');
            }
        },

        // Dropdown UI methods

        getClosestSuggestionIndex: function(el) {
            var that = this,
                $item = $(el),
                selector = '.' + that.classes.suggestion + '[data-index]';
            if (!$item.is(selector)) {
                $item = $item.closest(selector);
            }
            return $item.data('index');
        },

        getSuggestionsItems: function () {
            return this.$container.children('.' + this.classes.suggestion);
        },

        toggleDropdownEnabling: function (enable) {
            this.dropdownDisabled = !enable;
            this.$container.attr('disabled', !enable);
        },

        disableDropdown: function () {
            this.toggleDropdownEnabling(false);
        },

        enableDropdown: function () {
            this.toggleDropdownEnabling(true);
        },

        /**
         * Shows if there are any suggestions besides currently selected
         * @returns {boolean}
         */
        hasSuggestionsToChoose: function () {
            var that = this;
            return that.suggestions.length > 1 ||
                (that.suggestions.length === 1 &&
                    (!that.selection || $.trim(that.suggestions[0].value) != $.trim(that.selection.value))
                );
        },

        suggest: function () {
            if (!this.hasSuggestionsToChoose()) {
                this.hide();
                return;
            }

            var that = this,
                options = that.options,
                formatResult = options.formatResult,
                trimmedValue = $.trim(that.getQuery(that.currentValue)),
                beforeRender = options.beforeRender,
                html = [],
                index;

            // Build hint html
            if (options.hint && that.suggestions.length) {
                html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
            }
            // Build suggestions inner HTML:
            $.each(that.suggestions, function (i, suggestion) {
                html.push('<div class="' + that.classes.suggestion + '" data-index="' + i + '">' + formatResult(suggestion, trimmedValue) + '</div>');
            });

            that.$container.html(html.join(''));

            // Select first value by default:
            if (options.autoSelectFirst) {
                that.selectedIndex = 0;
                that.getSuggestionsItems().first().addClass(that.classes.selected);
            }

            if ($.isFunction(beforeRender)) {
                beforeRender.call(that.element, that.$container);
            }

            that.$container.show();
            that.visible = true;
        },

        hide: function () {
            var that = this;
            that.visible = false;
            that.selectedIndex = -1;
            that.$container.hide()
                .empty();
        },

        activate: function (index) {
            var that = this,
                activeItem,
                selected = that.classes.selected,
                $children;

            if (!that.dropdownDisabled) {
                $children = that.getSuggestionsItems();

                $children.removeClass(selected);

                that.selectedIndex = index;

                if (that.selectedIndex !== -1 && $children.length > that.selectedIndex) {
                    activeItem = $children.get(that.selectedIndex);
                    $(activeItem).addClass(selected);
                    return activeItem;
                }
            }

            return null;
        },

        deactivate: function (restoreValue) {
            var that = this;

            if (!that.dropdownDisabled) {
                that.selectedIndex = -1;
                that.getSuggestionsItems().removeClass(that.classes.selected);
                if (restoreValue) {
                    that.el.val(that.currentValue);
                }
            }
        },

        moveUp: function () {
            var that = this;

            if (that.dropdownDisabled) {
                return;
            }
            if (that.selectedIndex === -1) {
                if (that.suggestions.length) {
                    that.adjustScroll(that.suggestions.length - 1);
                }
                return;
            }

            if (that.selectedIndex === 0) {
                that.deactivate(true);
                return;
            }

            that.adjustScroll(that.selectedIndex - 1);
        },

        moveDown: function () {
            var that = this;

            if (that.dropdownDisabled) {
                return;
            }
            if (that.selectedIndex === (that.suggestions.length - 1)) {
                that.deactivate(true);
                return;
            }

            that.adjustScroll(that.selectedIndex + 1);
        },

        adjustScroll: function (index) {
            var that = this,
                activeItem = that.activate(index),
                offsetTop,
                upperBound,
                lowerBound,
                heightDelta = 25;

            if (!activeItem) {
                return;
            }

            offsetTop = activeItem.offsetTop;
            upperBound = that.$container.scrollTop();
            lowerBound = upperBound + that.options.maxHeight - heightDelta;

            if (offsetTop < upperBound) {
                that.$container.scrollTop(offsetTop);
            } else if (offsetTop > lowerBound) {
                that.$container.scrollTop(offsetTop - that.options.maxHeight + heightDelta);
            }

            that.el.val(that.getValue(that.suggestions[index].value));
        },

        // Constraints methods

        getConstraintItem: function (key) {
            return this.$constraints.children('[data-key="' + key + '"]');
        },

        addConstraint: function (key, value) {
            var that = this,
                $item = that.getConstraintItem(key);

            that.constraints[key] = value;
            if (!$item.length) {
                $item = $('<li><span/> <span class="suggestions-remove"/></li>').attr('data-key', key);
                that.$constraints.append($item);
            }
            $item.children().first().text(value);
            if (!that._constraintsUpdating) {
                that.fixPosition();
            }
        },

        removeConstraint: function (key) {
            var that = this;
            delete that.constraints[key];
            that.getConstraintItem(key).remove();
            if (!that._constraintsUpdating) {
                that.fixPosition();
            }
        },

        // Selecting related methods

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

        isCursorAtEnd: function () {
            var that = this,
                valLength = that.el.val().length,
                selectionStart = that.element.selectionStart,
                range;

            if (typeof selectionStart === 'number') {
                return selectionStart === valLength;
            }
            if (document.selection) {
                range = document.selection.createRange();
                range.moveStart('character', -valLength);
                return valLength === range.text.length;
            }
            return true;
        },

        findSuggestionIndex: function (query) {
            var that = this,
                index = -1,
                queryLowerCase = query.toLowerCase();

            $.each(that.suggestions, function (i, suggestion) {
                if (suggestion.value.toLowerCase() === queryLowerCase) {
                    index = i;
                    return false;
                }
            });

            return index;
        },

        selectCurrentValue: function (selectionOptions) {
            var that = this,
                index = that.selectedIndex,
                noHide = selectionOptions && selectionOptions.noHide;

            if (index === -1) {
                var value = that.getQuery(that.el.val());
                index = that.findSuggestionIndex(value);
            }
            if (index !== -1) {
                that.select(index, selectionOptions);
            } else {
                if (!noHide) {
                    that.hide();
                }
            }
        },

        hasAllExpectedComponents: function (suggestion) {
            var result = true;
            $.each(this.expectedComponents, function (i, part) {
                return result = !!suggestion.data[part];
            });
            return result;
        },

        /**
         * Selects a suggestion at specified index
         * @param index
         * @param selectionOptions  Contains flags:
         *          `noHide` prevents hiding after selection,
         *          `noSpace` - prevents adding space at the end of current value
         */
        select: function (index, selectionOptions) {
            var that = this,
                suggestion = that.suggestions[index],
                onSelectCallback = that.options.onSelect,
                noHide = selectionOptions && selectionOptions.noHide,
                noSpace = selectionOptions && selectionOptions.noSpace;

            function onSelectionCompleted() {
                if (noHide) {
                    that.selectedIndex = -1;
                    that.getSuggestions(that.currentValue);
                } else {
                    that.hide();
                    that.suggestions = [];
                }
            }

            if (!suggestion) {
                return;
            }

            that.currentValue = that.getValue(suggestion.value);
            if (!noSpace && !that.hasAllExpectedComponents(suggestion)) {
                that.currentValue += ' ';
            }
            that.el.val(that.currentValue);
            that.selection = suggestion;

            // if onSelect exists, trigger it with enriched suggestion
            if ($.isFunction(onSelectCallback)) {
                that.enrichService.enrichSuggestion.call(that, suggestion)
                    .done(function (enrichedSuggestion) {
                        onSelectCallback.call(that.element, enrichedSuggestion);
                        onSelectionCompleted();
                    });
            } else {
                onSelectionCompleted();
            }
        },

        trySelectOnSpace: function (value) {
            var that = this,
                rLastSpace = /\s$/,
                index;

            if (that.options.triggerSelectOnSpace &&
                that._waitingForTriggerSelectOnSpace &&
                that._lastPressedKeyCode == keys.SPACE &&
                rLastSpace.test(value)
                ) {
                index = that.findSuggestionIndex(value.replace(rLastSpace, ''));
                if (index !== -1) {
                    that._waitingForTriggerSelectOnSpace = false;
                    that.select(index, {noHide: true});
                }
            }
        }

    };

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
