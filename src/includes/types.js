import $ from 'jquery';

import { utils } from './utils';
import { matchers } from './matchers';
import { DEFAULT_OPTIONS } from './default-options';

import { WORD_DELIMITERS } from './constants';

/**
 * Type is a bundle of properties:
 * - urlSuffix Mandatory. String
 * - matchers Mandatory. Array of functions (with optional data bound as a context) that find appropriate suggestion to select
 * - `fieldNames` Map fields of suggestion.data to their displayable names
 * - `unformattableTokens` Array of strings which should not be highlighted
 * - `dataComponents` Array of 'bound's can be set as `bounds` option. Order is important.
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

/**
 * Компоненты адреса
 * @type {*[]}
 * id {String} Наименование типа
 * fields {Array of Strings}
 * forBounds {Boolean} может использоваться в ограничениях
 * forLocations {Boolean}
 * kladrFormat {Object}
 * fiasType {String} Наименование соответствующего ФИАС типа
 */
var ADDRESS_COMPONENTS = [
    {
        id: 'kladr_id',
        fields: ['kladr_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'postal_code',
        fields: ['postal_code'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'country',
        fields: ['country'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'region_fias_id',
        fields: ['region_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'region_type_full',
        fields: ['region_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: 'region_fias_id'
    },
    {
        id: 'region',
        fields: ['region', 'region_type', 'region_type_full', 'region_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: 'region_fias_id'
    },
    {
        id: 'area_fias_id',
        fields: ['area_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'area_type_full',
        fields: ['area_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: 'area_fias_id'
    },
    {
        id: 'area',
        fields: ['area', 'area_type', 'area_type_full', 'area_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: 'area_fias_id'
    },
    {
        id: 'city_fias_id',
        fields: ['city_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'city_type_full',
        fields: ['city_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: 'city_fias_id'
    },
    {
        id: 'city',
        fields: ['city', 'city_type', 'city_type_full', 'city_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: 'city_fias_id'
    },
    {
        id: 'city_district_fias_id',
        fields: ['city_district_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'city_district_type_full',
        fields: ['city_district_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: 'city_district_fias_id'
    },
    {
        id: 'city_district',
        fields: ['city_district', 'city_district_type', 'city_district_type_full', 'city_district_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: 'city_district_fias_id'
    },
    {
        id: 'settlement_fias_id',
        fields: ['settlement_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'settlement_type_full',
        fields: ['settlement_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: 'settlement_fias_id'
    },
    {
        id: 'settlement',
        fields: ['settlement', 'settlement_type', 'settlement_type_full', 'settlement_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: 'settlement_fias_id'
    },
    {
        id: 'street_fias_id',
        fields: ['street_fias_id'],
        forBounds: false,
        forLocations: true
    },
    {
        id: 'street_type_full',
        fields: ['street_type_full'],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: 'street_fias_id'
    },
    {
        id: 'street',
        fields: ['street', 'street_type', 'street_type_full', 'street_with_type'],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: 'street_fias_id'
    },
    {
        id: 'house',
        fields: ['house', 'house_type', 'house_type_full',
            'block', 'block_type'],
        forBounds: true,
        forLocations: false,
        kladrFormat: { digits: 19 }
    }

];

var rHasMatch = /<strong>/;

var innPartsLengths = {
    'LEGAL': [2, 2, 5, 1],
    'INDIVIDUAL': [2, 2, 6, 2]
};

function valueStartsWith (suggestion, field) {
    var fieldValue = suggestion.data && suggestion.data[field];

    return fieldValue &&
        new RegExp('^' + utils.escapeRegExChars(fieldValue) + '([' + WORD_DELIMITERS + ']|$)','i')
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

var types = {};

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
    dataComponents: ADDRESS_COMPONENTS,
    dataComponentsById: utils.indexBy(ADDRESS_COMPONENTS, 'id', 'index'),
    unformattableTokens: ADDRESS_STOPWORDS,
    enrichmentEnabled: true,
    geoEnabled: true,
    isDataComplete: function (suggestion) {
        var fields = [this.bounds.to || 'flat'],
            data = suggestion.data;

        return !$.isPlainObject(data) || utils.fieldsNotEmpty(data, fields);
    },
    composeValue: function (data, options) {
        var region = data.region_with_type || utils.compact([data.region, data.region_type]).join(' ') || data.region_type_full,
            area = data.area_with_type || utils.compact([data.area_type, data.area]).join(' ') || data.area_type_full,
            city = data.city_with_type || utils.compact([data.city_type, data.city]).join(' ') || data.city_type_full,
            settelement = data.settlement_with_type || utils.compact([data.settlement_type, data.settlement]).join(' ') || data.settlement_type_full,
            cityDistrict = data.city_district_with_type || utils.compact([data.city_district_type, data.city_district]).join(' ') || data.city_district_type_full,
            street = data.street_with_type || utils.compact([data.street_type, data.street]).join(' ') || data.street_type_full,
            house = utils.compact([data.house_type, data.house, data.block_type, data.block]).join(' '),
            flat = utils.compact([data.flat_type, data.flat]).join(' '),
            postal_box = data.postal_box && ('а/я ' + data.postal_box),
            result;

        // если регион совпадает с городом
        // например г Москва, г Москва
        // то не показываем регион
        if (region === city) {
            region = '';
        }

        // иногда не показываем район
        if (!(options && options.saveCityDistrict)) {
            if (options && options.excludeCityDistrict) {
                // если район явно запрещен
                cityDistrict = '';
            } else if (cityDistrict && !data.city_district_fias_id) {
                // если район взят из ОКАТО (у него пустой city_district_fias_id)
                cityDistrict = '';
            }
        }

        result = utils.compact([
            region,
            area,
            city,
            cityDistrict,
            settelement,
            street,
            house,
            flat,
            postal_box
        ]).join(', ');

        return result;
    },
    formatResult: function() {
        var componentsUnderCityDistrict = [],
            _underCityDistrict = false;

        $.each(ADDRESS_COMPONENTS, function () {
            if (_underCityDistrict) componentsUnderCityDistrict.push(this.id);
            if (this.id === 'city_district') _underCityDistrict = true;
        });

        return function (value, currentValue, suggestion, options) {
            var that = this,
                district = suggestion.data && suggestion.data.city_district_with_type;

            value = that.highlightMatches(value, currentValue, suggestion, options);
            value = that.wrapFormattedValue(value, suggestion);

            if (district && (!that.bounds.own.length || that.bounds.own.indexOf('street') >= 0)
                && !$.isEmptyObject(that.copyDataComponents(suggestion.data, componentsUnderCityDistrict))) {
                value +=
                    '<div class="' + that.classes.subtext + '">' +
                    that.highlightMatches(district, currentValue, suggestion) +
                    '</div>';
            }

            return value;
        };
    }(),
    /**
     * @param instance
     * @param options
     * @param options.suggestion
     * @param options.hasSameValues
     * @param options.hasBeenEnreached
     */
    getSuggestionValue: function(instance, options) {
        var formattedValue = null;

        if (options.hasSameValues) {
            if (instance.options.restrict_value) {
                // Can not use unrestricted address,
                // because some components (from constraints) must be omitted
                formattedValue = this.getValueWithinConstraints(instance, options.suggestion);
            } else if (instance.bounds.own.length) {
                // Can not use unrestricted address,
                // because only components from bounds must be included
                formattedValue = this.getValueWithinBounds(instance, options.suggestion);
            } else {
                // Can use full unrestricted address
                formattedValue = options.suggestion.unrestricted_value;
            }
        } else if (options.hasBeenEnriched) {
            if (instance.options.restrict_value) {
                formattedValue = this.getValueWithinConstraints(instance, options.suggestion, { excludeCityDistrict: true });
            }
        }

        return formattedValue;
    },
    /*
     * Compose suggestion value with respect to constraints
     */
    getValueWithinConstraints: function (instance, suggestion, options) {
        return this.composeValue(instance.getUnrestrictedData(suggestion.data), options);
    },
    /*
     * Compose suggestion value with respect to bounds
     */
    getValueWithinBounds: function (instance, suggestion, options) {
        // для корректного составления адреса нужен city_district_fias_id
        var data = instance.copyDataComponents(suggestion.data, instance.bounds.own.concat(['city_district_fias_id']));

        return this.composeValue(data, options);
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
                'data.inn': null,
                'data.ogrn': null
            }
        })
    ],
    dataComponents: ADDRESS_COMPONENTS,
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
                address = address.replace(new RegExp('^([^' + WORD_DELIMITERS + ']+[' + WORD_DELIMITERS + ']+[^' + WORD_DELIMITERS + ']+).*'), '$1');
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
    matchers: [$.proxy(matchers.matchByFields, {
        // These fields of suggestion's `data` used by by-words matcher
        fieldsStopwords: {
            'value': null,
            'data.bic': null,
            'data.swift': null
        }
    })],
    dataComponents: ADDRESS_COMPONENTS,
    geoEnabled: true,
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
                address = address.replace(new RegExp('^([^' + WORD_DELIMITERS + ']+[' + WORD_DELIMITERS + ']+[^' + WORD_DELIMITERS + ']+).*'), '$1');
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

$.extend(DEFAULT_OPTIONS, {
    suggest_local: true
});

export { types };
