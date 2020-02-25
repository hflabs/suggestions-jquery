import { lang_util } from "../utils/lang";
import { collection_util } from "../utils/collection";
import { object_util } from "../utils/object";
import { matchers } from "../matchers";
import { ADDRESS_STOPWORDS, ADDRESS_TYPE } from "./address";

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
var FIAS_COMPONENTS = [
    {
        id: "kladr_id",
        fields: ["kladr_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_fias_id",
        fields: ["region_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_type_full",
        fields: ["region_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "region",
        fields: [
            "region",
            "region_type",
            "region_type_full",
            "region_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "area_fias_id",
        fields: ["area_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "area_type_full",
        fields: ["area_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "area",
        fields: ["area", "area_type", "area_type_full", "area_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "city_fias_id",
        fields: ["city_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_type_full",
        fields: ["city_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city",
        fields: ["city", "city_type", "city_type_full", "city_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city_district_fias_id",
        fields: ["city_district_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_district_type_full",
        fields: ["city_district_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "city_district",
        fields: [
            "city_district",
            "city_district_type",
            "city_district_type_full",
            "city_district_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "settlement_fias_id",
        fields: ["settlement_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "settlement_type_full",
        fields: ["settlement_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "settlement",
        fields: [
            "settlement",
            "settlement_type",
            "settlement_type_full",
            "settlement_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "planning_structure_fias_id",
        fields: ["planning_structure_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "planning_structure_type_full",
        fields: ["planning_structure_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "planning_structure_fias_id"
    },
    {
        id: "planning_structure",
        fields: [
            "planning_structure",
            "planning_structure_type",
            "planning_structure_type_full",
            "planning_structure_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "planning_structure_fias_id"
    },
    {
        id: "street_fias_id",
        fields: ["street_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "street_type_full",
        fields: ["street_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "street",
        fields: [
            "street",
            "street_type",
            "street_type_full",
            "street_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "house",
        fields: ["house", "house_type", "block", "building_type", "building"],
        forBounds: true,
        forLocations: false,
        kladrFormat: { digits: 19 }
    }
];

var FIAS_TYPE = {
    urlSuffix: "fias",
    noSuggestionsHint: "Неизвестный адрес",
    matchers: [
        matchers.matchByNormalizedQuery(ADDRESS_STOPWORDS),
        matchers.matchByWordsAddress(ADDRESS_STOPWORDS)
    ],
    dataComponents: FIAS_COMPONENTS,
    dataComponentsById: object_util.indexObjectsById(
        FIAS_COMPONENTS,
        "id",
        "index"
    ),
    unformattableTokens: ADDRESS_STOPWORDS,
    isDataComplete: function(suggestion) {
        var fields = [this.bounds.to || "house"],
            data = suggestion.data;

        return (
            !lang_util.isPlainObject(data) ||
            object_util.fieldsAreNotEmpty(data, fields)
        );
    },
    composeValue: function(data, options) {
        var country = data.country,
            region =
                data.region_with_type ||
                collection_util
                    .compact([data.region, data.region_type])
                    .join(" ") ||
                data.region_type_full,
            area =
                data.area_with_type ||
                collection_util
                    .compact([data.area_type, data.area])
                    .join(" ") ||
                data.area_type_full,
            city =
                data.city_with_type ||
                collection_util
                    .compact([data.city_type, data.city])
                    .join(" ") ||
                data.city_type_full,
            settelement =
                data.settlement_with_type ||
                collection_util
                    .compact([data.settlement_type, data.settlement])
                    .join(" ") ||
                data.settlement_type_full,
            cityDistrict =
                data.city_district_with_type ||
                collection_util
                    .compact([data.city_district_type, data.city_district])
                    .join(" ") ||
                data.city_district_type_full,
            planning_structure =
                data.planning_structure_with_type ||
                collection_util
                    .compact([
                        data.planning_structure_type,
                        data.planning_structure
                    ])
                    .join(" ") ||
                data.planning_structure_type_full,
            street =
                data.street_with_type ||
                collection_util
                    .compact([data.street_type, data.street])
                    .join(" ") ||
                data.street_type_full,
            house = collection_util
                .compact([
                    data.house_type,
                    data.house,
                    data.block_type,
                    data.block
                ])
                .join(" "),
            flat = collection_util
                .compact([data.flat_type, data.flat])
                .join(" "),
            postal_box = data.postal_box && "а/я " + data.postal_box,
            result;

        // если регион совпадает с городом
        // например г Москва, г Москва
        // то не показываем регион
        if (region === city) {
            region = "";
        }

        // иногда не показываем район
        if (!(options && options.saveCityDistrict)) {
            if (options && options.excludeCityDistrict) {
                // если район явно запрещен
                cityDistrict = "";
            } else if (cityDistrict && !data.city_district_fias_id) {
                // если район взят из ОКАТО (у него пустой city_district_fias_id)
                cityDistrict = "";
            }
        }

        result = collection_util
            .compact([
                country,
                region,
                area,
                city,
                cityDistrict,
                settelement,
                planning_structure,
                street,
                house,
                flat,
                postal_box
            ])
            .join(", ");

        return result;
    },
    formatResult: (function() {
        return function(value, currentValue, suggestion, options) {
            var that = this;

            value = that.highlightMatches(
                value,
                currentValue,
                suggestion,
                options
            );
            value = that.wrapFormattedValue(value, suggestion);
            return value;
        };
    })(),

    getSuggestionValue: ADDRESS_TYPE.getSuggestionValue,
    getValueWithinConstraints: ADDRESS_TYPE.getValueWithinConstraints,
    getValueWithinBounds: ADDRESS_TYPE.getValueWithinBounds
};

export { FIAS_COMPONENTS, FIAS_TYPE };
