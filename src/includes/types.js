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