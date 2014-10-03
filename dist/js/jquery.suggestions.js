/**
 * DaData.ru Suggestions jQuery plugin, version 4.8.5
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
        wordDelimeters = '\\s"\'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>',
        wordSplitter = new RegExp('[' + wordDelimeters + ']+', 'g'),
        wordPartsDelimeters = '\\-\\+\\/\\\\\\?!@#$%^&',
        wordPartsSplitter = new RegExp('[' + wordPartsDelimeters + ']+', 'g'),
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
            headers: null,
            scrollOnFocus: true,
            mobileWidth: 980
        };

    var utils = (function () {
        var uniqueId = 0;
        return {
            escapeRegExChars: function (value) {
                return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            escapeHtml: function (str) {
                var map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '/': '&#x2F;'
                };

                if (str) {
                    $.each(map, function(char, html){
                        str = str.replace(new RegExp(char, 'g'), html);
                    });
                }
                return str;
            },
            getDefaultType: function () {
                return ($.support.cors ? 'POST' : 'GET');
            },
            getDefaultContentType: function () {
                return ($.support.cors ? 'application/json' : 'application/x-www-form-urlencoded');
            },
            fixURLProtocol: function(url){
                return $.support.cors ? url : url.replace(/^https?:/, location.protocol);
            },
            addUrlParams: function (url, params) {
                return url + (/\?/.test(url) ? '&' : '?') + $.param(params);
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
            uniqueId: function (prefix) {
                return (prefix || '') + ++uniqueId;
            },
            slice: function(obj, start) {
                return Array.prototype.slice.call(obj, start);
            },
            /**
             * Returns array1 minus array2
             */
            arrayMinus: function(array1, array2) {
                return array2 ? $.grep(array1, function(el, i){
                    return $.inArray(el, array2) === -1;
                }) : array1;
            },
            getWords: function(str, stopwords) {
                // Split numbers and letters written together
                str = str.replace(/(\d+)([а-яА-ЯёЁ]{2,})/g, '$1 $2')
                    .replace(/([а-яА-ЯёЁ]+)(\d+)/g, '$1 $2');

                var words = this.compact(str.split(/[.,\s"\(\)]+/g)),
                    lastWord = words.pop(),
                    goodWords = this.arrayMinus(words, stopwords);

                goodWords.push(lastWord);
                return goodWords;
            },
            /**
             * Returns normalized string without stopwords
             */
            normalize: function(str, stopwords) {
                var that = this;
                return that.getWords(str, stopwords).join(' ');
            },
            /**
             * Returns true if str1 includes str2 plus something else, false otherwise.
             */
            stringEncloses: function(str1, str2) {
                return str1.length > str2.length && str1.indexOf(str2) !== -1;
            },
            fieldsNotEmpty: function(obj, fields){
                if (!$.isPlainObject(obj)) {
                    return false;
                }
                var result = true;
                $.each(fields, function (i, field) {
                    return result = !!(obj[field]);
                });
                return result;
            },
            getDeepValue: function(obj, name) {
                var path = name.split('.'),
                    step = path.shift();

                return obj && (path.length ? utils.getDeepValue(obj[step], path.join('.')) : obj[step]);
            }
        };
    }());


    /**
     * Methods for selecting a suggestion
     */
    var matchers = function() {

        function haveSameParent (suggestions) {
            if (suggestions.length === 0) {
                return false;
            }
            if (suggestions.length === 1) {
                return true;
            }

            var parentValue = suggestions[0].value,
                aliens = $.grep(suggestions, function (suggestion) {
                    return suggestion.value.indexOf(parentValue) === 0;
                }, true);

            return aliens.length === 0;
        }

        return {

            /**
             * Matches query against suggestions, removing all the stopwords.
             */
            matchByNormalizedQuery: function (query, suggestions) {
                var queryLowerCase = query.toLowerCase(),
                    stopwords = this.STOPWORDS,
                    normalizedQuery = utils.normalize(queryLowerCase, stopwords),
                    matches = [];

                $.each(suggestions, function(i, suggestion) {
                    var suggestedValue = suggestion.value.toLowerCase();
                    // if query encloses suggestion, than it has already been selected
                    // so we should not select it anymore
                    if (utils.stringEncloses(queryLowerCase, suggestedValue)) {
                        return false;
                    }
                    // if there is suggestion that contains query as its part
                    // than we should ignore all other matches, even full ones
                    if (suggestedValue.indexOf(normalizedQuery) > 0) {
                        return false;
                    }
                    if (normalizedQuery === utils.normalize(suggestedValue, stopwords)) {
                        matches.push(i);
                    }
                });

                return matches.length == 1 ? matches[0] : -1;
            },

            /**
             * Matches query against suggestions word-by-word (with respect to stopwords).
             * Matches if query words are a subset of suggested words.
             */
            matchByWords: function (query, suggestions) {
                var stopwords = this.STOPWORDS,
                    queryLowerCase = query.toLowerCase(),
                    queryWords = utils.getWords(queryLowerCase, stopwords),
                    index = -1;

                if (haveSameParent(suggestions)) {
                    $.each(suggestions, function(i, suggestion) {
                        var suggestedValue = suggestion.value.toLowerCase();

                        if (utils.stringEncloses(queryLowerCase, suggestedValue)) {
                            return false;
                        }

                        // check if query words are a subset of suggested words
                        var suggestionWords = utils.getWords(suggestedValue, stopwords);

                        if (utils.arrayMinus(queryWords, suggestionWords).length === 0) {
                            index = i;
                            return false;
                        }
                    });
                }

                return index;
            },

            matchByFields: function (query, suggestions) {
                var stopwords = this.STOPWORDS,
                    fieldsStopwords = this.fieldsStopwords,
                    queryWords = utils.getWords(query.toLowerCase(), stopwords),
                    matches = [];

                $.each(suggestions, function(i, suggestion) {
                    var suggestionWords = [];

                    if (fieldsStopwords) {
                        $.each(fieldsStopwords, function (field, stopwords) {
                            var fieldValue = utils.getDeepValue(suggestion.data, field),
                                fieldWords = fieldValue && utils.getWords(fieldValue.toLowerCase(), stopwords);

                            if (fieldWords && fieldWords.length) {
                                suggestionWords = suggestionWords.concat(fieldWords);
                            }
                        });
                    }

                    if (utils.arrayMinus(queryWords, suggestionWords).length === 0) {
                        matches.push(i);
                    }
                });

                return matches.length == 1 ? matches[0] : -1;
            }

        };

    }();

    (function () {

        var ADDRESS_STOPWORDS = ['ао', 'аобл', 'дом', 'респ', 'а/я', 'аал', 'автодорога', 'аллея', 'арбан', 'аул', 'б-р', 'берег', 'бугор', 'вал', 'вл', 'волость', 'въезд', 'высел', 'г', 'городок', 'гск', 'д', 'двлд', 'днп', 'дор', 'дп', 'ж/д_будка', 'ж/д_казарм', 'ж/д_оп', 'ж/д_платф', 'ж/д_пост', 'ж/д_рзд', 'ж/д_ст', 'жилзона', 'жилрайон', 'жт', 'заезд', 'заимка', 'зона', 'к', 'казарма', 'канал', 'кв', 'кв-л', 'км', 'кольцо', 'комн', 'кордон', 'коса', 'кп', 'край', 'линия', 'лпх', 'м', 'массив', 'местность', 'мкр', 'мост', 'н/п', 'наб', 'нп', 'обл', 'округ', 'остров', 'оф', 'п', 'п/о', 'п/р', 'п/ст', 'парк', 'пгт', 'пер', 'переезд', 'пл', 'пл-ка', 'платф', 'погост', 'полустанок', 'починок', 'пр-кт', 'проезд', 'промзона', 'просек', 'просека', 'проселок', 'проток', 'протока', 'проулок', 'р-н', 'рзд', 'россия', 'рп', 'ряды', 'с', 'с/а', 'с/мо', 'с/о', 'с/п', 'с/с', 'сад', 'сквер', 'сл', 'снт', 'спуск', 'ст', 'ст-ца', 'стр', 'тер', 'тракт', 'туп', 'у', 'ул', 'уч-к', 'ф/х', 'ферма', 'х', 'ш', 'бульвар', 'владение', 'выселки', 'гаражно-строительный', 'город', 'деревня', 'домовладение', 'дорога', 'квартал', 'километр', 'комната', 'корпус', 'литер', 'леспромхоз', 'местечко', 'микрорайон', 'набережная', 'область', 'переулок', 'платформа', 'площадка', 'площадь', 'поселение', 'поселок', 'проспект', 'разъезд', 'район', 'республика', 'село', 'сельсовет', 'слобода', 'сооружение', 'станица', 'станция', 'строение', 'территория', 'тупик', 'улица', 'улус', 'участок', 'хутор', 'шоссе'];

        types['NAME'] = {
            matchers: [matchers.matchByNormalizedQuery, matchers.matchByWords],
            isDataComplete: function (data) {
                var that = this,
                    params = that.options.params,
                    fields = $.map(params && params.parts || ['surname', 'name', 'patronymic'], function (part) {
                        return part.toLowerCase();
                    });
                return utils.fieldsNotEmpty(data, fields);
            },
            composeValue: function (data) {
                return utils.compact([data.surname, data.name, data.patronymic]).join(' ');
            },
            urlSuffix: 'fio'
        };

        types['ADDRESS'] = {
            STOPWORDS: ADDRESS_STOPWORDS,
            matchers: [matchers.matchByNormalizedQuery, matchers.matchByWords],
            geoEnabled: true,
            boundsAvailable: ['region', 'area', 'city', 'settlement', 'street', 'house', 'block', 'flat'],
            isDataComplete: function (data) {
                var fields = [this.bounds.to || 'house'];
                return utils.fieldsNotEmpty(data, fields) &&
                    (!('qc_complete' in data) || data.qc_complete !== QC_COMPLETE.NO_FLAT);
            },
            composeValue: function (data) {
                // TODO improve according with server logic
                return utils.compact([
                    utils.compact([data.region, data.region_type]).join(' '),
                    utils.compact([data.area_type, data.area]).join(' '),
                    utils.compact([data.city_type, data.city]).join(' '),
                    utils.compact([data.settlement_type, data.settlement]).join(' '),
                    utils.compact([data.street_type, data.street]).join(' '),
                    utils.compact([data.house_type, data.house]).join(' '),
                    utils.compact([data.block_type, data.block]).join(' '),
                    utils.compact([data.flat_type, data.flat]).join(' '),
                    data.postal_box ? 'а/я ' + data.postal_box : null
                ]).join(', ');
            },
            urlSuffix: 'address'
        };

        types['PARTY'] = {
            // These fields of suggestion's `data` used by by-words matcher
            fieldsStopwords: {
                'address.value': ADDRESS_STOPWORDS,
                'inn': null,
                'ogrn': null,
                'name.full': null,
                'name.short': null,
                'name.latin': null,
                'opf.full': null,
                'opf.short': null
            },
            matchers: [matchers.matchByFields],
            isDataComplete: function (data) {
                return true;
            },
            // composeValue not needed
            enrichServiceName: 'default',
            urlSuffix: 'party',
            formatResult: function (value, currentValue, suggestion, options) {
                var that = this,
                    inn = suggestion.data && parseInn(suggestion.data),
                    address = utils.getDeepValue(suggestion, 'data.address.value');

                if (that.isMobile()) {
                    (options || (options = {})).maxLength = 50;
                }

                value = that.formatResult.call(that, value, currentValue, suggestion, options);

                if (inn) {
                    value += '<span class="' + that.classes.subtext_inline + '">' +
                        inn.join('<span class="' + that.classes.subtext_delimiter + '"></span>') +
                        '</span>';
                }

                if (address && (address = address.replace(/^\d{6}( РОССИЯ)?, /i, ''))) {
                    value += '<div class="' + that.classes.subtext + '">' +
                        that.formatResult(address, currentValue, suggestion, {
                            unformattableTokens: ADDRESS_STOPWORDS
                        }) +
                        '</div>';
                }

                return value;
            }
        };

        function parseInn (data) {
            var innPattern = {
                    'LEGAL': /(\d{2})(\d{2})(\d{5})(\d+)/,
                    'INDIVIDUAL': /(\d{2})(\d{2})(\d{6})(\d+)/
                }[data.type],
                inn = data.inn && innPattern && innPattern.exec(data.inn);

            return inn && inn.slice(1);
        }

    }());

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
            mobile: 'suggestions-mobile',
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

    Suggestions.version = '4.8.5';

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
            that.el.trigger('suggestions-dispose');
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

        isMobile: function () {
            return this.$viewport.width() <= this.options.mobileWidth;
        },

        scrollToTop: function () {
            var that = this,
                scrollTarget = that.options.scrollOnFocus;

            if (scrollTarget === true) {
                scrollTarget = that.el;
            }
            if (scrollTarget instanceof $ && scrollTarget.length > 0) {
                $('body,html').scrollTop(scrollTarget.offset().top);
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

            that.applyHooks(setOptionsHooks);
        },

        // Common public methods

        fixPosition: function () {
            var that = this,
                elLayout = {},
                wrapperOffset,
                origin;

            that.applyHooks(resetPositionHooks);
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
            wrapperOffset = that.$wrapper.offset();

            origin = {
                top: elLayout.top - wrapperOffset.top,
                left: elLayout.left - wrapperOffset.left
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
            this.hide();
            this.suggestions = [];
            this.el.val('');
            this.el.trigger('suggestions-clear');
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
            var that = this,
                value;

            if ($.isPlainObject(suggestion) && suggestion.value) {
                value = suggestion.bounded_value || suggestion.value;
                that.currentValue = value;
                that.el.val(value);
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

    (function(){
        /**
         * Methods related to INPUT's behavior
         */

        var methods = {

            bindElementEvents: function () {
                var that = this;

                that.el.on('keydown' + eventNS, $.proxy(that.onElementKeyDown, that));
                // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
                that.el.on(['keyup' + eventNS, 'cut' + eventNS, 'paste' + eventNS].join(' '), $.proxy(that.onElementKeyUp, that));
                that.el.on('blur' + eventNS, $.proxy(that.onElementBlur, that));
                that.el.on('focus' + eventNS, $.proxy(that.onElementFocus, that));
            },

            unbindElementEvents: function () {
                this.el.off(eventNS);
            },

            onElementBlur: function () {
                var that = this;
                // suggestion was clicked, blur should be ignored
                // see container mousedown handler
                if (that.cancelBlur) {
                    delete that.cancelBlur;
                    return;
                }
                that.selectCurrentValue({ trim: true, noSpace: true });
                that.abortRequest();
            },

            onElementFocus: function () {
                var that = this;

                if (!that.cancelFocus) {
                    // defer methods to allow browser update input's style before
                    utils.delay(function () {
                        if (that.isMobile()) {
                            that.scrollToTop();
                        }
                        that.fixPosition();
                        that.update();
                    });
                }
                that.cancelFocus = false;
            },

            onElementKeyDown: function (e) {
                var that = this;

                if (that.disabled) {
                    return;
                }

                that._waitingForTriggerSelectOnSpace = false;

                if (!that.visible) {
                    switch (e.which) {
                        // If suggestions are hidden and user presses arrow down, display suggestions
                        case keys.DOWN:
                            that.suggest();
                            break;
                        // if no suggestions available and user pressed Enter
                        case keys.RETURN:
                            that.triggerOnSelectNothing();
                            break;
                        case keys.SPACE:
                            that._waitingForTriggerSelectOnSpace = true;
                    }
                    return;
                }

                switch (e.which) {
                    case keys.ESC:
                        that.el.val(that.currentValue);
                        that.hide();
                        that.abortRequest();
                        break;

                    case keys.TAB:
                        if (that.options.tabDisabled === false) {
                            return;
                        }
                        break;

                    case keys.RETURN:
                        that.selectCurrentValue({ trim: true });
                        break;

                    case keys.SPACE:
                        if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                            var selected = that.selectCurrentValue({continueSelecting: true, noSpace: true}) !== -1;

                            // set this flag to seek and select matched suggestion when server responds
                            that._waitingForTriggerSelectOnSpace = !selected;

                            // set this flag to prevent enrich request interruption during onKeyUp and onValueChange
                            that.cancelKeyUp = selected;
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

                if (that.disabled || that.cancelKeyUp) {
                    that.cancelKeyUp = false;
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
                    value = that.el.val();

                if (that.selection) {
                    that.trigger('InvalidateSelection', that.selection);
                    that.selection = null;
                }

                clearTimeout(that.onChangeTimeout);
                that.currentValue = value;
                that.selectedIndex = -1;

                that.update();
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
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.bindElementEvents);

        disposeHooks.push(methods.unbindElementEvents);

    }());


    (function(){
        /**
         * Methods related to plugin's authorization on server
         */

        var tokenRequests = {};

        var methods = {

            checkToken: function () {
                var that = this,
                    token = $.trim(that.options.token),
                    tokenRequest = tokenRequests[token];

                function onTokenReady() {
                    that.checkToken();
                }

                if (token) {
                    if (tokenRequest && $.isFunction(tokenRequest.promise)) {
                        switch (tokenRequest.state()) {
                            case 'resolved':
                                that.enable();
                                break;
                            case 'rejected':
                                that.disable();
                                break;
                            default:
                                tokenRequest.always(onTokenReady);
                        }
                    } else {
                        (tokenRequests[token] = $.ajax(that.getAjaxParams('suggest')))
                            .always(onTokenReady);
                    }
                }
            }

        };

        Suggestions.resetTokens = function () {
            tokenRequests = {};
        };

        $.extend(Suggestions.prototype, methods);

        setOptionsHooks.push(methods.checkToken);

    }());

    (function() {

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
        }

        var locationRequest,
            defaultGeoLocation = true;

        function resetLocation () {
            locationRequest = null;
            Suggestions.defaultOptions.geoLocation = defaultGeoLocation;
        }

        var methods = {

            checkLocation: function () {
                var that = this;

                if (!that.type.geoEnabled || !that.options.geoLocation) {
                    return;
                }

                that.geoLocation = $.Deferred();
                if ($.isPlainObject(that.options.geoLocation)) {
                    that.geoLocation.resolve(that.options.geoLocation);
                } else {
                    if (!locationRequest) {
                        locationRequest = $.ajax(that.getAjaxParams('detectAddressByIp'));
                    }

                    locationRequest
                        .done(function (resp) {
                            var locationData = resp && resp.location && resp.location.data;
                            if (locationData && locationData.kladr_id) {
                                that.geoLocation.resolve(locationData);
                            } else {
                                that.geoLocation.reject();
                            }
                        })
                        .fail(function(){
                            that.geoLocation.reject();
                        });
                }
            },

            /**
             * Public method to get `geoLocation` promise
             * @returns {$.Deferred}
             */
            getGeoLocation: function () {
                return this.geoLocation;
            },

            constructParams: function () {
                var that = this,
                    params = {};

                if (that.geoLocation && $.isFunction(that.geoLocation.promise) && that.geoLocation.state() == 'resolved') {
                    that.geoLocation.done(function(locationData){
                        params['locations_boost'] = [locationData];
                    });
                }

                return params;
            }

        };

        $.extend(defaultOptions, {
            geoLocation: defaultGeoLocation
        });

        $.extend(Suggestions, {
            resetLocation: resetLocation
        });

        $.extend(Suggestions.prototype, {
            getGeoLocation: methods.getGeoLocation
        });

        setOptionsHooks.push(methods.checkLocation);

        requestParamsHooks.push(methods.constructParams);

    }());

    (function(){

        var enrichServices = {
            'default': {
                enrichSuggestion: function (suggestion) {
                    return $.Deferred().resolve(suggestion);
                }
            },
            'dadata': (function () {
                return {
                    enrichSuggestion: function (suggestion) {
                        var that = this,
                            resolver = $.Deferred();

                        function suggestionIsDefined(suggestion) {
                            return suggestion && suggestion.data
                                && suggestion.data.hasOwnProperty('qc')
                                && suggestion.data.qc !== null;
                        }

                        // if current suggestion is already enriched, use it
                        if (suggestion.data && suggestion.data.qc != null) {
                            return resolver.resolve(suggestion);
                        }

                        that.disableDropdown();
                        that.getSuggestions(suggestion.value, { count: 1 }, { noCallbacks: true })
                            .always(function () {
                                that.enableDropdown();
                            })
                            .done(function (suggestions) {
                                var serverSuggestion = suggestions[0];
                                if (suggestionIsDefined(serverSuggestion)) {
                                    // return suggestion from dadata
                                    resolver.resolve(serverSuggestion);
                                } else {
                                    // dadata is turned off on the server, ignore response
                                    // and use suggestion selected by the user
                                    resolver.resolve(suggestion);
                                }
                            })
                            .fail(function () {
                                resolver.resolve(suggestion);
                            });
                        return resolver;
                    }
                }
            }())
        };

        var methods = {
            selectEnrichService: function () {
                var that = this,
                    type = that.options.type,
                    token = $.trim(that.options.token);

                if (that.options.useDadata && type && types[type] && token) {
                    that.enrichService = enrichServices[types[type].enrichServiceName || 'dadata'];
                } else {
                    that.enrichService = enrichServices['default'];
                }
            }
        };

        $.extend(defaultOptions, {
            useDadata: true
        });

        setOptionsHooks.push(methods.selectEnrichService);

    }());

    (function(){
        /**
         * Methods related to suggestions dropdown list
         */

        function formatToken(token) {
            return token.toLowerCase().replace(/[ёЁ]/g, 'е');
        }

        function withSubTokens(tokens) {
            var result = [];

            $.each(tokens, function (i, token) {
                var subtokens = token.split(wordPartsSplitter);

                result.push(token);

                if (subtokens.length > 1) {
                    result = result.concat(subtokens);
                }
            });

            return result;
        }

        var methods = {

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

                $container.on('click' + eventNS, suggestionSelector, $.proxy(that.onSuggestionClick, that));
            },

            // Dropdown event handlers

            /**
             * Listen for click event on suggestions list:
             */
            onSuggestionClick: function (e) {
                var that = this,
                    $el = $(e.target),
                    index;

                if (!that.dropdownDisabled) {
                    while ($el.length && !(index = $el.attr('data-index'))) {
                        $el = $el.closest('.' + that.classes.suggestion);
                    }
                    if (index && !isNaN(index)) {
                        that.select(+index);
                    }
                }
                that.cancelFocus = true;
                that.el.focus();
            },

            // Dropdown UI methods

            setDropdownPosition: function (origin, elLayout) {
                var that = this,
                    isMobile = that.isMobile();

                that.$container
                    .toggleClass(that.classes.mobile, isMobile)
                    .css(isMobile ? {
                        left: origin.left - elLayout.left + 'px',
                        top: origin.top + elLayout.outerHeight + 'px',
                        width: that.$viewport.width() + 'px',
                        paddingLeft: elLayout.left + 'px'
                    } : {
                        left: origin.left + 'px',
                        top: origin.top + elLayout.borderTop + elLayout.innerHeight + 'px',
                        width: (that.options.width === 'auto' ? that.el.outerWidth() : that.options.width) + 'px',
                        paddingLeft: ''
                    });
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
                    formatResult = options.formatResult || that.type.formatResult || that.formatResult,
                    trimmedValue = $.trim(that.getQuery(that.currentValue)),
                    beforeRender = options.beforeRender,
                    html = [],
                    index;

                // Build hint html
                if (options.hint && that.suggestions.length) {
                    html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
                }
                that.selectedIndex = -1;
                // Build suggestions inner HTML:
                $.each(that.suggestions, function (i, suggestion) {
                    if (suggestion == that.selection) {
                        that.selectedIndex = i;
                    }
                    html.push(
                        '<div class="' + that.classes.suggestion + '" data-index="' + i + '">' +
                            formatResult.call(that, suggestion.value, trimmedValue, suggestion, {
                                unformattableTokens: that.type.STOPWORDS
                            }) +
                        '</div>'
                    );
                });

                that.$container.html(html.join(''));

                // Select first value by default:
                if (options.autoSelectFirst && that.selectedIndex === -1) {
                    that.selectedIndex = 0;
                }
                if (that.selectedIndex !== -1) {
                    that.getSuggestionsItems().eq(that.selectedIndex).addClass(that.classes.selected);
                }

                if ($.isFunction(beforeRender)) {
                    beforeRender.call(that.element, that.$container);
                }

                that.$container.show();
                that.visible = true;
            },

            /**
             * Makes HTML contents for suggestion item
             * @param {String} value string to be displayed as a value
             * @param {String} currentValue contents of the textbox
             * @param suggestion whole suggestion object with displaying value and other fields
             * @param {Object} [options] set of flags:
             *          `unformattableTokens` - array of search tokens, that are not to be highlighted
             *          `maxLength` - if set, `value` is limited by this length
             * @returns {String} HTML to be inserted in the list
             */
            formatResult: function (value, currentValue, suggestion, options) {

                var chunks = [],
                    unformattableTokens = options && options.unformattableTokens,
                    maxLength = options && options.maxLength || value.length,
                    tokens = formatToken(currentValue).split(wordSplitter),
                    partialTokens = withSubTokens([tokens[tokens.length -1]]),
                    partialMatchers = $.map(partialTokens, function (token) {
                        return new RegExp('^(.*[' + wordPartsDelimeters+ ']+)?(' + utils.escapeRegExChars(token) + ')(?=[^' + wordDelimeters + ']+)', 'i')
                    }),
                    rWords = new RegExp('([^' + wordDelimeters + ']*)([' + wordDelimeters + ']*)', 'g'),
                    match, word;

                tokens = withSubTokens(tokens);

                // check for matching whole words
                while ((match = rWords.exec(value)) && match[0]) {
                    word = match[1] && formatToken(match[1]);
                    if (word) {
                        chunks.push({
                            before: null,

                            wordFormatted: word,
                            wordOriginal: match[1],
                            matched: $.inArray(word, unformattableTokens) === -1 && $.inArray(word, tokens) >= 0,

                            after: match[2],
                            length: match[0].length
                        });
                    } else {
                        chunks.push({
                            after: match[0]
                        });
                    }
                }

                // check for partial match
                $.each(chunks, function (i, chunk) {
                    if (!chunk.matched && chunk.wordFormatted && $.inArray(chunk.wordFormatted, unformattableTokens) === -1) {
                        $.each(partialMatchers, function (i, matcher) {
                            var match = matcher.exec(chunk.wordFormatted),
                                beforeLength;

                            if (match && match[2]) {
                                beforeLength = match[1] == null ? 0 : match[1].length;
                                chunk.matched = true;
                                chunk.before = chunk.wordOriginal.substr(0, beforeLength);
                                chunk.after = chunk.wordOriginal.substr(beforeLength + match[2].length) + chunk.after;
                                chunk.wordOriginal = chunk.wordOriginal.substr(beforeLength, match[2].length);
                                return false;
                            }
                        });
                    }

                    maxLength -= chunk.length;
                    if (maxLength < 0) {
                        checkChunkField(chunk, 'after');
                        checkChunkField(chunk, 'wordOriginal');
                        checkChunkField(chunk, 'before');

                        chunks.length = i + 1;
                        return false;
                    }
                });

                // format chunks
                return $.map(chunks, function (chunk) {
                    var text = utils.escapeHtml(chunk.wordOriginal);

                    if (text && chunk.matched) {
                        text = '<strong>' + text + '</strong>';
                    }
                    if (chunk.before) {
                        text = utils.escapeHtml(chunk.before) + text;
                    }
                    if (chunk.after) {
                        text += utils.escapeHtml(chunk.after);
                    }

                    return text;
                }).join('');

                function checkChunkField (chunk, field) {
                    var length;

                    if (chunk[field]) {
                        length = chunk[field].length;
                        maxLength += length;
                        chunk[field] = chunk[field].substr(0, maxLength);
                        if (maxLength > 0 && maxLength < length) {
                            chunk[field] += '...';
                        }
                    }
                }
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
                    $activeItem,
                    selected = that.classes.selected,
                    $children;

                if (!that.dropdownDisabled) {
                    $children = that.getSuggestionsItems();

                    $children.removeClass(selected);

                    that.selectedIndex = index;

                    if (that.selectedIndex !== -1 && $children.length > that.selectedIndex) {
                        $activeItem = $children.eq(that.selectedIndex);
                        $activeItem.addClass(selected);
                        return $activeItem;
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
                    $activeItem = that.activate(index),
                    itemTop,
                    itemBottom,
                    scrollTop = that.$container.scrollTop(),
                    containerHeight;

                if (!$activeItem || !$activeItem.length) {
                    return;
                }

                itemTop = $activeItem.position().top;
                if (itemTop < 0 ) {
                    that.$container.scrollTop(scrollTop + itemTop);
                } else {
                    itemBottom = itemTop + $activeItem.outerHeight();
                    containerHeight = that.$container.innerHeight();
                    if (itemBottom > containerHeight) {
                        that.$container.scrollTop(scrollTop - containerHeight + itemBottom);
                    }
                }

                that.el.val(that.getValue(that.suggestions[index].value));
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createContainer);

        fixPositionHooks.push(methods.setDropdownPosition);

        assignSuggestionsHooks.push(methods.suggest);

    }());

    (function(){
        /**
         * Methods related to PRELOADER component
         */

        var QUEUE_NAME = 'preloader',
            BEFORE_SHOW_PRELOADER = 50,
            BEFORE_RESTORE_PADDING = 1000;

        var methods = {

            createPreloader: function () {
                var that = this,
                    $preloader = $('<i class="suggestions-preloader"/>')
                        .appendTo(that.$wrapper);

                that.preloader = {
                    $el: $preloader,
                    visibleCount: 0,
                    height: $preloader.height(),
                    width: $preloader.width(),
                    initialPadding: null
                };
            },

            setPreloaderPosition: function(origin, elLayout){
                var that = this;

                that.preloader.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.preloader.width - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.preloader.height) / 2) + 'px'
                });

                that.preloader.initialPadding = elLayout.paddingRight;
            },

            showPreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    if (!that.preloader.visibleCount++) {
                        that.preloader.$el
                            .stop(true, true)
                            .delay(BEFORE_SHOW_PRELOADER)
                            .queue(function () {
                                that.showPreloaderBackground();
                                $(this).dequeue();
                            })
                            .animate({'opacity': 1}, 'fast');
                    }
                }
            },

            hidePreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    if (! --that.preloader.visibleCount) {
                        that.preloader.$el
                            .stop(true)
                            .animate({'opacity': 0}, {
                                duration: 'fast',
                                complete: function () {
                                    that.hidePreloaderBackground();
                                }
                            });
                    }
                }
            },

            showPreloaderBackground: function () {
                var that = this,
                    preloaderLeftSpacing = 4;

                that.el.stop(QUEUE_NAME, true)
                    .animate({'padding-right': that.preloader.initialPadding + that.preloader.width + preloaderLeftSpacing}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    }).dequeue(QUEUE_NAME);
            },

            hidePreloaderBackground: function () {
                var that = this;

                that.el.stop(QUEUE_NAME, true, true)
                    .delay(BEFORE_RESTORE_PADDING, QUEUE_NAME)
                    .animate({'padding-right': that.preloader.initialPadding}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    }).dequeue(QUEUE_NAME);
            },

            stopPreloaderBackground: function () {
                this.el.stop(QUEUE_NAME, true);
            }

        };

        $.extend(defaultOptions, {
            usePreloader: true
        });

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createPreloader);

        fixPositionHooks.push(methods.setPreloaderPosition);

        resetPositionHooks.push(methods.stopPreloaderBackground);
    }());

    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */
        var optionsUsed = {
            constraints: null,
            restrict_value: false
        };

        var methods = {

            createConstraints: function () {
                var that = this;

                that.constraints = {};

                that.$constraints = $('<ul class="suggestions-constraints"/>');
                that.$wrapper.append(that.$constraints);
                that.$constraints.on('click', '.' + that.classes.removeConstraint, $.proxy(that.onConstraintRemoveClick, that));
            },

            setConstraintsPosition: function(origin, elLayout){
                var that = this;

                that.$constraints.css({
                    left: origin.left + elLayout.borderLeft + elLayout.paddingLeft + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.$constraints.height()) / 2) + 'px'
                });

                elLayout.paddingLeft += that.$constraints.outerWidth(true);
            },

            onConstraintRemoveClick: function (e) {
                var that = this,
                    $item = $(e.target).closest('li'),
                    id = $item.attr('data-constraint-id');

                // Delete constraint data before animation to let correct requests to be sent while fading
                delete that.constraints[id];
                // Request for new suggestions
                that.update();

                $item.fadeOut('fast', function () {
                    that.removeConstraint(id);
                });
            },

            setupConstraints: function () {
                var that = this,
                    constraints = that.options.constraints,
                    $parent;

                if (!constraints) {
                    that.unbindFromParent();
                    return;
                }

                if (constraints instanceof $ || typeof constraints === 'string' || typeof constraints.nodeType === 'number') {
                    $parent = $(constraints);
                    if (!$parent.is(that.constraints)) {
                        that.unbindFromParent();
                        if (!$parent.is(that.el)) {
                            that.constraints = $parent;
                            $parent.on([
                                    'suggestions-select.' + that.uniqueId,
                                    'suggestions-selectnothing.' + that.uniqueId,
                                    'suggestions-invalidateselection.' + that.uniqueId,
                                    'suggestions-clear.' + that.uniqueId
                            ].join(' '), $.proxy(that.onParentSelectionChanged, that));
                            $parent.on('suggestions-dispose.' + that.uniqueId, $.proxy(that.onParentDispose, that));
                        }
                    }
                } else {
                    that._constraintsUpdating = true;
                    $.each(that.constraints, $.proxy(that.removeConstraint, that));
                    $.each($.makeArray(constraints), function (i, constraint) {
                        that.addConstraint(constraint);
                    });
                    that._constraintsUpdating = false;
                    that.fixPosition();
                }
            },

            formatConstraint: function (constraint) {
                var that = this;

                if (constraint && (constraint.locations || constraint.restrictions)) {
                    constraint.locations = $.makeArray(constraint.locations || constraint.restrictions);
                    if (!constraint.label && that.type.composeValue) {
                        constraint.label = $.map(constraint.locations, function(location){
                            return that.type.composeValue(location);
                        }).join(', ');
                    }
                    return constraint;
                }
            },

            addConstraint: function (constraint) {
                var that = this,
                    $item,
                    id;

                constraint = that.formatConstraint(constraint);
                if (!constraint) {
                    return;
                }

                id = utils.uniqueId('c');
                that.constraints[id] = constraint;

                if (constraint.label) {
                    $item = $('<li/>')
                        .append($('<span/>').text(constraint.label))
                        .attr('data-constraint-id', id);
                    if (constraint.deletable) {
                        $item.append($('<span class="suggestions-remove"/>'));
                    }
                    that.$constraints.append($item);
                    if (!that._constraintsUpdating) {
                        that.fixPosition();
                    }
                }
            },

            removeConstraint: function (id) {
                var that = this;
                delete that.constraints[id];
                that.$constraints.children('[data-constraint-id="' + id + '"]').remove();
                if (!that._constraintsUpdating) {
                    that.fixPosition();
                }
            },

            constructConstraintsParams: function () {
                var that = this,
                    locations = [],
                    constraints = that.constraints,
                    parentInstance,
                    parentKladrId,
                    params = {};

                while (constraints instanceof $ && (parentInstance = constraints.suggestions()) &&
                    !(parentKladrId = utils.getDeepValue(parentInstance, 'selection.data.kladr_id'))
                ) {
                    constraints = parentInstance.constraints;
                }

                if (constraints instanceof $) {
                    if (parentKladrId) {
                        params.locations = [
                            { 'kladr_id': parentKladrId }
                        ];
                        params.restrict_value = true;
                    }
                } else {
                    $.each(constraints, function (id, constraint) {
                        locations = locations.concat(constraint.locations);
                    });
                    if (locations.length) {
                        params.locations = locations;
                        params.restrict_value = that.options.restrict_value;
                    }
                }

                return params;
            },

            /**
             * Returns label of the first constraint (if any), empty string otherwise
             * @returns {String}
             */
            getFirstConstraintLabel: function() {
                var that = this,
                    constraints_id = $.isPlainObject(that.constraints) && Object.keys(that.constraints)[0];

                return constraints_id ? that.constraints[constraints_id].label : '';
            },

            unbindFromParent: function  () {
                var $parent = this.constraints;

                if ($parent instanceof $) {
                    $parent.off('.' + this.uniqueId);
                }
            },

            onParentSelectionChanged: function (e, suggestion) {
                this.clear();
            },

            onParentDispose: function (e) {
                this.unbindFromParent();
            },

            shareWithParent: function (suggestion) {
                // that is the parent control's instance
                var that = this.constraints instanceof $ && this.constraints.suggestions(),
                    values = [],
                    locations = {};

                if (!suggestion.data || !suggestion.data.kladr_id ||
                    !that || that.selection || !that.type.boundsAvailable || !that.bounds.from && !that.bounds.to) {
                    return;
                }

                that.shareWithParent(suggestion);

                $.each(that.type.boundsAvailable, function (i, part) {
                    var value = suggestion.data[part];

                    if (value) {
                        values.push({ part: part, value: value });
                    }

                    if (part == that.bounds.to) {
                        return false;
                    }
                });

                if (values.length) {
                    that.currentValue = values.pop().value;
                    $.each(values, function (i, value) {
                        locations[value.part] = value.value;
                    });
                    // Ensure preloader is at right place
                    that.fixPosition();
                    that.getSuggestions(that.currentValue, !$.isEmptyObject(locations) && {
                        locations: [locations],
                        restrict_value: false
                    })
                        .done(function (suggestions) {
                            var parentSuggestion = suggestions[0];

                            if (parentSuggestion && parentSuggestion.data.kladr_id && suggestion.data.kladr_id.indexOf(parentSuggestion.data.kladr_id.replace(/0+$/g, '')) == 0) {
                                that.setSuggestion(parentSuggestion);
                            }
                        });
                }
            }

        };

        $.extend(defaultOptions, optionsUsed);

        $.extend(Suggestions.prototype, methods);

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
        }

        initializeHooks.push(methods.createConstraints);

        setOptionsHooks.push(methods.setupConstraints);

        fixPositionHooks.push(methods.setConstraintsPosition);

        requestParamsHooks.push(methods.constructConstraintsParams);

        disposeHooks.push(methods.unbindFromParent);

    }());

    (function(){
        /**
         * Methods for selecting a suggestion
         */

        var methods = {

            proceedQuery: function (query) {
                var that = this;

                if (query.length >= that.options.minChars) {
                    that.updateSuggestions(query);
                } else {
                    that.hide();
                }
            },

            /**
             * Selects current or first matched suggestion
             * @param selectionOptions
             * @returns {number} index of found suggestion
             */
            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    index = that.selectedIndex,
                    trim = selectionOptions && selectionOptions.trim;

                if (index === -1) {
                    var value = that.getQuery(that.el.val());
                    if (trim) {
                        value = $.trim(value);
                    }
                    index = that.findSuggestionIndex(value);
                }
                that.select(index, selectionOptions);
                return index;
            },

            /**
             * Selects a suggestion at specified index
             * @param index index of suggestion to select. Can be -1
             * @param selectionOptions  Contains flags:
             *          `continueSelecting` prevents hiding after selection,
             *          `noSpace` - prevents adding space at the end of current value
             */
            select: function (index, selectionOptions) {
                var that = this,
                    suggestion = that.suggestions[index],
                    continueSelecting = selectionOptions && selectionOptions.continueSelecting,
                    noSpace = selectionOptions && selectionOptions.noSpace,
                    addSpace = selectionOptions && selectionOptions.addSpace;

                // if no suggestion to select
                if (!suggestion) {
                    if (!continueSelecting && !that.selection) {
                        that.triggerOnSelectNothing();
                    }
                    onSelectionCompleted();
                    return;
                }

                // Set input's value to prevent onChange
                that.currentValue = that.getValue(suggestion.value);
                that.el.val(that.currentValue);

                that.enrichService.enrichSuggestion.call(that, suggestion)
                    .done(function (enrichedSuggestion) {
                        var assumeDataComplete = that.type.isDataComplete.call(that, enrichedSuggestion.data);

                        if (assumeDataComplete) {
                            continueSelecting = false;
                        }

                        that.currentValue = enrichedSuggestion.bounded_value || enrichedSuggestion.value;
                        if (!noSpace && !assumeDataComplete || addSpace) {
                            that.currentValue += ' ';
                        }
                        that.el.val(that.currentValue);
                        that.selection = enrichedSuggestion;

                        that.trigger('Select', enrichedSuggestion);
                        onSelectionCompleted();
                        that.shareWithParent(enrichedSuggestion);
                    });

                function onSelectionCompleted() {
                    if (continueSelecting) {
                        that.selectedIndex = -1;
                        that.updateSuggestions(that.currentValue);
                    } else {
                        that.hide();
                    }
                }

            },

            triggerOnSelectNothing: function() {
                this.trigger('SelectNothing', this.currentValue);
            },

            trigger: function(event) {
                var that = this,
                    args = utils.slice(arguments, 1),
                    callback = that.options['on' + event];

                if ($.isFunction(callback)) {
                    callback.apply(that.element, args);
                }
                that.el.trigger.apply(that.el, ['suggestions-' + event.toLowerCase()].concat(args));
            },

            trySelectOnSpace: function (value) {
                var that = this,
                    rLastSpace = /\s$/,
                    index;

                if (that.options.triggerSelectOnSpace &&
                    that._waitingForTriggerSelectOnSpace &&
                    rLastSpace.test(value)
                    ) {
                    index = that.findSuggestionIndex($.trim(value));
                    if (index !== -1) {
                        that._waitingForTriggerSelectOnSpace = false;
                        that.select(index, {continueSelecting: true, addSpace: true});
                    }
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        assignSuggestionsHooks.push(methods.trySelectOnSpace)

    }());


(function() {
    /**
     * features for connected instances
     */

    var optionsUsed = {
        bounds: null
    };

    var methods = {

        setupBounds: function () {
            this.bounds = {
                from: null,
                to: null
            };
        },

        setBoundsOptions: function () {
            var that = this,
                newBounds = $.trim(that.options.bounds).split('-');

            that.bounds.from = newBounds[0];
            that.bounds.to = newBounds[newBounds.length - 1];
        },

        constructBoundsParams: function () {
            var that = this,
                params = {};

            if (that.bounds.from) {
                params['from_bound'] = { value: that.bounds.from };
            }
            if (that.bounds.to) {
                params['to_bound'] = { value: that.bounds.to };
            }

            return params;
        }

    };

    $.extend(defaultOptions, optionsUsed);

    initializeHooks.push(methods.setupBounds);

    setOptionsHooks.push(methods.setBoundsOptions);

    requestParamsHooks.push(methods.constructBoundsParams);

})();

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
