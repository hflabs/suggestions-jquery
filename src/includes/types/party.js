import { WORD_DELIMITERS } from "../constants";
import { object_util } from "../utils/object";
import { jqapi } from "../jqapi";
import { matchers } from "../matchers";
import { ADDRESS_STOPWORDS, ADDRESS_COMPONENTS } from "./address";

var innPartsLengths = {
    LEGAL: [2, 2, 5, 1],
    INDIVIDUAL: [2, 2, 6, 2]
};

function chooseFormattedField(formattedMain, formattedAlt) {
    var rHasMatch = /<strong>/;
    return rHasMatch.test(formattedAlt) && !rHasMatch.test(formattedMain)
        ? formattedAlt
        : formattedMain;
}

function formattedField(main, alt, currentValue, suggestion, options) {
    var that = this,
        formattedMain = that.highlightMatches(
            main,
            currentValue,
            suggestion,
            options
        ),
        formattedAlt = that.highlightMatches(
            alt,
            currentValue,
            suggestion,
            options
        );

    return chooseFormattedField(formattedMain, formattedAlt);
}

var PARTY_TYPE = {
    urlSuffix: "party",
    noSuggestionsHint: "Неизвестная организация",
    matchers: [
        matchers.matchByFields(
            // These fields of suggestion's `data` used by by-words matcher
            {
                value: null,
                "data.address.value": ADDRESS_STOPWORDS,
                "data.inn": null,
                "data.ogrn": null
            }
        )
    ],
    dataComponents: ADDRESS_COMPONENTS,
    enrichmentEnabled: true,
    enrichmentMethod: "findById",
    enrichmentParams: {
        count: 1,
        locations_boost: null
    },
    getEnrichmentQuery: function(suggestion) {
        return suggestion.data.hid;
    },
    geoEnabled: true,
    formatResult: function(value, currentValue, suggestion, options) {
        var that = this,
            formattedInn = that.type.formatResultInn.call(
                that,
                suggestion,
                currentValue
            ),
            formatterOGRN = that.highlightMatches(
                object_util.getDeepValue(suggestion.data, "ogrn"),
                currentValue,
                suggestion
            ),
            formattedInnOGRN = chooseFormattedField(
                formattedInn,
                formatterOGRN
            ),
            formattedFIO = that.highlightMatches(
                object_util.getDeepValue(suggestion.data, "management.name"),
                currentValue,
                suggestion
            ),
            address =
                object_util.getDeepValue(suggestion.data, "address.value") ||
                "";

        if (that.isMobile) {
            (options || (options = {})).maxLength = 50;
        }

        value = formattedField.call(
            that,
            value,
            object_util.getDeepValue(suggestion.data, "name.latin"),
            currentValue,
            suggestion,
            options
        );
        value = that.wrapFormattedValue(value, suggestion);

        if (address) {
            address = address.replace(/^(\d{6}|Россия),\s+/i, "");
            if (that.isMobile) {
                // keep only two first words
                address = address.replace(
                    new RegExp(
                        "^([^" +
                            WORD_DELIMITERS +
                            "]+[" +
                            WORD_DELIMITERS +
                            "]+[^" +
                            WORD_DELIMITERS +
                            "]+).*"
                    ),
                    "$1"
                );
            } else {
                address = that.highlightMatches(
                    address,
                    currentValue,
                    suggestion,
                    {
                        unformattableTokens: ADDRESS_STOPWORDS
                    }
                );
            }
        }

        if (formattedInnOGRN || address || formattedFIO) {
            value +=
                '<div class="' +
                that.classes.subtext +
                '">' +
                '<span class="' +
                that.classes.subtext_inline +
                '">' +
                (formattedInnOGRN || "") +
                "</span>" +
                (chooseFormattedField(address, formattedFIO) || "") +
                "</div>";
        }
        return value;
    },
    formatResultInn: function(suggestion, currentValue) {
        var that = this,
            inn = suggestion.data && suggestion.data.inn,
            innPartsLength =
                innPartsLengths[suggestion.data && suggestion.data.type],
            innParts,
            formattedInn,
            rDigit = /\d/;

        if (inn) {
            formattedInn = that.highlightMatches(inn, currentValue, suggestion);
            if (innPartsLength) {
                formattedInn = formattedInn.split("");
                innParts = innPartsLength.map(function(partLength) {
                    var formattedPart = "",
                        ch;

                    while (partLength && (ch = formattedInn.shift())) {
                        formattedPart += ch;
                        if (rDigit.test(ch)) partLength--;
                    }

                    return formattedPart;
                });
                formattedInn =
                    innParts.join(
                        '<span class="' +
                            that.classes.subtext_delimiter +
                            '"></span>'
                    ) + formattedInn.join("");
            }

            return formattedInn;
        }
    }
};

export { PARTY_TYPE };
