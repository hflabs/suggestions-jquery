/**
 * DaData.ru Suggestions jQuery plugin, version 4.10.7
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
             * Compares two objects, but only fields that are set in both
             * @param a
             * @param b
             * @returns {boolean}
             */
            areSame: function self(a, b) {
                var same = true;

                if (typeof a != typeof b) {
                    return false;
                }

                if (typeof a == 'object' && a != null && b != null) {
                    $.each(a, function (i, value) {
                        return same = self(value, b[i]);
                    });
                    return same;
                }

                return a === b;
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

                var words = this.compact(str.split(wordSplitter)),
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
            getDeepValue: function self(obj, name) {
                var path = name.split('.'),
                    step = path.shift();

                return obj && (path.length ? self(obj[step], path.join('.')) : obj[step]);
            },
            reWordExtractor: function () {
                return new RegExp('([^' + wordDelimiters + ']*)([' + wordDelimiters + ']*)', 'g');
            },
            formatToken: function (token) {
                return token && token.toLowerCase().replace(/[ёЁ]/g, 'е');
            },
            withSubTokens: function (tokens) {
                var result = [];

                $.each(tokens, function (i, token) {
                    var subtokens = token.split(wordPartsSplitter);

                    result.push(token);

                    if (subtokens.length > 1) {
                        result = result.concat(utils.compact(subtokens));
                    }
                });

                return result;
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
                    tokens = utils.withSubTokens(utils.getWords(query.toLowerCase(), stopwords)),
                    matches = [];

                $.each(suggestions, function(i, suggestion) {
                    var suggestionWords = [];

                    if (fieldsStopwords) {
                        $.each(fieldsStopwords, function (field, stopwords) {
                            var fieldValue = utils.getDeepValue(suggestion.data, field),
                                fieldWords = fieldValue && utils.withSubTokens(utils.getWords(fieldValue.toLowerCase(), stopwords));

                            if (fieldWords && fieldWords.length) {
                                suggestionWords = suggestionWords.concat(fieldWords);
                            }
                        });
                    }

                    if (utils.arrayMinus(tokens, suggestionWords).length === 0) {
                        matches.push(i);
                    }
                });

                return matches.length == 1 ? matches[0] : -1;
            }

        };

    }();

    (function () {

        var ADDRESS_STOPWORDS = ['ао', 'аобл', 'дом', 'респ', 'а/я', 'аал', 'автодорога', 'аллея', 'арбан', 'аул', 'б-р', 'берег', 'бугор', 'вал', 'вл', 'волость', 'въезд', 'высел', 'г', 'городок', 'гск', 'д', 'двлд', 'днп', 'дор', 'дп', 'ж/д_будка', 'ж/д_казарм', 'ж/д_оп', 'ж/д_платф', 'ж/д_пост', 'ж/д_рзд', 'ж/д_ст', 'жилзона', 'жилрайон', 'жт', 'заезд', 'заимка', 'зона', 'к', 'казарма', 'канал', 'кв', 'кв-л', 'км', 'кольцо', 'комн', 'кордон', 'коса', 'кп', 'край', 'линия', 'лпх', 'м', 'массив', 'местность', 'мкр', 'мост', 'н/п', 'наб', 'нп', 'обл', 'округ', 'остров', 'оф', 'п', 'п/о', 'п/р', 'п/ст', 'парк', 'пгт', 'пер', 'переезд', 'пл', 'пл-ка', 'платф', 'погост', 'полустанок', 'починок', 'пр-кт', 'проезд', 'промзона', 'просек', 'просека', 'проселок', 'проток', 'протока', 'проулок', 'р-н', 'рзд', 'россия', 'рп', 'ряды', 'с', 'с/а', 'с/мо', 'с/о', 'с/п', 'с/с', 'сад', 'сквер', 'сл', 'снт', 'спуск', 'ст', 'ст-ца', 'стр', 'тер', 'тракт', 'туп', 'у', 'ул', 'уч-к', 'ф/х', 'ферма', 'х', 'ш', 'бульвар', 'владение', 'выселки', 'гаражно-строительный', 'город', 'деревня', 'домовладение', 'дорога', 'квартал', 'километр', 'комната', 'корпус', 'литер', 'леспромхоз', 'местечко', 'микрорайон', 'набережная', 'область', 'переулок', 'платформа', 'площадка', 'площадь', 'поселение', 'поселок', 'проспект', 'разъезд', 'район', 'республика', 'село', 'сельсовет', 'слобода', 'сооружение', 'станица', 'станция', 'строение', 'территория', 'тупик', 'улица', 'улус', 'участок', 'хутор', 'шоссе'];

        function valueStartsWith (suggestion, field){
            var fieldValue = suggestion.data && suggestion.data[field];

            return fieldValue &&
                new RegExp('^' + utils.escapeRegExChars(fieldValue) + '([' + wordDelimiters + ']|$)','i')
                    .test(suggestion.value);
        }

        types['NAME'] = {
            matchers: [matchers.matchByNormalizedQuery, matchers.matchByWords],
            isDataComplete: function (suggestion) {
                var that = this,
                    params = that.options.params,
                    data = suggestion.data,
                    fields;

                if (params && params.parts) {
                    fields = $.map(params.parts, function (part) {
                        return part.toLowerCase();
                    });
                } else {
                    // when NAME is first, patronymic is mot mandatory
                    fields = ['surname', 'name'];
                    // when SURNAME is first, it is
                    if (valueStartsWith(suggestion, 'surname')) {
                        fields.push('patronymic');
                    }
                }
                return utils.fieldsNotEmpty(data, fields);
            },
            composeValue: function (data) {
                return utils.compact([data.surname, data.name, data.patronymic]).join(' ');
            },
            urlSuffix: 'fio',

            // names for labels, describing which fields are displayed
            fieldNames: {
                surname: 'фамилия',
                name: 'имя',
                patronymic: 'отчество'
            },
            // try to suggest even if a suggestion has been selected manually
            alwaysContinueSelecting: true
        };

        types['ADDRESS'] = {
            STOPWORDS: ADDRESS_STOPWORDS,
            matchers: [matchers.matchByNormalizedQuery, matchers.matchByWords],
            geoEnabled: true,
            enrichmentEnabled: true,
            boundsAvailable: ['region', 'area', 'city', 'settlement', 'street', 'house'],
            boundsFields: {
                'region': ['region', 'region_type', 'region_type_full', 'region_with_type'],
                'area': ['area', 'area_type', 'area_type_full', 'area_with_type'],
                'city': ['city', 'city_type', 'city_type_full', 'city_with_type'],
                'settlement': ['settlement', 'settlement_type', 'settlement_type_full', 'settlement_with_type'],
                'street': ['street', 'street_type', 'street_type_full', 'street_with_type'],
                'house': ['house', 'house_type', 'house_type_full',
                    'block', 'block_type']
            },
            isDataComplete: function (suggestion) {
                var fields = [this.bounds.to || 'flat'],
                    data = suggestion.data;

                return !$.isPlainObject(data) || utils.fieldsNotEmpty(data, fields);
            },
            composeValue: function (data) {
                return utils.compact([
                    data.region_with_type || utils.compact([data.region, data.region_type]).join(' '),
                    data.area_with_type || utils.compact([data.area_type, data.area]).join(' '),
                    data.city_with_type || utils.compact([data.city_type, data.city]).join(' '),
                    data.settlement_with_type || utils.compact([data.settlement_type, data.settlement]).join(' '),
                    data.street_with_type || utils.compact([data.street_type, data.street]).join(' '),
                    utils.compact([data.house_type, data.house, data.block_type, data.block]).join(' '),
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
            isDataComplete: function (suggestion) {
                return true;
            },
            // composeValue not needed
            urlSuffix: 'party',
            formatResult: function (value, currentValue, suggestion, options) {
                var that = this,
                    formattedInn = that.type.formatResultInn.call(that, suggestion, currentValue),
                    address = utils.getDeepValue(suggestion, 'data.address.value');

                if (that.isMobile) {
                    (options || (options = {})).maxLength = 50;
                }

                value = that.formatResult.call(that, value, currentValue, suggestion, options);

                if (address) {
                    address = address.replace(/^\d{6}( РОССИЯ)?, /i, '');
                    if (that.isMobile) {
                        // keep only two first words
                        address = address.replace(new RegExp('^([^' + wordDelimiters + ']+[' + wordDelimiters + ']+[^' + wordDelimiters + ']+).*'), '$1');
                    } else {
                        address = that.formatResult(address, currentValue, suggestion, {
                            unformattableTokens: ADDRESS_STOPWORDS
                        });
                    }
                }

                if (formattedInn || address) {
                    value +=
                        '<div class="' + that.classes.subtext + '">' +
                        '<span class="' + that.classes.subtext_inline + '">' + (formattedInn || '') + '</span>' +
                        (address || '') +
                        '</div>';
                }
                return value;
            },
            innPartsLength: {
                'LEGAL': [2, 2, 5, 1],
                'INDIVIDUAL': [2, 2, 6, 2]
            },
            formatResultInn: function(suggestion, currentValue) {
                var that = this,
                    inn = suggestion.data && suggestion.data.inn,
                    innPartsLength = that.type.innPartsLength[suggestion.data && suggestion.data.type],
                    innParts,
                    formattedInn,
                    rDigit = /\d/;

                if (inn) {
                    formattedInn = that.formatResult(inn, currentValue, suggestion);
                    if (innPartsLength) {
                        formattedInn = formattedInn.split('');
                        innParts = $.map(innPartsLength, function (partLength) {
                            var formattedPart = '',
                                char;

                            while (partLength && (char = formattedInn.shift())) {
                                formattedPart += char;
                                if (rDigit.test(char)) partLength--;
                            }

                            return formattedPart;
                        });
                        formattedInn = innParts.join('<span class="' + that.classes.subtext_delimiter + '"></span>') +
                            formattedInn.join('');
                    }

                    return formattedInn;
                }
            }
        };

        types['EMAIL'] = {
            urlSuffix: 'email',
            matchers: [matchers.matchByNormalizedQuery],
            isDataComplete: function (suggestion) {
                return true;
            },
            isQueryRequestable: function (query) {
                return this.options.suggest_local || query.indexOf('@') >= 0;
            }
        };

        $.extend(defaultOptions, {
            suggest_local: true
        });

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

    Suggestions.version = '4.10.7';

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

    (function(){
        /**
         * Methods related to INPUT's behavior
         */

        var methods = {

            bindElementEvents: function () {
                var that = this;

                that.el.on('keydown' + eventNS, $.proxy(that.onElementKeyDown, that));
                // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
                that.el.on(['keyup' + eventNS, 'cut' + eventNS, 'paste' + eventNS, 'input' + eventNS].join(' '), $.proxy(that.onElementKeyUp, that));
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
                that.selectCurrentValue({ trim: true, noSpace: true })
                    .done(function (index) {
                        // For NAMEs selecting keeps suggestions list visible, so hide it
                        that.hide();
                    });
                if (!that.currentRequestIsEnrich) {
                    that.abortRequest();
                }
            },

            onElementFocus: function () {
                var that = this;

                if (!that.cancelFocus) {
                    // defer methods to allow browser update input's style before
                    utils.delay($.proxy(that.completeOnFocus, that));
                }
                that.cancelFocus = false;
            },

            onElementKeyDown: function (e) {
                var that = this;

                if (that.disabled) {
                    return;
                }

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
                            e.preventDefault();
                            that.selectCurrentValue({
                                continueSelecting: true,
                                dontEnrich: true
                            })
                                .done(function (index) {
                                    // If all data fetched but nothing selected
                                    if (index === -1) {
                                        that.currentValue += ' ';
                                        that.el.val(that.currentValue);
                                        that.update();
                                    }
                                });
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
                    case keys.ENTER:
                        return;
                }

                // Cancel pending change
                clearTimeout(that.onChangeTimeout);
                that.inputPhase.reject();

                if (that.currentValue !== that.el.val()) {

                    that.inputPhase = $.Deferred()
                        .done($.proxy(that.onValueChange, that));

                    if (that.options.deferRequestBy > 0) {
                        // Defer lookup in case when value changes very quickly:
                        that.onChangeTimeout = utils.delay(function () {
                            that.inputPhase.resolve();
                        }, that.options.deferRequestBy);
                    } else {
                        that.inputPhase.resolve();
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

                that.currentValue = value;
                that.selectedIndex = -1;

                that.update();
                that.notify('valueChange');
            },

            completeOnFocus: function () {
                var that = this;

                if (document.activeElement === that.element) {
                    that.fixPosition();
                    that.update();
                    if (that.isMobile) {
                        that.setCursorAtEnd();
                        that.scrollToTop();
                    }
                }
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

            setCursorAtEnd: function () {
                var element = this.element;

                element.selectionEnd = element.selectionStart = element.value.length;
                element.scrollLeft = element.scrollWidth;
            }


    };

        $.extend(Suggestions.prototype, methods);

        notificator
            .on('initialize', methods.bindElementEvents)
            .on('dispose', methods.unbindElementEvents);

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

        notificator
            .on('setOptions', methods.checkToken);

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

        notificator
            .on('setOptions', methods.checkLocation)
            .on('requestParams', methods.constructParams);

    }());

    (function(){

        var methods = {

            enrichSuggestion: function (suggestion, selectionOptions) {
                var that = this,
                    token = $.trim(that.options.token),
                    resolver = $.Deferred();

                if (!that.options.useDadata || !that.type.enrichmentEnabled || !token || selectionOptions && selectionOptions.dontEnrich) {
                    return resolver.resolve(suggestion);
                }

                // if current suggestion is already enriched, use it
                if (suggestion.data && suggestion.data.qc != null) {
                    return resolver.resolve(suggestion);
                }

                that.disableDropdown();
                that.currentValue = suggestion.value;

                // prevent request abortion during onBlur
                that.currentRequestIsEnrich = true;
                that.getSuggestions(suggestion.value, { count: 1 }, { noCallbacks: true, useEnrichmentCache: true })
                    .always(function () {
                        that.enableDropdown();
                    })
                    .done(function (suggestions) {
                        var enrichedSuggestion = suggestions && suggestions[0];

                        resolver.resolve(enrichedSuggestion || suggestion, !!enrichedSuggestion);
                    })
                    .fail(function () {
                        resolver.resolve(suggestion);
                    });
                return resolver;
            },

            /**
             * Injects enriched suggestion into response
             * @param response
             * @param query
             */
            enrichResponse: function (response, query) {
                var that = this,
                    enrichedSuggestion = that.enrichmentCache[query];

                if (enrichedSuggestion) {
                    $.each(response.suggestions, function(i, suggestion){
                        if (suggestion.value === query) {
                            response.suggestions[i] = enrichedSuggestion;
                            return false;
                        }
                    });
                }
            }

        };

        $.extend(defaultOptions, {
            useDadata: true
        });

        $.extend(Suggestions.prototype, methods);

    }());

    (function(){
        /**
         * Methods related to suggestions dropdown list
         */

        function highlightMatches(chunks) {
            return $.map(chunks, function (chunk) {
                var text = utils.escapeHtml(chunk.text);

                if (text && chunk.matched) {
                    text = '<strong>' + text + '</strong>';
                }
                return text;
            }).join('');
        }

        function nowrapLinkedParts(formattedStr, nowrapClass) {
            var delimitedParts = formattedStr.split(', ');
            // string has no delimiters, should not wrap
            if (delimitedParts.length === 1) {
                return formattedStr;
            }
            // disable word-wrap inside delimited parts
            return $.map(delimitedParts, function (part) {
                return '<span class="' + nowrapClass + '">' + part + '</span>'
            }).join(', ');
        }

        function hasAnotherSuggestion (suggestions, suggestion) {
            var result = false;

            $.each(suggestions, function (i, s) {
                result = s.value == suggestion.value && s != suggestion;
                if (result) {
                    return false;
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
                var that = this;

                that.$container
                    .toggleClass(that.classes.mobile, that.isMobile)
                    .css(that.isMobile ? {
                        left: origin.left - elLayout.left + 'px',
                        top: origin.top + elLayout.outerHeight + 'px',
                        width: that.$viewport.width() + 'px'
                    } : {
                        left: origin.left + 'px',
                        top: origin.top + elLayout.borderTop + elLayout.innerHeight + 'px',
                        width: (that.options.width === 'auto' ? that.el.outerWidth() : that.options.width) + 'px'
                    });

                that.containerItemsPadding = elLayout.left + elLayout.borderLeft + elLayout.paddingLeft;
            },

            setItemsPositions: function () {
                var that = this,
                    $items = that.getSuggestionsItems();

                $items.css('paddingLeft', that.isMobile ? that.containerItemsPadding + 'px' : '');
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
                    beforeRender = options.beforeRender,
                    html = [],
                    index;

                // Build hint html
                if (!that.isMobile && options.hint && that.suggestions.length) {
                    html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
                }
                that.selectedIndex = -1;
                // Build suggestions inner HTML:
                $.each(that.suggestions, function (i, suggestion) {
                    var labels = that.makeSuggestionLabel(that.suggestions, suggestion);

                    if (suggestion == that.selection) {
                        that.selectedIndex = i;
                    }
                    html.push(
                        '<div class="' + that.classes.suggestion + '" data-index="' + i + '">' +
                            formatResult.call(that, suggestion.value, that.currentValue, suggestion, {
                                unformattableTokens: that.type.STOPWORDS
                            })
                    );
                    if (labels) {
                        html.push('<span class="' + that.classes.subtext_label + '">' + utils.escapeHtml(labels) + '</span>');
                    }
                    html.push('</div>');
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
                that.setItemsPositions();
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

                var that = this,
                    chunks = [],
                    unformattableTokens = options && options.unformattableTokens,
                    maxLength = options && options.maxLength,
                    tokens, tokenMatchers,
                    rWords = utils.reWordExtractor(),
                    match, i, chunk, formattedStr;

                tokens = utils.formatToken(currentValue).split(wordSplitter);
                tokens = utils.arrayMinus(utils.withSubTokens(tokens), unformattableTokens);

                tokenMatchers = $.map(tokens, function (token) {
                    return new RegExp('^((.*)([' + wordPartsDelimiters + ']+))?' +
                        '(' + utils.escapeRegExChars(token) + ')' +
                        '([^' + wordPartsDelimiters + ']*[' + wordPartsDelimiters + ']*)', 'i');
                });

                // parse string by words
                while ((match = rWords.exec(value)) && match[0]) {
                    chunks.push({
                        text: match[1],
                        formatted: utils.formatToken(match[1]),
                        matchable: true
                    });
                    if (match[2]) {
                        chunks.push({
                            text: match[2]
                        });
                    }
                }

                // use simple loop because length can change
                for (i = 0; i < chunks.length; i++) {
                    chunk = chunks[i];
                    if (chunk.matchable && !chunk.matched && $.inArray(chunk.formatted, unformattableTokens) === -1) {
                        $.each(tokenMatchers, function (j, matcher) {
                            var tokenMatch = matcher.exec(chunk.formatted),
                                length, nextIndex = i + 1;

                            if (tokenMatch) {
                                tokenMatch = {
                                    before: tokenMatch[1] || '',
                                    beforeText: tokenMatch[2] || '',
                                    beforeDelimiter: tokenMatch[3] || '',
                                    text: tokenMatch[4] || '',
                                    after: tokenMatch[5] || ''
                                };

                                if (tokenMatch.before) {
                                    // insert chunk before current
                                    chunks.splice(i, 0, {
                                        text: chunk.text.substr(0, tokenMatch.beforeText.length),
                                        formatted: tokenMatch.beforeText,
                                        matchable: true
                                    }, {
                                        text: tokenMatch.beforeDelimiter
                                    });
                                    nextIndex += 2;

                                    length = tokenMatch.before.length;
                                    chunk.text = chunk.text.substr(length);
                                    chunk.formatted = chunk.formatted.substr(length);
                                    i--;
                                }

                                length = tokenMatch.text.length + tokenMatch.after.length;
                                if (chunk.formatted.length > length) {
                                    chunks.splice(nextIndex, 0, {
                                        text: chunk.text.substr(length),
                                        formatted: chunk.formatted.substr(length),
                                        matchable: true
                                    });
                                    chunk.text = chunk.text.substr(0, length);
                                    chunk.formatted = chunk.formatted.substr(0, length);
                                }

                                if (tokenMatch.after) {
                                    length = tokenMatch.text.length;
                                    chunks.splice(nextIndex, 0, {
                                        text: chunk.text.substr(length),
                                        formatted: chunk.formatted.substr(length)
                                    });
                                    chunk.text = chunk.text.substr(0, length);
                                    chunk.formatted = chunk.formatted.substr(0, length);
                                }
                                chunk.matched = true;
                                return false;
                            }
                        });
                    }
                }

                if (maxLength) {
                    for (i = 0; i < chunks.length && maxLength >= 0; i++) {
                        chunk = chunks[i];
                        maxLength -= chunk.text.length;
                        if (maxLength < 0) {
                            chunk.text = chunk.text.substr(0, chunk.text.length + maxLength) + '...';
                        }
                    }
                    chunks.length = i;
                }

                formattedStr = highlightMatches(chunks);
                return nowrapLinkedParts(formattedStr, that.classes.nowrap);
            },

            makeSuggestionLabel: function (suggestions, suggestion) {
                var that = this,
                    fieldNames = that.type.fieldNames,
                    nameData = {},
                    rWords = utils.reWordExtractor(),
                    match, word,
                    labels = [];

                if (fieldNames && hasAnotherSuggestion(suggestions, suggestion) && suggestion.data) {

                    $.each(fieldNames, function (field) {
                        var value = suggestion.data[field];
                        if (value) {
                            nameData[field] = utils.formatToken(value);
                        }
                    });

                    if (!$.isEmptyObject(nameData)) {
                        while ((match = rWords.exec(utils.formatToken(suggestion.value))) && (word = match[1])) {
                            $.each(nameData, function (i, value) {
                                if (value == word) {
                                    labels.push(fieldNames[i]);
                                    delete nameData[i];
                                    return false;
                                }
                            });
                        }

                        if (labels.length) {
                            return labels.join(', ');
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

                that.el.val(that.suggestions[index].value);
            }

        };

        $.extend(Suggestions.prototype, methods);

        notificator
            .on('initialize', methods.createContainer)
            .on('fixPosition', methods.setDropdownPosition)
            .on('fixPosition', methods.setItemsPositions)
            .on('assignSuggestions', methods.suggest);

    }());

    (function(){
        /**
         * Methods related to right-sided component
         */

        var QUEUE_NAME = 'addon',
            BEFORE_SHOW_ADDON = 50,
            BEFORE_RESTORE_PADDING = 1000;

        var optionsUsed = {
            addon: null
        };

        var ADDON_TYPES = {
            'NONE': 'none',
            'SPINNER': 'spinner',
            'CLEAR': 'clear'
        };

        var Addon = function (owner) {
            var that = this,
                $el = $('<span class="suggestions-addon"/>');

            that.owner = owner;
            that.$el = $el;
            that.type = ADDON_TYPES.NONE;
            that.visible = false;
            that.initialPadding = null;

            $el.on('click', $.proxy(that, 'onClick'));
        };

        Addon.prototype = {

            checkType: function () {
                var that = this,
                    type = that.owner.options.addon,
                    isTypeCorrect = false;

                $.each(ADDON_TYPES, function (key, value) {
                    isTypeCorrect = value == type;
                    if (isTypeCorrect) {
                        return false;
                    }
                });

                if (!isTypeCorrect) {
                    type = that.owner.isMobile ? ADDON_TYPES.CLEAR : ADDON_TYPES.SPINNER;
                }

                if (type != that.type) {
                    that.type = type;
                    that.$el.attr('data-addon-type', type);
                    that.toggle(true);
                }
            },

            toggle: function (immediate) {
                var that = this,
                    visible;

                switch (that.type) {
                    case ADDON_TYPES.CLEAR:
                        visible = !!that.owner.currentValue;
                        break;
                    case ADDON_TYPES.SPINNER:
                        visible = !!that.owner.currentRequest;
                        break;
                    default:
                        visible = false;
                }

                if (visible != that.visible) {
                    that.visible = visible;
                    if (visible) {
                        that.show(immediate);
                    } else {
                        that.hide(immediate);
                    }
                }
            },

            show: function (immediate) {
                var that = this,
                    style = {'opacity': 1};

                if (immediate) {
                    that.$el
                        .show()
                        .css(style);
                    that.showBackground(true);
                } else {
                    that.$el
                        .stop(true, true)
                        .delay(BEFORE_SHOW_ADDON)
                        .queue(function () {
                            that.$el.show();
                            that.showBackground();
                            that.$el.dequeue();
                        })
                        .animate(style, 'fast');
                }
            },

            hide: function (immediate) {
                var that = this,
                    style = {'opacity': 0};

                if (immediate) {
                    that.$el
                        .hide()
                        .css(style);
                }
                that.$el
                    .stop(true)
                    .animate(style, {
                        duration: 'fast',
                        complete: function () {
                            that.$el.hide();
                            that.hideBackground();
                        }
                    });
            },

            fixPosition: function(origin, elLayout){
                var that = this,
                    addonSize = elLayout.innerHeight;

                that.checkType();
                that.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - addonSize + 'px',
                    top: origin.top + elLayout.borderTop + 'px',
                    height: addonSize,
                    width: addonSize
                });

                that.initialPadding = elLayout.paddingRight;
                that.width = addonSize;
                if (that.visible) {
                    elLayout.componentsRight += addonSize;
                }
            },

            showBackground: function (immediate) {
                var that = this,
                    $el = that.owner.el,
                    style = {'paddingRight': that.width};

                if (that.width > that.initialPadding) {
                    that.stopBackground();
                    if (immediate) {
                        $el.css(style);
                    } else {
                        $el
                            .animate(style, { duration: 'fast', queue: QUEUE_NAME })
                            .dequeue(QUEUE_NAME);
                    }
                }
            },

            hideBackground: function (immediate) {
                var that = this,
                    $el = that.owner.el,
                    style = {'paddingRight': that.initialPadding};

                if (that.width > that.initialPadding) {
                    that.stopBackground(true);
                    if (immediate) {
                        $el.css(style);
                    } else {
                        $el
                            .delay(BEFORE_RESTORE_PADDING, QUEUE_NAME)
                            .animate(style, { duration: 'fast', queue: QUEUE_NAME })
                            .dequeue(QUEUE_NAME);
                    }
                }
            },

            stopBackground: function (gotoEnd) {
                this.owner.el.stop(QUEUE_NAME, true, gotoEnd);
            },

            onClick: function (e) {
                var that = this;

                if (that.type == ADDON_TYPES.CLEAR) {
                    that.owner.clear();
                }
            }

        };

        var methods = {

            createAddon: function () {
                var that = this,
                    addon = new Addon(that);

                that.$wrapper.append(addon.$el);
                that.addon = addon;
            },

            fixAddonPosition: function (origin, elLayout) {
                this.addon.fixPosition(origin, elLayout);
            },

            checkAddonType: function () {
                this.addon.checkType();
            },

            checkAddonVisibility: function () {
                this.addon.toggle();
            },

            stopBackground: function () {
                this.addon.stopBackground();
            }

        };

        $.extend(defaultOptions, optionsUsed);

        notificator
            .on('initialize', methods.createAddon)
            .on('setOptions', methods.checkAddonType)
            .on('fixPosition', methods.fixAddonPosition)
            .on('clear', methods.checkAddonVisibility)
            .on('valueChange', methods.checkAddonVisibility)
            .on('request', methods.checkAddonVisibility)
            .on('resetPosition', methods.stopBackground);

    }());

    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */
        var optionsUsed = {
            constraints: null,
            restrict_value: false
        };

        var LOCATION_FIELDS = ['kladr_id', 'postal_code', 'region', 'area', 'city', 'settlement', 'street'];

        function filteredLocation (data) {
            var location = {};

            if ($.isPlainObject(data)) {
                $.each(data, function(key, value) {
                    if (value && LOCATION_FIELDS.indexOf(key) >= 0) {
                        location[key] = value;
                    }
                });
            }

            if (!$.isEmptyObject(location)) {
                return location.kladr_id ? { kladr_id: location.kladr_id } : location;
            }
        }

        /**
         * Compares two suggestion objects
         * @param suggestion
         * @param instance other Suggestions instance
         */
        function belongsToArea(suggestion, instance){
            var result = true,
                parentSuggestion = instance.selection;

            if (parentSuggestion && parentSuggestion.data && instance.bounds) {
                $.each(instance.bounds.all, function (i, bound) {
                    return (result = parentSuggestion.data[bound] === suggestion.data[bound]);
                });
                return result;
            }
        }

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

                elLayout.componentsLeft += that.$constraints.outerWidth(true) + elLayout.paddingLeft;
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
                            $parent.on(
                                [
                                    'suggestions-select.' + that.uniqueId,
                                    'suggestions-invalidateselection.' + that.uniqueId,
                                    'suggestions-clear.' + that.uniqueId
                                ].join(' '),
                                $.proxy(that.onParentSelectionChanged, that)
                            );
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

            /**
             * Checks for required fields
             * Also checks `locations` objects for having acceptable fields
             * @param constraint
             * @returns {*}
             */
            formatConstraint: function (constraint) {
                var that = this,
                    locations;

                if (constraint && (constraint.locations || constraint.restrictions)) {
                    locations = $.makeArray(constraint.locations || constraint.restrictions);
                    if (constraint.label == null && that.type.composeValue) {
                        constraint.label = $.map(locations, function(location){
                            return that.type.composeValue(location);
                        }).join(', ');
                    }

                    constraint.locations = [];
                    $.each(locations, function (i, location) {
                        var filtered = filteredLocation(location);

                        if (filtered) {
                            constraint.locations.push(filtered);
                        }
                    });

                    return constraint.locations.length ? constraint : null;
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
                    parentData,
                    params = {};

                while (constraints instanceof $ && (parentInstance = constraints.suggestions()) &&
                    !(parentData = utils.getDeepValue(parentInstance, 'selection.data'))
                ) {
                    constraints = parentInstance.constraints;
                }

                if (constraints instanceof $) {
                    parentData = filteredLocation(parentData);
                    if (parentData) {
                        params.locations = [ parentData ];
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
                    parentValueData;

                if (!that || that.type !== this.type || belongsToArea(suggestion, that)) {
                    return;
                }

                that.shareWithParent(suggestion);

                parentValueData = that.copyBoundedData(suggestion.data, that.bounds.own);
                parentValueData = that.type.composeValue(parentValueData);

                if (parentValueData) {
                    that.setSuggestion({
                        value: parentValueData,
                        data: that.copyBoundedData(suggestion.data, that.bounds.all)
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

        notificator
            .on('initialize', methods.createConstraints)
            .on('setOptions', methods.setupConstraints)
            .on('fixPosition', methods.setConstraintsPosition)
            .on('requestParams', methods.constructConstraintsParams)
            .on('dispose', methods.unbindFromParent);

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
             * Selects current or first matched suggestion, but firstly waits for data ready
             * @param selectionOptions
             * @returns {$.Deferred} promise, resolved with index of selected suggestion
             */
            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    result = $.Deferred();

                // force onValueChange to be executed if it has been deferred
                that.inputPhase.resolve();

                that.dataPhase
                    .done(function () {
                        result.resolve(that.doSelectCurrentValue(selectionOptions));
                    });

                return result;
            },

            /**
             * Selects current or first matched suggestion
             * @param selectionOptions
             * @returns {number} index of found suggestion
             */
            doSelectCurrentValue: function(selectionOptions) {
                var that = this,
                    index = that.selectedIndex,
                    trim = selectionOptions && selectionOptions.trim,
                    value;

                if (index === -1) {
                    value = that.el.val();
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
                    noSpace = selectionOptions && selectionOptions.noSpace;

                // if no suggestion to select
                if (!suggestion) {
                    if (!continueSelecting && !that.selection) {
                        that.triggerOnSelectNothing();
                    }
                    that.onSelectComplete(continueSelecting);
                    return;
                }

                that.enrichSuggestion(suggestion, selectionOptions)
                    .done(function (enrichedSuggestion, hasBeenEnriched) {
                        var assumeDataComplete = that.type.isDataComplete.call(that, enrichedSuggestion),
                            formattedValue,
                            currentSelection = that.selection;

                        if (that.type.alwaysContinueSelecting) {
                            continueSelecting = true;
                        }

                        if (assumeDataComplete) {
                            continueSelecting = false;
                        }

                        if (hasBeenEnriched) {
                            that.suggestions[index] = enrichedSuggestion;
                        }
                        that.checkValueBounds(enrichedSuggestion);
                        if ($.isFunction(that.options.formatSelected)) {
                            formattedValue = that.options.formatSelected.call(that, enrichedSuggestion);
                        }

                        that.currentValue = (typeof formattedValue === 'string' && formattedValue.length)
                            ? formattedValue
                            : enrichedSuggestion.value;

                        if (!noSpace && !assumeDataComplete) {
                            that.currentValue += ' ';
                        }
                        that.el.val(that.currentValue);
                        that.selection = enrichedSuggestion;

                        if (!that.areSuggestionsSame(enrichedSuggestion, currentSelection)) {
                            that.trigger('Select', enrichedSuggestion);
                        }
                        that.onSelectComplete(continueSelecting);
                        that.shareWithParent(enrichedSuggestion);
                    });

            },

            onSelectComplete: function (continueSelecting) {
                var that = this;

                if (continueSelecting) {
                    that.selectedIndex = -1;
                    that.updateSuggestions(that.currentValue);
                } else {
                    that.hide();
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
            }

        };

        $.extend(Suggestions.prototype, methods);

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
                boundsAvailable = that.type.boundsAvailable,
                newBounds = $.trim(that.options.bounds).split('-'),
                boundFrom = newBounds[0],
                boundTo = newBounds[newBounds.length - 1],
                boundsOwn = [],
                boundIsOwn,
                boundsAll = [],
                indexTo;

            if ($.inArray(boundFrom, boundsAvailable) === -1) {
                boundFrom = null;
            }

            indexTo = $.inArray(boundTo, boundsAvailable);
            if (indexTo === -1 || indexTo === boundsAvailable.length - 1) {
                boundTo = null;
            }

            if (boundFrom || boundTo) {
                boundIsOwn = !boundFrom;
                $.each(boundsAvailable, function (i, bound) {
                    if (bound == boundFrom) {
                        boundIsOwn = true;
                    }
                    boundsAll.push(bound);
                    if (boundIsOwn) {
                        boundsOwn.push(bound);
                    }
                    if (bound == boundTo) {
                        return false;
                    }
                });
            }

            that.bounds.from = boundFrom;
            that.bounds.to = boundTo;
            that.bounds.all = boundsAll;
            that.bounds.own = boundsOwn;
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
        },

        checkValueBounds: function (suggestion) {
            var that = this,
                valueData = that.copyBoundedData(suggestion.data, that.bounds.own);

            if (!$.isEmptyObject(valueData) && that.type.composeValue) {
                valueData = that.type.composeValue(valueData);
                if (valueData) {
                    suggestion.value = valueData;
                }
            }
        },

        copyBoundedData: function (data, boundsRange) {
            var result = {},
                boundsFields = this.type.boundsFields;

            if (boundsFields) {
                $.each(boundsRange, function (i, bound) {
                    var fields = boundsFields[bound];

                    if (fields) {
                        $.each(fields, function (i, field) {
                            if (data[field] != null) {
                                result[field] = data[field];
                            }
                        })
                    }
                });
            }

            return result;
        }

    };

    $.extend(defaultOptions, optionsUsed);

    $.extend($.Suggestions.prototype, methods);

    notificator
        .on('initialize', methods.setupBounds)
        .on('setOptions', methods.setBoundsOptions)
        .on('requestParams', methods.constructBoundsParams);

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
