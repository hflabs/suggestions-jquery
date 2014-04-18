    (function(){
        /**
         * Methods related to enrichment functionality
         */

        var dadataConfig = {
            url: 'https://dadata.ru/api/v1/clean',
            timeout: 1000
        };

        var enrichServices = {
            'default': {
                enrichSuggestion: function (suggestion) {
                    return $.Deferred().resolve(suggestion);
                },
                enrichResponse: function (response, query) {
                    return $.Deferred().resolve(response);
                }
            },
            'dadata': (function () {
                var fieldParsers = {};

                /**
                 * Values of `gender` from dadata.ru differ from ones in original suggestions
                 * @param value
                 * @returns {{gender: string}}
                 */
                fieldParsers.gender = function (value) {
                    return {
                        gender: value == 'М' ? 'MALE' :
                            value == 'Ж' ? 'FEMALE' : 'UNKNOWN'
                    }
                };

                /**
                 * Each of these fields in dadata's answer combines two fields of standard suggestion object
                 */
                $.each(['region', 'area', 'city', 'settlement', 'street'], function (i, field) {
                    function typeGoesFirst(addressPart) {
                        if (field === 'city' || field === 'settlement' || field === 'street') {
                            return true;
                        } else {
                            var typeRE = /^(г|Респ|тер|у)/i;
                            return typeRE.test(addressPart);
                        }
                    }

                    fieldParsers[field] = function (value) {
                        var addressPartType,
                            addressPartValue,
                            result = {};
                        if (value) {
                            var addressParts = value.split(' ');
                            if (typeGoesFirst(value)) {
                                addressPartType = addressParts.shift();
                            } else {
                                addressPartType = addressParts.pop();
                            }
                            addressPartValue = addressParts.join(' ');
                        } else {
                            addressPartType = null;
                            addressPartValue = value;
                        }
                        result[field + '_type'] = addressPartType;
                        result[field] = addressPartValue;
                        return result;
                    };
                });

                var valueComposer = {
                    'NAME': function (data) {
                        return utils.compact([data.surname, data.name, data.patronymic]).join(' ');
                    },
                    'ADDRESS': function (data) {
                        return utils.compact([data.region, data.area, data.city, data.settlement, data.street,
                            utils.compact([data.house_type, data.house]).join(' '),
                            utils.compact([data.block_type, data.block]).join(' '),
                            utils.compact([data.flat_type, data.flat]).join(' ')
                        ]).join(', ');
                    }
                };

                function startRequest(query) {
                    var that = this,
                        token = $.trim(that.options.token),
                        data = {
                            structure: [that.options.type],
                            data: [
                                [ query ]
                            ]
                        };

                    that.currentEnrichRequest = $.ajax(dadataConfig.url, {
                        type: 'POST',
                        headers: {
                            'Authorization': 'Token ' + token
                        },
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(data),
                        timeout: dadataConfig.timeout
                    }).always(function(){
                        that.currentEnrichRequest = null;
                    });
                    return that.currentEnrichRequest;
                }

                function shouldOverrideField(field, data) {
                    return !(field in data) || field === 'house';
                }

                return {
                    enrichSuggestion: function (suggestion) {
                        var that = this,
                            resolver = $.Deferred();

                        // if current suggestion is from dadata, use it
                        if (suggestion.data && 'qc' in suggestion.data) {
                            return resolver.resolve(suggestion);
                        }

                        that.showPreloader();
                        that.disableDropdown();
                        startRequest.call(that, suggestion.value)
                            .always(function () {
                                that.hidePreloader();
                                that.enableDropdown();
                            })
                            .done(function (resp) {
                                var data = resp.data,
                                    s = data && data[0] && data[0][0];

                                if (s) {
                                    if (!suggestion.data) {
                                        suggestion.data = {};
                                    }
                                    if (s.qc === 0) {
                                        // should enrich suggestion only if Dadata returned good qc
                                        delete s.source;
                                        $.each(s, function (field, value) {
                                            if (shouldOverrideField(field, suggestion.data)) {
                                                var parser = fieldParsers[field];
                                                if (parser) {
                                                    $.extend(suggestion.data, parser(value))
                                                } else {
                                                    suggestion.data[field] = value;
                                                }
                                            }
                                        });
                                    } else {
                                        // but even if qc is bad, should add it to suggestion object
                                        suggestion.data.qc = s.qc;
                                        if ('qc_complete' in s) {
                                            suggestion.data.qc_complete = s.qc_complete;
                                        }
                                    }
                                }

                                resolver.resolve(suggestion);
                            })
                            .fail(function () {
                                resolver.resolve(suggestion);
                            });
                        return resolver;
                    },
                    enrichResponse: function (response, query) {
                        var that = this,
                            suggestions = response.suggestions || [],
                            resolver = $.Deferred();

                        if (suggestions.length) {
                            return resolver.resolve(response);
                        }

                        startRequest.call(that, query)
                            .done(function (resp) {
                                var data = resp.data,
                                    value;
                                data = data && data[0] && data[0][0];
                                if (data) {
                                    delete data.source;
                                    value = valueComposer[that.options.type](data);
                                    if (value) {
                                        $.each(fieldParsers, function (field, parser) {
                                            if (field in data) {
                                                $.extend(data, parser(data[field]));
                                            }
                                        });
                                        response.suggestions = [
                                            {
                                                value: value,
                                                data: data
                                            }
                                        ];
                                    }
                                }
                                resolver.resolve(response);
                            })
                            .fail(function () {
                                resolver.resolve(response);
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

                if (that.options.useDadata && type && types.indexOf(type) >= 0 && token) {
                    that.enrichService = enrichServices.dadata;
                } else {
                    that.enrichService = enrichServices.default;
                }
            }
        };

        Suggestions.dadataConfig = dadataConfig;

        setOptionsHooks.push(methods.selectEnrichService);

    }());