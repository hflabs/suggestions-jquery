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