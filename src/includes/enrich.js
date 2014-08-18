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

                        function suggestionIsDefined(suggestion) {
                            return suggestion && suggestion.data
                                && suggestion.data.hasOwnProperty('qc')
                                && suggestion.data.qc !== null;
                        }

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
                                var serverSuggestion = suggestions[0];
                                if (suggestionIsDefined(serverSuggestion)) {
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
                }
            }())
        };

        var methods = {
            selectEnrichService: function () {
                var that = this,
                    type = that.options.type,
                    token = $.trim(that.options.token);

                if (that.options.useDadata && type && types[type] && token) {
                    that.enrichService = enrichServices[types[type].enrichServiceName || 'dadata'];
                } else {
                    that.enrichService = enrichServices['default'];
                }
            }
        };

        setOptionsHooks.push(methods.selectEnrichService);

    }());