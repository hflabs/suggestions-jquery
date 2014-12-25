    (function(){

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
                        resolver.resolve(suggestions && suggestions[0] || suggestion);
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