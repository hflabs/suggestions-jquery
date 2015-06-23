    (function(){

        var methods = {

            enrichSuggestion: function (suggestion, selectionOptions) {
                var that = this,
                    token = $.trim(that.options.token),
                    resolver = $.Deferred();

                if (!that.status.enrich || !that.type.enrichmentEnabled || !token || selectionOptions && selectionOptions.dontEnrich) {
                    return resolver.resolve(suggestion);
                }

                // if current suggestion is already enriched, use it
                if (suggestion.data && suggestion.data.qc != null) {
                    return resolver.resolve(suggestion);
                }

                that.disableDropdown();

                // Set `currentValue` to make `processResponse` to consider enrichment response valid
                that.currentValue = suggestion.value;

                // prevent request abortion during onBlur
                that.enrichPhase = that.getSuggestions(suggestion.value, { count: 1 }, { noCallbacks: true, useEnrichmentCache: true })
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

        $.extend(Suggestions.prototype, methods);

    }());