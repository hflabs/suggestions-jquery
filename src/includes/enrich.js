    (function(){

        var QC_VALUES = {
            CORRECT: 0,
            INCORRECT: 1
        };

        function suggestionIsEnriched(suggestion) {
            return suggestion && suggestion.data && suggestion.data.qc === QC_VALUES.CORRECT;
        }

        var methods = {

            enrichSuggestion: function (suggestion, selectionOptions) {
                var that = this,
                    token = $.trim(that.options.token),
                    resolver = $.Deferred();

                if (!that.options.useDadata || !token || that.type.dontEnrich  || selectionOptions && selectionOptions.dontEnrich) {
                    return resolver.resolve(suggestion);
                }

                // if current suggestion is already enriched, use it
                if (suggestion.data && suggestion.data.qc != null) {
                    return resolver.resolve(suggestion);
                }

                that.disableDropdown();
                that.currentValue = suggestion.value;

                // prevent request abortation during onBlur
                that.currentRequestIsEnrich = true;
                that.getSuggestions(suggestion.value, { count: 1 }, { noCallbacks: true })
                    .always(function () {
                        that.enableDropdown();
                    })
                    .done(function (suggestions) {
                        var serverSuggestion = suggestions[0];
                        if (suggestionIsEnriched(serverSuggestion)) {
                            // return suggestion from dadata
                            resolver.resolve(serverSuggestion);
                        } else {
                            // dadata is turned off on the server, ignore response
                            // and use suggestion selected by the user
                            resolver.resolve(suggestion);
                        }
                    })
                    .fail(function () {
                        resolver.resolve(suggestion);
                    });
                return resolver;
            }

        };

        $.extend(defaultOptions, {
            useDadata: true
        });

        $.extend(Suggestions.prototype, methods);

    }());