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
                }
            }())
        };

        var methods = {
            selectEnrichService: function () {
                var that = this,
                    type = that.options.type,
                    token = $.trim(that.options.token);

                if (that.options.useDadata && type && types[type] && token) {
                    that.enrichService = enrichServices['dadata'];
                } else {
                    that.enrichService = enrichServices['default'];
                }
            }
        };

        // for backward compatibility
        Suggestions.dadataConfig = {};

        setOptionsHooks.push(methods.selectEnrichService);

    }());