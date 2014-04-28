/**
 * DaData.ru Suggestions jQuery plugin, version 4.3.4
 *
 * DaData.ru Suggestions jQuery plugin is freely distributable under the terms of MIT-style license
 * Built on DevBridge Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)
 * For details, see https://github.com/hflabs/suggestions-jquery
 */
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
                abortRequests: function(){
                    $.each(arguments, function(i, request){
                        if (request) {
                            request.abort();
                        }
                    })
                },
                /**
                 * Returns array1 minus array2
                 */
                arrayMinus: function(array1, array2) {
                    return $.grep(array1, function(el, i){
                        return $.inArray(el, array2) === -1;
                    });
                },
                clearDelimeters: function(str) {
                    return str.toLowerCase()
                        .replace(/[.,]/g, " ")
                        .replace(/\s\s+/g, " ");
                },
                /**
                 * Returns array of words in string except the stopwords.
                 * If last word is a stopword, it is NOT removed.
                 */
                getWords: function(str, stopwords) {
                    stopwords = stopwords || [];
                    var words = utils.clearDelimeters(str).split(" ");
                    var lastWord = words.pop();
                    var goodWords = $.grep(words, function(word, i){
                        return word !== '' && stopwords.indexOf(word) === -1;
                    });
                    goodWords.push(lastWord);
                    return goodWords;
                },
                /**
                 * Returns normalized string without stopwords
                 */
                normalize: function(str, stopwords) {
                    var that = this;
                    return that.getWords(str.toLowerCase(), stopwords).join(' ');
                },
                /**
                 * Returns true if str1 includes str2 plus something else, false otherwise.
                 */
                stringEncloses: function(str1, str2) {
                    return str1.indexOf(str2) !== -1 && str1.length > str2.length;
                },
                haveSameParent: function(suggestions) {
                    if (suggestions.length === 0) {
                        return false;
                    } else if (suggestions.length === 1) {
                        return true;
                    } else {
                        var parentValue = suggestions[0].value;
                        var aliens = $.grep(suggestions, function(suggestion) {
                            return suggestion.value.indexOf(parentValue) === 0;
                        }, true);
                        return aliens.length === 0;
                    }
                },
                /**
                 * Matches query against suggestions, removing all the stopwords.
                 */
                matchByNormalizedQuery: function(query, suggestions, stopwords) {
                    var index = -1,
                        queryLowerCase = query.toLowerCase();

                    // match query with suggestions
                    var normalizedQuery = utils.normalize(queryLowerCase, stopwords);
                    var matches = [];
                    $.each(suggestions, function(i, suggestion) {
                        var suggestedValue = suggestion.value.toLowerCase();
                        // if query encloses suggestion, than it has already been selected
                        // so we should not select it anymore
                        if (utils.stringEncloses(queryLowerCase, suggestedValue)) {
                            return false;
                        }
                        if (normalizedQuery === utils.normalize(suggestedValue, stopwords)) {
                            matches.push(i);
                        }
                    });

                    if (matches.length === 1) {
                        index = matches[0];
                    }

                    return index;
                },
                /**
                 * Matches query against suggestions word-by-word (with respect to stopwords).
                 * Matches if query words are a subset of suggested words.
                 */
                matchByWords: function(query, suggestions, stopwords) {
                    var index = -1,
                        queryLowerCase = query.toLowerCase();

                    var sameParent = utils.haveSameParent(suggestions);
                    if (sameParent) {
                        $.each(suggestions, function(i, suggestion) {
                            var suggestedValue = suggestion.value.toLowerCase();
                            if (utils.stringEncloses(queryLowerCase, suggestedValue)) {
                                return false;
                            }
                            // check if query words are a subset of suggested words
                            var queryWords = utils.getWords(queryLowerCase, stopwords);
                            var suggestionWords = utils.getWords(suggestedValue, stopwords);
                            if (utils.arrayMinus(queryWords, suggestionWords).length === 0) {
                                index = i;
                                return false;
                            }
                        });
                    }

                    return index;
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
        enrichServices = {},
        STOPWORDS = {
            'NAME': [],
            'ADDRESS': ['ао', 'аобл', 'дом', 'респ', 'а/я', 'аал', 'автодорога', 'аллея', 'арбан', 'аул', 'б-р', 'берег', 'бугор', 'вал', 'вл', 'волость', 'въезд', 'высел', 'г', 'городок', 'гск', 'д', 'двлд', 'днп', 'дор', 'дп', 'ж/д_будка', 'ж/д_казарм', 'ж/д_оп', 'ж/д_платф', 'ж/д_пост', 'ж/д_рзд', 'ж/д_ст', 'жилзона', 'жилрайон', 'жт', 'заезд', 'заимка', 'зона', 'к', 'казарма', 'канал', 'кв', 'кв-л', 'км', 'кольцо', 'комн', 'кордон', 'коса', 'кп', 'край', 'линия', 'лпх', 'м', 'массив', 'местность', 'мкр', 'мост', 'н/п', 'наб', 'нп', 'обл', 'округ', 'остров', 'оф', 'п', 'п/о', 'п/р', 'п/ст', 'парк', 'пгт', 'пер', 'переезд', 'пл', 'пл-ка', 'платф', 'погост', 'полустанок', 'починок', 'пр-кт', 'проезд', 'промзона', 'просек', 'просека', 'проселок', 'проток', 'протока', 'проулок', 'р-н', 'рзд', 'россия', 'рп', 'ряды', 'с', 'с/а', 'с/мо', 'с/о', 'с/п', 'с/с', 'сад', 'сквер', 'сл', 'снт', 'спуск', 'ст', 'ст-ца', 'стр', 'тер',  'тракт', 'туп', 'у', 'ул', 'уч-к', 'ф/х', 'ферма', 'х', 'ш']
        };

    enrichServices['default'] = {
        enrichSuggestion: function (suggestion) {
            return $.Deferred().resolve(suggestion);
        },
        enrichResponse: function (response, query) {
            return $.Deferred().resolve(response);
        }
    };

    enrichServices['dadata'] = (function () {
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
            fieldParsers[field] = function (value) {
                var addressPartType,
                    addressPartValue,
                    result = {};
                if (value) {
                    var addressParts = value.split(' ');
                    addressPartType = addressParts.shift();
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
                return utils.compact([data.region, data.area, data.city, data.settlement, data.street,
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
            that.currentEnrichRequest = $.ajax(dadataConfig.url, {
                type: 'POST',
                headers: {
                    'Authorization': 'Token ' + token
                },
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(data),
                timeout: dadataConfig.timeout
            }).always(function(){
                that.currentEnrichRequest = null;
            });
            return that.currentEnrichRequest;
        }

        function shouldOverrideField(field, data) {
            return !(field in data) || field === 'house' || (field === 'okato' && data[field] === "");
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
                    })
                    .done(function (resp) {
                        var data = resp.data,
                            s = data && data[0] && data[0][0];

                        if (s) {
                            if (!suggestion.data) {
                                suggestion.data = {};
                            }
                            // should enrich suggestion only if Dadata returned good qc
                            if (s.qc === 0) {
                                delete s.source;
                                $.each(s, function (field, value) {
                                    if (shouldOverrideField(field, suggestion.data)) {
                                        var parser = fieldParsers[field];
                                        if (parser) {
                                            $.extend(suggestion.data, parser(value))
                                        } else {
                                            suggestion.data[field] = value;
                                        }
                                    }
                                });
                            // but even if qc is bad, should add it to suggestion object
                            } else {
                                suggestion.data.qc = s.qc;
                                if ('qc_complete' in s) {
                                    suggestion.data.qc_complete = s.qc_complete;
                                }
                            }
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
    })();

    function Suggestions(el, options) {
        var that = this,
            defaults = {
                autoSelectFirst: false,
                serviceUrl: null,
                lookup: null,
                width: 'auto',
                minChars: 1,
                maxHeight: 300,
                deferRequestBy: 0,
                params: {},
                formatResult: Suggestions.formatResult,
                delimiter: null,
                zIndex: 9999,
                noCache: false,
                onSearchStart: $.noop,
                onSearchComplete: $.noop,
                onSearchError: $.noop,
                onSelect: null,
                onSelectNothing: null,
                containerClass: 'suggestions-suggestions',
                tabDisabled: false,
                currentRequest: null,
                currentEnrichRequest: null,
                triggerSelectOnValidInput: false,
                triggerSelectOnSpace: true,
                preventBadQueries: false,
                lookupFilter: function (suggestion, originalQuery, queryLowerCase) {
                    return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
                },
                paramName: 'query',
                transformResult: function (response) {
                    return typeof response === 'string' ? $.parseJSON(response) : response;
                },
                usePreloader: true,
                hint: Suggestions.defaultHint,
                useDadata: true,
                type: null,
                count: Suggestions.defaultCount,
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
        that.onChangeInterval = null;
        that.onChange = null;
        that.isLocal = false;
        that.suggestionsContainer = null;
        that.$wrapper = null;
        that.$preloader = null;
        that.options = $.extend({}, defaults, options);
        that.classes = {
            hint: 'suggestions-hint',
            selected: 'suggestions-selected',
            suggestion: 'suggestions-suggestion'
        };
        that.hint = null;
        that.hintValue = '';
        that.selection = null;
        that.$viewport = $(window);
        that.lastKeyPressed = null;
        that.triggeredSelectOnLastKey = false;
        that.triggeringSelectOnSpace = false;
        that.skipOnFocus = false;
        that.enrichService = enrichServices.default;
        that.dropdownDisabled = false;
        that.expectedComponents = [];
        that.matchers = [utils.matchByNormalizedQuery, utils.matchByWords];

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

        initialize: function () {
            var that = this,
                suggestionSelector = '.' + that.classes.suggestion,
                selected = that.classes.selected,
                options = that.options,
                $container;

            // Remove autocomplete attribute to prevent native suggestions:
            that.element.setAttribute('autocomplete', 'off');

            that.$wrapper = $('<div class="suggestions-wrapper"/>');
            that.el.after(that.$wrapper);

            that.$preloader = $('<i class="suggestions-preloader"/>');
            that.$wrapper.append(that.$preloader);

            that.killerFn = function (e) {
                if ($(e.target).closest('.' + that.options.containerClass).length === 0) {
                    that.killSuggestions();
                    that.disableKillerFn();
                }
            };

            $container = $('<div/>')
                .addClass(options.containerClass)
                .css({
                    position: 'absolute',
                    display: 'none'
                });
            that.$container = $container;
            that.suggestionsContainer = $container[0];
            that.$wrapper.append($container);

            // Only set width if it was provided:
            if (options.width !== 'auto') {
                $container.width(options.width);
            }

            // This whole handler is needed to prevent blur event on textbox
            // when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
            // See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
            that.$wrapper.add(that.options.$helpers).on('mousedown' + eventNS, function (event) {
                // prevent moving focus out of the text field
                event.preventDefault();

                // IE doesn't prevent moving focus even with event.preventDefault()
                // so we set a flag to know when we should ignore the blur event
                that.cancelBlur = true;
                that._delay(function () {
                    delete that.cancelBlur;
                });

                // clicking on the scrollbar causes focus to shift to the body
                // but we can't detect a mouseup or a click immediately afterward
                // so we have to track the next mousedown and close the menu if
                // the user clicks somewhere outside of the autocomplete
                if (!$(event.target).closest(".ui-menu-item").length) {
                    that._delay(function () {
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
            });

            // Listen for mouse over event on suggestions list:
            $container.on('mouseover' + eventNS, suggestionSelector, function () {
                that.activate(that.getClosestSuggestionIndex(this));
            });

            // Deselect active element when mouse leaves suggestions container:
            $container.on('mouseout' + eventNS, function () {
                if (!that.dropdownDisabled) {
                    that.selectedIndex = -1;
                    $container.children('.' + selected).removeClass(selected);
                }
            });

            // Listen for click event on suggestions list:
            $container.on('click' + eventNS, suggestionSelector, function () {
                if (!that.dropdownDisabled) {
                    that.select(that.getClosestSuggestionIndex(this));
                }
                that.skipOnFocus = true;
                that.el.focus();
            });

            that.fixPosition();

            that.fixPositionCapture = function () {
                if (that.visible) {
                    that.fixPosition();
                }
            };

            that.$viewport.on('resize' + eventNS, that.fixPositionCapture);

            that.el.on('keydown' + eventNS, function (e) {
                that.onKeyPress(e);
            });
            that.el.on('keyup' + eventNS, function (e) {
                that.onKeyUp(e);
            });
            that.el.on('blur' + eventNS, function () {
                that.onBlur();
            });
            that.el.on('focus' + eventNS, function () {
                that.onFocus();
            });
            that.el.on('change' + eventNS, function (e) {
                that.onKeyUp(e);
            });
        },

        getClosestSuggestionIndex: function(el){
            var $item = $(el),
                selector = '.' + this.classes.suggestion + '[data-index]';
            if (!$item.is(selector)) {
                $item = $item.closest(selector);
            }
            return $item.data('index');
        },

        onFocus: function () {
            var that = this;
            if (!that.skipOnFocus) {
                that.fixPosition();
                if (that.options.minChars <= that.el.val().length) {
                    that.onValueChange();
                }
            }
            that.skipOnFocus = false;
        },

        onBlur: function () {
            var that = this;
            // suggestion was clicked, blur should be ignored
            // see container mousedown handler
            if (that.cancelBlur) {
                delete that.cancelBlur;
                return;
            }
            var index = that.selectCurrentValue({ trim: true });
            that.hide();
            if (that.selection === null && index === -1) {
                that.onSelectNothing();
            }
        },

        setOptions: function (suppliedOptions) {
            var that = this,
                options = that.options;

            $.extend(options, suppliedOptions);

            that.isLocal = $.isArray(options.lookup);

            if (that.isLocal) {
                options.lookup = that.verifySuggestionsFormat(options.lookup);
            }

            // Adjust height, width and z-index:
            var styles = {
                'max-height': options.maxHeight + 'px',
                'z-index': options.zIndex
            };
            if (options.width !== 'auto') {
                styles['width'] = options.width + 'px';
            }
            that.$container.css(styles);

            that.checkToken();
            that.selectEnrichService();
            that.selectExpectedComponents();
        },

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
                    that.expectedComponents = $.map(params && params.parts || ['surname', 'name', 'patronymic'], function(part){
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

        clearCache: function () {
            this.cachedResponse = {};
            this.badQueries = [];
        },

        clear: function () {
            this.clearCache();
            this.currentValue = '';
            this.suggestions = [];
        },

        disable: function () {
            var that = this;
            that.disabled = true;
            utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
        },

        enable: function () {
            this.disabled = false;
        },

        fixPosition: function () {
            var that = this,
                borderTop = that.el.css('border-top-style') == 'none' ? 0 : parseFloat(that.el.css('border-top-width')),
                borderLeft = that.el.css('border-left-style') == 'none' ? 0 : parseFloat(that.el.css('border-left-width')),
                elOffset = that.el.offset(),
                elInnerHeight = that.el.innerHeight(),
                elInnerWidth = that.el.innerWidth(),
                wrapperOffset = that.$wrapper.offset(),
                origin = {
                    top: elOffset.top - wrapperOffset.top,
                    left: elOffset.left - wrapperOffset.left
                };

            that.$container.css({
                left: origin.left + 'px',
                top: origin.top + borderTop + elInnerHeight + 'px',
                width: (that.options.width === 'auto' ? that.el.outerWidth() : that.options.width) + 'px'
            });

            that.$preloader.css({
                left: origin.left + borderLeft + elInnerWidth - that.$preloader.width() - 4 + 'px',
                top: origin.top + Math.round((elInnerHeight - that.$preloader.height()) / 2) + 'px'
            });
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

        onKeyPress: function (e) {
            var that = this,
                index;

            that.triggeredSelectOnLastKey = false;
            that.triggeringSelectOnSpace = false;
            that.lastKeyPressed = e.which;

            // If suggestions are hidden and user presses arrow down, display suggestions:
            if (!that.disabled && !that.visible && e.which === keys.DOWN && that.currentValue) {
                that.suggest();
                return;
            }

            if (that.disabled || !that.visible) {
                // no suggestions avaliable and user pressed Enter
                if (e.which === keys.RETURN) {
                    that.onSelectNothing();
                }
                return;
            }

            switch (e.which) {
                case keys.ESC:
                    that.el.val(that.currentValue);
                    that.hide();
                    break;
                case keys.RIGHT:
                    if (that.hint && that.options.onHint && that.isCursorAtEnd()) {
                        that.selectHint();
                        break;
                    }
                    return;
                case keys.TAB:
                    if (that.hint && that.options.onHint) {
                        that.selectHint();
                        return;
                    }
                    if (that.options.tabDisabled === false) {
                        return;
                    }
                    break;
                case keys.RETURN:
                    index = that.selectCurrentValue({ trim: true });
                    if (index === -1) {
                        that.hide();
                        that.onSelectNothing();
                        return;
                    } else {
                        that.triggeredSelectOnLastKey = true;
                    }
                    break;
                case keys.SPACE:
                    if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                        that.triggeringSelectOnSpace = true;
                        index = that.selectCurrentValue({ noHide: true });
                        if (index !== -1) {
                            that.triggeredSelectOnLastKey = true;
                        }
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

        onKeyUp: function (e) {
            var that = this;

            if (that.disabled) {
                return;
            }

            switch (e.which) {
                case keys.UP:
                case keys.DOWN:
                    return;
            }

            clearInterval(that.onChangeInterval);

            if (that.currentValue !== that.el.val()) {
                that.findBestHint();
                if (that.options.deferRequestBy > 0) {
                    // Defer lookup in case when value changes very quickly:
                    that.onChangeInterval = setInterval(function () {
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
                query = that.getQuery(value),
                index;

            if (that.selection) {
                that.selection = null;
                (options.onInvalidateSelection || $.noop).call(that.element);
            }

            clearInterval(that.onChangeInterval);
            that.currentValue = value;
            that.selectedIndex = -1;

            // Check existing suggestion for the match before proceeding:
            if (options.triggerSelectOnValidInput) {
                index = that.findSuggestionIndex(query);
                if (index !== -1) {
                    that.select(index);
                    return;
                }
            }

            if (query.length < options.minChars) {
                that.hide();
            } else {
                that.getSuggestions(query);
            }
        },

        findSuggestionIndex: function (query) {
            var that = this,
                index = -1,
                stopwords = STOPWORDS[that.options.type];
            if (query.trim() !== '') {
                $.each(that.matchers, function(i, matcher) {
                    if (index === -1) {
                        index = matcher.call(that, query, that.suggestions, stopwords);
                    }
                });
            }
            return index;
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

        getSuggestionsLocal: function (query) {
            var that = this,
                options = that.options,
                queryLowerCase = query.toLowerCase(),
                filter = options.lookupFilter,
                limit = parseInt(options.lookupLimit, 10),
                data;

            data = {
                suggestions: $.grep(options.lookup, function (suggestion) {
                    return filter(suggestion, query, queryLowerCase);
                })
            };

            if (limit && data.suggestions.length > limit) {
                data.suggestions = data.suggestions.slice(0, limit);
            }

            return data;
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

            if (that.isLocal) {
                response = that.getSuggestionsLocal(q);
            } else {
                if ($.isFunction(serviceUrl)) {
                    serviceUrl = serviceUrl.call(that.element, q);
                }
                cacheKey = serviceUrl + '?' + $.param(params || {});
                response = that.cachedResponse[cacheKey];
            }

            if (response && $.isArray(response.suggestions)) {
                that.suggestions = response.suggestions;
                that.suggest();
            } else {
                if (!that.isBadQuery(q)) {
                    if (options.onSearchStart.call(that.element, params) === false) {
                        return;
                    }
                    utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
                    that.showPreloader();
                    that.currentRequest = $.ajax(
                            $.extend(that.getAjaxParams(), {
                                url: serviceUrl,
                                data: utils.serialize(params)
                            })
                        )
                        .always(function(){
                            that.currentRequest = null;
                        }).done(function (data) {
                            var result;
                            result = options.transformResult(data);
                            that.enrichService.enrichResponse.call(that, result, q)
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
            }
        },

        isBadQuery: function (q) {
            if (!this.options.preventBadQueries) {
                return false;
            }

            var badQueries = this.badQueries,
                i = badQueries.length;

            while (i--) {
                if (q.indexOf(badQueries[i]) === 0) {
                    return true;
                }
            }

            return false;
        },

        hide: function () {
            var that = this;
            that.visible = false;
            that.selectedIndex = -1;
            that.$container.hide().empty();
            that.signalHint(null);
            utils.abortRequests(that.currentRequest);
        },

        hasExtraSuggestions: function(){
            var that = this;
            return that.suggestions.length !== 1 || !that.selection || that.suggestions[0].value != this.selection.value;
        },

        suggest: function () {
            var that = this,
                options = that.options,
                formatResult = options.formatResult,
                value = that.getQuery(that.currentValue),
                className = that.classes.suggestion,
                classSelected = that.classes.selected,
                beforeRender = options.beforeRender,
                $container = that.$container,
                html = [],
                index;

            if (that.suggestions.length === 0 || !that.hasExtraSuggestions()) {
                that.hide();
                return;
            }

            if (options.triggerSelectOnValidInput) {
                index = that.findSuggestionIndex(value);
                if (index !== -1) {
                    that.select(index);
                    return;
                }
            }

            if (options.triggerSelectOnSpace && !that.triggeredSelectOnLastKey && that.lastKeyPressed == keys.SPACE && /\s$/.test(value)) {
                index = that.findSuggestionIndex(value.replace(/\s$/, ''));
                if (index !== -1) {
                    that.onSelect(index);
                }
            }

            // Build hint html
            if (options.hint && that.suggestions.length) {
                html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
            }
            // Build suggestions inner HTML:
            $.each(that.suggestions, function (i, suggestion) {
                html.push('<div class="' + className + '" data-index="' + i + '">' + formatResult(suggestion, value) + '</div>');
            });

            $container.html(html.join(''));

            // Select first value by default:
            if (options.autoSelectFirst) {
                that.selectedIndex = 0;
                $container.children().first().addClass(classSelected);
            }

            if ($.isFunction(beforeRender)) {
                beforeRender.call(that.element, $container);
            }

            $container.show();
            that.visible = true;

            that.findBestHint();
        },

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

        findBestHint: function () {
            var that = this,
                value = that.el.val().toLowerCase(),
                bestMatch = null;

            if (!value) {
                return;
            }

            $.each(that.suggestions, function (i, suggestion) {
                var foundMatch = suggestion.value.toLowerCase().indexOf(value) === 0;
                if (foundMatch) {
                    bestMatch = suggestion;
                }
                return !foundMatch;
            });

            that.signalHint(bestMatch);
        },

        signalHint: function (suggestion) {
            var hintValue = '',
                that = this;
            if (suggestion) {
                hintValue = that.currentValue + suggestion.value.substr(that.currentValue.length);
            }
            if (that.hintValue !== hintValue) {
                that.hintValue = hintValue;
                that.hint = suggestion;
                (this.options.onHint || $.noop)(hintValue);
            }
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

        processResponse: function (result, originalQuery, cacheKey) {
            var that = this,
                options = that.options;

            result.suggestions = that.verifySuggestionsFormat(result.suggestions || []);

            // Cache results if cache is not disabled:
            if (!options.noCache) {
                that.cachedResponse[cacheKey] = result;
                if (options.preventBadQueries && result.suggestions.length === 0) {
                    that.badQueries.push(originalQuery);
                }
            }

            // Return if originalQuery is not matching current query:
            if (originalQuery !== that.getQuery(that.currentValue)) {
                return;
            }

            that.suggestions = result.suggestions;
            that.suggest();
        },

        activate: function (index) {
            var that = this,
                activeItem,
                selected = that.classes.selected,
                children;

            if (!that.dropdownDisabled) {
                children = that.$container.children('.' + that.classes.suggestion);

                children.filter('.' + selected).removeClass(selected);

                that.selectedIndex = index;

                if (that.selectedIndex !== -1 && children.length > that.selectedIndex) {
                    activeItem = children.get(that.selectedIndex);
                    $(activeItem).addClass(selected);
                    return activeItem;
                }
            }

            return null;
        },

        enableDropdown: function () {
            var that = this;
            that.dropdownDisabled = false;
            that.$container.attr('disabled', false);
        },

        disableDropdown: function () {
            var that = this;
            that.dropdownDisabled = true;
            that.$container.attr('disabled', true);
        },

        selectHint: function () {
            var that = this,
                i = $.inArray(that.hint, that.suggestions);

            that.select(i);
        },

        selectCurrentValue: function (options) {
            var that = this,
                index = that.selectedIndex;
            if (index === -1) {
                var value = that.getQuery(that.el.val());
                if (options.trim) {
                    value = value.trim();
                }
                index = that.findSuggestionIndex(value);
            }
            if (index !== -1) {
                that.select(index, options.noHide);
            }
            return index;
        },

        select: function (index, noHide) {
            var that = this,
                suggestion = that.suggestions[index],
                assumeDataCompleted = that.hasExpectedComponents(suggestion),
                valueSuffix = assumeDataCompleted || that.triggeringSelectOnSpace ? '' : ' ';

            if (that.currentEnrichRequest) {
                // avoid subsequent selection if selecting process already began, e.g.: blur just after manual selection
                return;
            }
            if (that.options.type && assumeDataCompleted) {
                noHide = false;
            }
            that.currentValue = that.getValue(suggestion.value) + valueSuffix;
            that.el.val(that.currentValue);
            that.signalHint(null);
            that.selection = suggestion;

            that.onSelect(index)
                .done(function () {
                    that.selectedIndex = -1;
                    if (noHide) {
                        that.getSuggestions(that.currentValue);
                    } else {
                        that.hide();
                        that.suggestions = [];
                    }
                });
        },

        unselect: function () {
            var that = this;

            that.$container.children().removeClass(that.classes.selected);
            that.selectedIndex = -1;
            that.el.val(that.currentValue);
            that.findBestHint();
        },

        hasExpectedComponents: function(suggestion) {
            var that = this,
                result = true;
            $.each(that.expectedComponents, function(i, part){
                return result = result && !!suggestion.data[part];
            });
            return result;
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
                that.unselect();
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
                that.unselect();
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
            that.signalHint(null);
        },

        /**
         * Provides a suggetion outside of the instance
         * Returns $.Deferred, which will be resolved after enrichService proceeded
         */
        onSelect: function (index) {
            var that = this,
                onSelectCallback = that.options.onSelect,
                suggestion = that.suggestions[index],
                selectionCompleter = $.Deferred();

            if ($.isFunction(onSelectCallback)) {
                that.enrichService.enrichSuggestion.call(that, suggestion)
                    .done(function (enrichedSuggestion) {
                        onSelectCallback.call(that.element, enrichedSuggestion),
                            selectionCompleter.resolve();
                    });
            } else {
                selectionCompleter.resolve();
            }
            return selectionCompleter;
        },

        onSelectNothing: function() {
            var that = this,
                callback = that.options.onSelectNothing;
            if ($.isFunction(callback)) {
                callback.call(that.element, that.currentValue);
            }
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

        dispose: function () {
            var that = this;
            that.el.off(eventNS).removeData(dataAttrKey);
            that.$viewport.off('resize' + eventNS);
            that.$wrapper.remove();
        },

        _delay: function (handler, delay) {
            function handlerProxy() {
                return ( typeof handler === "string" ? instance[ handler ] : handler )
                    .apply(instance, arguments);
            }

            var instance = this;
            return setTimeout(handlerProxy, delay || 0);
        },
        
        setSuggestion: function(suggestion){
            var that = this;
            
            if ($.isPlainObject(suggestion) && suggestion.value) {
                that.currentValue = suggestion.value;
                that.el.val(suggestion.value);
                that.selection = suggestion;
                utils.abortRequests(that.currentRequest, that.currentEnrichRequest);
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