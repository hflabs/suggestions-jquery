import { collection_util } from "./utils/collection";
import { text_util } from "./utils/text";
import { object_util } from "./utils/object";

/**
 * Factory to create same parent checker function
 * @param preprocessFn called on each value before comparison
 * @returns {Function} same parent checker function
 */
function sameParentChecker(preprocessFn) {
    return function(suggestions) {
        if (suggestions.length === 0) {
            return false;
        }
        if (suggestions.length === 1) {
            return true;
        }

        var parentValue = preprocessFn(suggestions[0].value),
            aliens = suggestions.filter(function(suggestion) {
                return (
                    preprocessFn(suggestion.value).indexOf(parentValue) !== 0
                );
            });

        return aliens.length === 0;
    };
}

/**
 * Default same parent checker. Compares raw values.
 * @type {Function}
 */
var haveSameParent = sameParentChecker(function(val) {
    return val;
});

/**
 * Сравнивает запрос c подсказками, по словам.
 * Срабатывает, только если у всех подсказок общий родитель
 * (функция сверки передаётся параметром).
 * Игнорирует стоп-слова.
 * Возвращает индекс единственной подходящей подсказки
 * или -1, если подходящих нет или несколько.
 */
function _matchByWords(stopwords, parentCheckerFn) {
    return function(query, suggestions) {
        var queryTokens;
        var matches = [];

        if (parentCheckerFn(suggestions)) {
            queryTokens = text_util.splitTokens(
                text_util.split(query, stopwords)
            );

            collection_util.each(suggestions, function(suggestion, i) {
                var suggestedValue = suggestion.value;

                if (text_util.stringEncloses(query, suggestedValue)) {
                    return false;
                }

                // check if query words are a subset of suggested words
                var suggestionWords = text_util.splitTokens(
                    text_util.split(suggestedValue, stopwords)
                );

                if (
                    collection_util.minus(queryTokens, suggestionWords)
                        .length === 0
                ) {
                    matches.push(i);
                }
            });
        }

        return matches.length === 1 ? matches[0] : -1;
    };
}

/**
 * Matchers return index of suitable suggestion
 * Context inside is optionally set in types.js
 */
var matchers = {
    /**
     * Matches query against suggestions, removing all the stopwords.
     */
    matchByNormalizedQuery: function(stopwords) {
        return function(query, suggestions) {
            var normalizedQuery = text_util.normalize(query, stopwords);
            var matches = [];

            collection_util.each(suggestions, function(suggestion, i) {
                var suggestedValue = suggestion.value.toLowerCase();
                // if query encloses suggestion, than it has already been selected
                // so we should not select it anymore
                if (text_util.stringEncloses(query, suggestedValue)) {
                    return false;
                }
                // if there is suggestion that contains query as its part
                // than we should ignore all other matches, even full ones
                if (suggestedValue.indexOf(normalizedQuery) > 0) {
                    return false;
                }
                if (
                    normalizedQuery ===
                    text_util.normalize(suggestedValue, stopwords)
                ) {
                    matches.push(i);
                }
            });

            return matches.length === 1 ? matches[0] : -1;
        };
    },

    matchByWords: function(stopwords) {
        return _matchByWords(stopwords, haveSameParent);
    },

    matchByWordsAddress: function(stopwords) {
        return _matchByWords(stopwords, haveSameParent);
    },

    /**
     * Matches query against values contained in suggestion fields
     * for cases, when there is only one suggestion
     * only considers fields specified in fields map
     * uses partial matching:
     *   "0445" vs { value: "ALFA-BANK", data: { "bic": "044525593" }} is a match
     */
    matchByFields: function(fields) {
        return function(query, suggestions) {
            var tokens = text_util.splitTokens(text_util.split(query));
            var suggestionWords = [];

            if (suggestions.length === 1) {
                if (fields) {
                    collection_util.each(fields, function(stopwords, field) {
                        var fieldValue = object_util.getDeepValue(
                            suggestions[0],
                            field
                        );
                        var fieldWords =
                            fieldValue &&
                            text_util.splitTokens(
                                text_util.split(fieldValue, stopwords)
                            );

                        if (fieldWords && fieldWords.length) {
                            suggestionWords = suggestionWords.concat(
                                fieldWords
                            );
                        }
                    });
                }

                if (
                    collection_util.minusWithPartialMatching(
                        tokens,
                        suggestionWords
                    ).length === 0
                ) {
                    return 0;
                }
            }

            return -1;
        };
    }
};

export { matchers };
