    (function(){

        var enrichServices = {
            'default': {
                enrichSuggestion: function (suggestion) {
                    return $.Deferred().resolve(suggestion);
                }
            },
            'dadata': (function () {
                return {
                    enrichSuggestion: function (suggestion) {
                        var that = this,
                            resolver = $.Deferred();

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
                    }
                }
            }())
        };

        var methods = {
            selectEnrichService: function () {
                var that = this,
                    type = types[that.options.type],
                    token = $.trim(that.options.token);

                if (that.options.useDadata && type && type.enrichmentEnabled && token) {
                    that.enrichService = enrichServices['dadata'];
                } else {
                    that.enrichService = enrichServices['default'];
                }
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

        notificator
            .on('setOptions', methods.selectEnrichService);

    }());