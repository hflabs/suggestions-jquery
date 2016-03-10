    (function () {

        /**
         * Type is a bundle of properties:
         * - urlSuffix Mandatory. String
         * - matchers Mandatory. Array of functions (with optional data bound as a context) that find appropriate suggestion to select
         * - `fieldNames` Map fields of suggestion.data to their displayable names
         * - `unformattableTokens` Array of strings which should not be highlighted
         * - `boundsAvailable` Array of 'bound's can be set as `bounds` option. Order is important.
         * - `boundsFields` Map of fields of `suggestion.data` corresponding to each bound
         *
         * flags:
         * - `alwaysContinueSelecting` Forbids to hide dropdown after selecting
         * - `geoEnabled` Makes to detect client's location for passing it to all requests
         * - `enrichmentEnabled` Makes to send additional request when a suggestion is selected
         *
         * and methods:
         * - `isDataComplete` Checks if suggestion.data can be operated as full data of it's type
         * - `composeValue` returns string value based on suggestion.data
         * - `formatResult` returns html of a suggestion. Overrides default method
         * - `formatResultInn` returns html of suggestion.data.inn
         * - `isQueryRequestable` checks if query is appropriated for requesting server
         * - `formatSelected` returns string to be inserted in textbox
         */

        var ADDRESS_STOPWORDS = ['ао', 'аобл', 'дом', 'респ', 'а/я', 'аал', 'автодорога', 'аллея', 'арбан', 'аул', 'б-р', 'берег', 'бугор', 'вал', 'вл', 'волость', 'въезд', 'высел', 'г', 'городок', 'гск', 'д', 'двлд', 'днп', 'дор', 'дп', 'ж/д_будка', 'ж/д_казарм', 'ж/д_оп', 'ж/д_платф', 'ж/д_пост', 'ж/д_рзд', 'ж/д_ст', 'жилзона', 'жилрайон', 'жт', 'заезд', 'заимка', 'зона', 'к', 'казарма', 'канал', 'кв', 'кв-л', 'км', 'кольцо', 'комн', 'кордон', 'коса', 'кп', 'край', 'линия', 'лпх', 'м', 'массив', 'местность', 'мкр', 'мост', 'н/п', 'наб', 'нп', 'обл', 'округ', 'остров', 'оф', 'п', 'п/о', 'п/р', 'п/ст', 'парк', 'пгт', 'пер', 'переезд', 'пл', 'пл-ка', 'платф', 'погост', 'полустанок', 'починок', 'пр-кт', 'проезд', 'промзона', 'просек', 'просека', 'проселок', 'проток', 'протока', 'проулок', 'р-н', 'рзд', 'россия', 'рп', 'ряды', 'с', 'с/а', 'с/мо', 'с/о', 'с/п', 'с/с', 'сад', 'сквер', 'сл', 'снт', 'спуск', 'ст', 'ст-ца', 'стр', 'тер', 'тракт', 'туп', 'у', 'ул', 'уч-к', 'ф/х', 'ферма', 'х', 'ш', 'бульвар', 'владение', 'выселки', 'гаражно-строительный', 'город', 'деревня', 'домовладение', 'дорога', 'квартал', 'километр', 'комната', 'корпус', 'литер', 'леспромхоз', 'местечко', 'микрорайон', 'набережная', 'область', 'переулок', 'платформа', 'площадка', 'площадь', 'поселение', 'поселок', 'проспект', 'разъезд', 'район', 'республика', 'село', 'сельсовет', 'слобода', 'сооружение', 'станица', 'станция', 'строение', 'территория', 'тупик', 'улица', 'улус', 'участок', 'хутор', 'шоссе'];

        var rHasMatch = /<strong>/;

        var innPartsLengths = {
            'LEGAL': [2, 2, 5, 1],
            'INDIVIDUAL': [2, 2, 6, 2]
        };

        function valueStartsWith (suggestion, field) {
            var fieldValue = suggestion.data && suggestion.data[field];

            return fieldValue &&
                new RegExp('^' + utils.escapeRegExChars(fieldValue) + '([' + wordDelimiters + ']|$)','i')
                    .test(suggestion.value);
        }

        function chooseFormattedField (formattedMain, formattedAlt) {
            return rHasMatch.test(formattedAlt) && !rHasMatch.test(formattedMain)
                ? formattedAlt
                : formattedMain;
        }

        function formattedField (main, alt, currentValue, suggestion, options) {
            var that = this,
                formattedMain = that.highlightMatches(main, currentValue, suggestion, options),
                formattedAlt = that.highlightMatches(alt, currentValue, suggestion, options);

            return chooseFormattedField(formattedMain, formattedAlt);
        }

        types['NAME'] = {
            urlSuffix: 'fio',
            matchers: [matchers.matchByNormalizedQuery, matchers.matchByWords],
            // names for labels, describing which fields are displayed
            fieldNames: {
                surname: 'фамилия',
                name: 'имя',
                patronymic: 'отчество'
            },
            // try to suggest even if a suggestion has been selected manually
            alwaysContinueSelecting: true,
            isDataComplete: function (suggestion) {
                var that = this,
                    params = that.options.params,
                    data = suggestion.data,
                    fields;

                if ($.isFunction(params)) {
                    params = params.call(that.element, suggestion.value);
                }
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
            }
        };

        types['ADDRESS'] = {
            urlSuffix: 'address',
            matchers: [
                $.proxy(matchers.matchByNormalizedQuery, { stopwords: ADDRESS_STOPWORDS }),
                $.proxy(matchers.matchByWordsAddress, { stopwords: ADDRESS_STOPWORDS })
            ],
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
            unformattableTokens: ADDRESS_STOPWORDS,
            enrichmentEnabled: true,
            geoEnabled: true,
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
            }
        };

        types['PARTY'] = {
            urlSuffix: 'party',
            matchers: [
                $.proxy(matchers.matchByFields, {
                    // These fields of suggestion's `data` used by by-words matcher
                    fieldsStopwords: {
                        'value': null,
                        'data.address.value': ADDRESS_STOPWORDS,
                        'data.inn': null
                    }
                })
            ],
            geoEnabled: true,
            formatResult: function (value, currentValue, suggestion, options) {
                var that = this,
                    formattedInn = that.type.formatResultInn.call(that, suggestion, currentValue),
                    formatterOGRN = that.highlightMatches(utils.getDeepValue(suggestion.data, 'ogrn'), currentValue, suggestion),
                    formattedInnOGRN = chooseFormattedField(formattedInn, formatterOGRN),
                    formattedFIO = that.highlightMatches(utils.getDeepValue(suggestion.data, 'management.name'), currentValue, suggestion),
                    address = utils.getDeepValue(suggestion.data, 'address.value') || '';

                if (that.isMobile) {
                    (options || (options = {})).maxLength = 50;
                }

                value = formattedField.call(that, value, utils.getDeepValue(suggestion.data, 'name.latin'), currentValue, suggestion, options);
                value = that.wrapFormattedValue(value, suggestion);

                if (address) {
                    address = address.replace(/^(\d{6}?\s+|Россия,\s+)/i, '');
                    if (that.isMobile) {
                        // keep only two first words
                        address = address.replace(new RegExp('^([^' + wordDelimiters + ']+[' + wordDelimiters + ']+[^' + wordDelimiters + ']+).*'), '$1');
                    } else {
                        address = that.highlightMatches(address, currentValue, suggestion, {
                            unformattableTokens: ADDRESS_STOPWORDS
                        });
                    }
                }

                if (formattedInnOGRN || address || formattedFIO) {
                    value +=
                        '<div class="' + that.classes.subtext + '">' +
                        '<span class="' + that.classes.subtext_inline + '">' + (formattedInnOGRN || '') + '</span>' +
                        (chooseFormattedField(address, formattedFIO) || '') +
                        '</div>';
                }
                return value;
            },
            formatResultInn: function(suggestion, currentValue) {
                var that = this,
                    inn = suggestion.data && suggestion.data.inn,
                    innPartsLength = innPartsLengths[suggestion.data && suggestion.data.type],
                    innParts,
                    formattedInn,
                    rDigit = /\d/;

                if (inn) {
                    formattedInn = that.highlightMatches(inn, currentValue, suggestion);
                    if (innPartsLength) {
                        formattedInn = formattedInn.split('');
                        innParts = $.map(innPartsLength, function (partLength) {
                            var formattedPart = '',
                                ch;

                            while (partLength && (ch = formattedInn.shift())) {
                                formattedPart += ch;
                                if (rDigit.test(ch)) partLength--;
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
            isQueryRequestable: function (query) {
                return this.options.suggest_local || query.indexOf('@') >= 0;
            }
        };

        types['BANK'] = {
            urlSuffix: 'bank',
            matchers: [matchers.matchByWords],
            formatResult: function (value, currentValue, suggestion, options) {
                var that = this,
                    formattedBIC = that.highlightMatches(utils.getDeepValue(suggestion.data, 'bic'), currentValue, suggestion),
                    address = utils.getDeepValue(suggestion.data, 'address.value') || '';

                value = that.highlightMatches(value, currentValue, suggestion, options);
                value = that.wrapFormattedValue(value, suggestion);

                if (address) {
                    address = address.replace(/^\d{6}( РОССИЯ)?, /i, '');
                    if (that.isMobile) {
                        // keep only two first words
                        address = address.replace(new RegExp('^([^' + wordDelimiters + ']+[' + wordDelimiters + ']+[^' + wordDelimiters + ']+).*'), '$1');
                    } else {
                        address = that.highlightMatches(address, currentValue, suggestion, {
                            unformattableTokens: ADDRESS_STOPWORDS
                        });
                    }
                }

                if (formattedBIC || address) {
                    value +=
                        '<div class="' + that.classes.subtext + '">' +
                        '<span class="' + that.classes.subtext_inline + '">' + formattedBIC + '</span>' +
                        address +
                        '</div>';
                }
                return value;
            },
            formatSelected: function (suggestion) {
                return utils.getDeepValue(suggestion, 'data.name.payment');
            }
        };

        $.extend(defaultOptions, {
            suggest_local: true
        });

    }());
