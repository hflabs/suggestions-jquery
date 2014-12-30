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