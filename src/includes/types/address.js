import { lang_util } from '../utils/lang';
import { collection_util } from '../utils/collection';
import { text_util } from '../utils/text';
import { object_util } from '../utils/object';
import { jqapi } from '../jqapi';
import { matchers } from '../matchers';

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

var ADDRESS_TYPE = {
    urlSuffix: 'address',
    noSuggestionsHint: 'Неизвестный адрес',
    matchers: [
        matchers.matchByNormalizedQuery(ADDRESS_STOPWORDS),
        matchers.matchByWordsAddress(ADDRESS_STOPWORDS)
    ],
    dataComponents: ADDRESS_COMPONENTS,
    dataComponentsById: object_util.indexObjectsById(ADDRESS_COMPONENTS, 'id', 'index'),
    unformattableTokens: ADDRESS_STOPWORDS,
    enrichmentEnabled: true,
    enrichmentMethod: 'suggest',
    enrichmentParams: {
        count: 1,
        locations: null,
        locations_boost: null,
        from_bound: null,
        to_bound: null
    },
    getEnrichmentQuery: function(suggestion) {
        return suggestion.unrestricted_value;
    },
    geoEnabled: true,
    isDataComplete: function (suggestion) {
        var fields = [this.bounds.to || 'flat'],
            data = suggestion.data;

        return !lang_util.isPlainObject(data) || object_util.fieldsAreNotEmpty(data, fields);
    },
    composeValue: function (data, options) {
        var region = data.region_with_type || collection_util.compact([data.region, data.region_type]).join(' ') || data.region_type_full,
            area = data.area_with_type || collection_util.compact([data.area_type, data.area]).join(' ') || data.area_type_full,
            city = data.city_with_type || collection_util.compact([data.city_type, data.city]).join(' ') || data.city_type_full,
            settelement = data.settlement_with_type || collection_util.compact([data.settlement_type, data.settlement]).join(' ') || data.settlement_type_full,
            cityDistrict = data.city_district_with_type || collection_util.compact([data.city_district_type, data.city_district]).join(' ') || data.city_district_type_full,
            street = data.street_with_type || collection_util.compact([data.street_type, data.street]).join(' ') || data.street_type_full,
            house = collection_util.compact([data.house_type, data.house, data.block_type, data.block]).join(' '),
            flat = collection_util.compact([data.flat_type, data.flat]).join(' '),
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

        result = collection_util.compact([
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

        ADDRESS_COMPONENTS.forEach(function (component) {
            if (_underCityDistrict) componentsUnderCityDistrict.push(component.id);
            if (component.id === 'city_district') _underCityDistrict = true;
        });

        return function (value, currentValue, suggestion, options) {
            var that = this,
                district = suggestion.data && suggestion.data.city_district_with_type,
                unformattableTokens = options && options.unformattableTokens,
                historyValues = suggestion.data && suggestion.data.history_values,
                tokens,
                unusedTokens,
                formattedHistoryValues;

            // добавляем исторические значения
            if (historyValues && historyValues.length > 0) {
                tokens = text_util.tokenize(currentValue, unformattableTokens);
                unusedTokens = this.type.findUnusedTokens(tokens, value);
                formattedHistoryValues = this.type.getFormattedHistoryValues(unusedTokens, historyValues);
                if (formattedHistoryValues) {
                    value += formattedHistoryValues;
                }
            }

            value = that.highlightMatches(value, currentValue, suggestion, options);
            value = that.wrapFormattedValue(value, suggestion);

            if (district && (!that.bounds.own.length || that.bounds.own.indexOf('street') >= 0)
                && !lang_util.isEmptyObject(that.copyDataComponents(suggestion.data, componentsUnderCityDistrict))) {
                value +=
                    '<div class="' + that.classes.subtext + '">' +
                    that.highlightMatches(district, currentValue, suggestion) +
                    '</div>';
            }

            return value;
        };
    }(),

    /**
     * Возвращает список слов в запросе,
     * которые не встречаются в подсказке
     */
    findUnusedTokens: function(tokens, value) {
        var tokenIndex,
            token,
            unused = [];

        unused = tokens.filter(function(token) {
            return value.indexOf(token) === -1;
        });

        return unused;
    },

    /**
     * Возвращает исторические названия для слов запроса, 
     * для которых не найдено совпадения в основном значении подсказки
     */
    getFormattedHistoryValues: function(unusedTokens, historyValues) {
        var tokenIndex,
            token,
            historyValueIndex,
            historyValue,
            values = [],
            formatted = '';

        historyValues.forEach(function(historyValue) {
            collection_util.each(unusedTokens, function(token) {
                if (historyValue.toLowerCase().indexOf(token) >= 0) {
                    values.push(historyValue);
                    return false;
                }
            })
        });

        if (values.length > 0) {
            formatted = ' (бывш. ' + values.join(', ') + ')';
        }

        return formatted;
    },

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

export { ADDRESS_STOPWORDS, ADDRESS_COMPONENTS, ADDRESS_TYPE };