import $ from "jquery";

import { Suggestions } from "./suggestions";

var methods = {
    enrichSuggestion: function(suggestion, selectionOptions) {
        var that = this,
            resolver = $.Deferred();

        if (
            !that.options.enrichmentEnabled ||
            !that.type.enrichmentEnabled ||
            !that.requestMode.enrichmentEnabled ||
            (selectionOptions && selectionOptions.dontEnrich)
        ) {
            return resolver.resolve(suggestion);
        }

        // if current suggestion is already enriched, use it
        if (suggestion.data && suggestion.data.qc != null) {
            return resolver.resolve(suggestion);
        }

        that.disableDropdown();

        var query = that.type.getEnrichmentQuery(suggestion);
        var customParams = that.type.enrichmentParams;
        var requestOptions = {
            noCallbacks: true,
            useEnrichmentCache: true,
            method: that.type.enrichmentMethod
        };

        // Set `currentValue` to make `processResponse` to consider enrichment response valid
        that.currentValue = query;

        // prevent request abortion during onBlur
        that.enrichPhase = that
            .getSuggestions(query, customParams, requestOptions)
            .always(function() {
                that.enableDropdown();
            })
            .done(function(suggestions) {
                var enrichedSuggestion = suggestions && suggestions[0];

                resolver.resolve(
                    enrichedSuggestion || suggestion,
                    !!enrichedSuggestion
                );
            })
            .fail(function() {
                resolver.resolve(suggestion);
            });

        return resolver;
    },

    /**
     * Injects enriched suggestion into response
     * @param response
     * @param query
     */
    enrichResponse: function(response, query) {
        var that = this,
            enrichedSuggestion = that.enrichmentCache[query];

        if (enrichedSuggestion) {
            $.each(response.suggestions, function(i, suggestion) {
                if (suggestion.value === query) {
                    response.suggestions[i] = enrichedSuggestion;
                    return false;
                }
            });
        }
    }
};

$.extend(Suggestions.prototype, methods);
