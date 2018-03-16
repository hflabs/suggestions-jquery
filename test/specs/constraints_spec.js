describe('Address constraints', function () {
    'use strict';

    var serviceUrl = '/some/url',
        $body = $(document.body),
        fixtures = {
            fullyAddress: {
                'value': 'Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара',
                'unrestricted_value': 'Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара',
                'data': {
                    'country': 'Россия',
                    'region_type': 'обл', 'region_type_full': 'область', 'region': 'Тульская',
                    'region_with_type': 'Тульская обл',
                    'area_type': 'р-н', 'area_type_full': 'район', 'area': 'Узловский',
                    'area_with_type': 'Узловский р-н',
                    'city_type': 'г', 'city_type_full': 'город', 'city': 'Узловая',
                    'city_with_type': 'г Узловая',
                    'settlement_type': 'п', 'settlement_type_full': 'поселок', 'settlement': 'Брусянский',
                    'settlement_with_type': 'поселок Брусянский',
                    'street_type': 'ул', 'street_type_full': 'улица', 'street': 'Строителей',
                    'street_with_type': 'ул Строителей',
                    'house_type': 'д', 'house_type_full': 'дом', 'house': '1-бара',
                    'kladr_id': '7102200100200310001'
                }
            }

        };

    beforeEach(function () {
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo($body);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            geoLocation: false,
            enrichmentEnabled: false
        }).suggestions();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should not have `locations` parameter in request by default', function () {
        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).not.toContain('locations');
    });

    it('Should not have `locations` parameter in request if empty constraints specified', function () {
        this.instance.setOptions({
            constraints: {}
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).not.toContain('locations');
    });

    it('Should not have `locations` parameter in request if bad-formatted constraints specified', function () {
        this.instance.setOptions({
            constraints: {
                region: 'Москва'
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).not.toContain('locations');
    });

    it('Should have `locations` parameter in request if constraints specified as single object', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region: 'Москва'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region":"Москва"}]');
    });

    it('Should have `locations` parameter in request with only `kladr_id` if it is specified', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    country: 'россия',
                    region: 'москва',
                    city: 'москва',
                    kladr_id: '77',
                    qc_complete: 1
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"kladr_id":"77"}]');
    });

    // если в locations указан фиас параметр, то другие параметры не используются
    it('Should have `locations` parameter in request with only `region_fias_id` if it is specified', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    country: 'россия',
                    region: 'москва',
                    city: 'москва',
                    qc_complete: 1,
                    region_fias_id: '44'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region_fias_id":"44"}]');
    });

    // если в locations указан фиас параметр, то другие параметры не используются, даже кладр
    it('Should have `locations` parameter in request with only `region_fias_id` if specified fias and kladr', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    country: 'россия',
                    region: 'москва',
                    city: 'москва',
                    kladr_id: '77',
                    qc_complete: 1,
                    region_fias_id: '44'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region_fias_id":"44"}]');
    });

    // можно указать несколько фиас параметров
    it('Should have `locations` parameter in request with several fias params', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    country: 'россия',
                    region: 'москва',
                    city: 'москва',
                    kladr_id: '77',
                    qc_complete: 1,
                    region_fias_id: '44',
                    area_fias_id: '55'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region_fias_id":"44","area_fias_id":"55"}]');
    });

    it('Should have `locations` parameter in request with only acceptable fields', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    planet: 'земля',
                    country: 'россия',
                    region: 'москва',
                    city: 'москва',
                    qc_complete: 1
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"country":"россия","region":"москва","city":"москва"}]');
    });

    it('Should have `locations` parameter in request if constraints specified as single object named `restrictions`', function () {
        this.instance.setOptions({
            constraints: {
                restrictions: {
                    region: 'Москва'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region":"Москва"}]');
    });

    it('Should have `locations` parameter in request if constraints specified as array of objects', function () {
        this.instance.setOptions({
            constraints: [
                {
                    locations: {
                        region: 'Москва'
                    }
                },
                {
                    locations: {
                        kladr_id: '6500000000000'
                    }
                }
            ]
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region":"Москва"},{"kladr_id":"6500000000000"}]');
    });

    it('Should have `locations` parameter in request if constraints and their locations specified as arrays', function () {
        var locations = [
            [
                { 'region': 'адыгея' },
                { 'region': 'астраханская' },
                { 'region': 'волгоградская' },
                { 'region': 'калмыкия' },
                { 'region': 'краснодарский' },
                { 'region': 'ростовская' }
            ],
            [
                { region: 'курганская' },
                { region: 'свердловская' },
                { region: 'тюменская' },
                { region: 'ханты-мансийский' },
                { region: 'челябинская' },
                { region: 'ямало-ненецкая' }
            ]
        ];

        this.instance.setOptions({
            constraints: [
                {
                    label: 'ЮФО',
                    locations: locations[0]
                },
                {
                    label: 'УФО',
                    locations: locations[1]
                }
            ]
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":' + JSON.stringify(locations[0].concat(locations[1])));
    });

    it('Should have `locations` parameter for parties', function () {
        var locations = [
            [
                { 'region': 'адыгея' },
                { 'region': 'астраханская' },
                { 'region': 'волгоградская' },
                { 'region': 'калмыкия' },
                { 'region': 'краснодарский' },
                { 'region': 'ростовская' }
            ],
            [
                { region: 'курганская' },
                { region: 'свердловская' },
                { region: 'тюменская' },
                { region: 'ханты-мансийский' },
                { region: 'челябинская' },
                { region: 'ямало-ненецкая' }
            ]
        ];

        this.instance.setOptions({
            type: 'PARTY',
            constraints: {
                locations: { kladr_id: '77' }
            },
            restrict_value: true
        });

        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"kladr_id":"77"}]');
    });

    it('Should have `locations` parameter in request for x_type_full constraints', function () {
        var locations = {
            region_type_full: 'region',
            area_type_full: 'area',
            city_type_full: 'city',
            city_district_type_full: 'city_district',
            settlement_type_full: 'settlement',
            street_type_full: 'street'
        };

        this.instance.setOptions({
            constraints: {
                locations: locations
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(JSON.stringify(locations));
    });

    it('Should show label for added constraint, which is build from locations', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region: 'Москва'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('Москва');

        this.instance.setOptions({
            constraints: {
                locations: [
                    {
                        region: 'Москва'
                    },
                    {
                        region: 'Санкт-петербург'
                    }
                ]
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('Москва, Санкт-петербург');
    });

    it('Should show label for x_type_full constraint, which is build from locations', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region_type_full: 'region',
                    area_type_full: 'area',
                    city_type_full: 'city',
                    city_district_type_full: 'city_district',
                    settlement_type_full: 'settlement',
                    street_type_full: 'street'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('region, area, city, city_district, settlement, street');
    });

    it('Should show label for added constraint, taken from `label`', function () {
        this.instance.setOptions({
            constraints: {
                label: 'Берск (НСО)',       // текст метки, который будет выведен пользователю
                locations: {              // параметры, которые будут переданы на сервер
                    'region': 'новосибирская',
                    'city': 'бердск'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('Берск (НСО)');
    });

    it('Should not display constraint when `label` is not set and can not be generated from `data`', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    kladr_id: '71'
                }
            }
        });

        expect(this.instance.$constraints.children().length).toEqual(0);
    });

    it('Should not display constraint when `label` is set and as empty', function () {
        this.instance.setOptions({
            constraints: {
                label: false,
                locations: {
                    region: 'новосибирская',
                    city: 'новосибирск'
                }
            }
        });

        expect(this.instance.$constraints.children().length).toEqual(0);
    });

    it('Should not show any cross sign if `deletable` option is omitted', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region: 'Москва'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.find('.suggestions-remove').length).toEqual(0);
    });

    it('Should show cross sign if `deletable` option is truthy', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region: 'Москва'
                },
                deletable: true
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.find('.suggestions-remove').length).toEqual(1);
    });

    it('Should remove restriction on cross sign click', function () {
        jQuery.fx.off = true;
        this.instance.setOptions({
            constraints: {
                locations: {
                    region: 'Москва'
                },
                deletable: true
            }
        });

        var $items = this.instance.$constraints.children('li'),
            $cross = $items.find('.suggestions-remove');
        expect($items.length).toEqual(1);

        // remove label
        $cross.click();
        expect(this.instance.$constraints.children('li').length).toEqual(0);

        // ensure constraint is also removed
        this.input.value = 'A';
        this.instance.onValueChange();
        expect(this.server.requests[0].requestBody).not.toContain('"locations"');
        jQuery.fx.off = false;
    });

    it('Should set unrestricted suggestion value', function () {
        this.instance.setOptions({
            constraints: {
                label: 'обл Ростовская, г Ростов-на-Дону',
                locations: {
                    region: 'Ростовская',
                    city: 'Ростов-на-Дону'
                }
            },
            restrict_value: true
        });
        var suggestions = [
            { value: 'ул Буквенная, д 20', data: null }
        ];

        this.input.value = 'Буквенная 20';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        expect(this.instance.suggestions[0]).toEqual({
            value: 'ул Буквенная, д 20',
            unrestricted_value: 'обл Ростовская, г Ростов-на-Дону, ул Буквенная, д 20',
            data: null
        });
    });

    it('Should not set unrestricted suggestion value on multiple constraints', function () {
        this.instance.setOptions({
            constraints: [
                {
                    label: 'обл Ростовская, г Ростов-на-Дону',
                    locations: {
                        region: 'Ростовская',
                        city: 'Ростов-на-Дону'
                    }
                },
                {
                    locations: {
                        region: 'Москва'
                    }
                }
            ],
            restrict_value: true
        });
        var suggestions = [
            { value: 'ул Буквенная, д 20', data: null }
        ];

        this.input.value = 'Буквенная 20';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        expect(this.instance.suggestions[0]).toEqual({
            value: 'ул Буквенная, д 20',
            unrestricted_value: 'ул Буквенная, д 20',
            data: null
        });
    });

    describe('in cooperation with other control', function () {

        beforeEach(function () {
            this.$parent = $('<input>')
                .appendTo($body);

            this.$parent.suggestions({
                type: 'ADDRESS',
                serviceUrl: serviceUrl,
                geoLocation: false,
                bounds: 'region-area'
            });

            this.parentInstance = this.$parent.suggestions();
        });

        afterEach(function () {
            this.$parent.remove();
        });

        it('Should use parent data as a constraint in child', function () {

            this.parentInstance.setSuggestion({
                value: 'г. Санкт-Петербург',
                data: {
                    region: 'Санкт-Петербург',
                    region_type: 'г',
                    kladr_id: '7800000000000'
                }
            });

            this.instance.setOptions({
                constraints: this.$parent
            });

            this.input.value = 'улица';
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).toContain('"locations":[{"kladr_id":"7800000000000"}]');
            expect(this.server.requests[0].requestBody).toContain('"restrict_value":true');
        });

        it('Should fill empty parent control when suggestion is selected in child', function () {

            this.instance.setOptions({
                bounds: 'street-',
                constraints: this.$parent
            });

            this.input.value = 'бара';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([fixtures.fullyAddress]));
            this.instance.selectedIndex = 0;
            this.instance.select(0);

            expect(this.$parent.val()).toEqual('Тульская обл, Узловский р-н');
            expect(this.parentInstance.selection.data).toEqual(jasmine.objectContaining({
                region: 'Тульская',
                area: 'Узловский'
            }));
        });

        it('Should fill non-empty parent control with territory not including a selected', function () {

            this.parentInstance.setSuggestion({
                value: 'Новосибирская обл',
                data: {
                    region: 'новосибирская'
                }
            });

            this.instance.setOptions({
                bounds: 'street-',
                constraints: this.$parent
            });

            this.input.value = 'бара';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([fixtures.fullyAddress]));
            this.instance.selectedIndex = 0;
            this.instance.select(0);

            expect(this.$parent.val()).toEqual('Тульская обл, Узловский р-н');
            expect(this.parentInstance.selection.data).toEqual(jasmine.objectContaining({
                region: 'Тульская',
                area: 'Узловский'
            }));
        });

        it('Should not fill non-empty parent control with territory including a selected', function () {
            this.parentInstance.setSuggestion({
                value: 'Тульская, Узловский',
                data: {
                    region: 'Тульская',
                    area: 'Узловский'
                }
            });

            this.instance.setOptions({
                bounds: 'street-',
                constraints: this.$parent
            });

            this.input.value = 'бара';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([fixtures.fullyAddress]));
            this.instance.selectedIndex = 0;
            this.instance.select(0);

            expect(this.$parent.val()).toEqual('Тульская, Узловский');
            expect(this.parentInstance.selection.data).toEqual({
                region: 'Тульская',
                area: 'Узловский'
            });
        });

        it('Should spread data to all parents', function () {
            this.$parent.val('Тульская обл, Узловский р-н');
            this.input.value = 'г Узловая, поселок Брусянский, ул Строителей, д 1-бара';

            this.instance.setOptions({
                bounds: 'city-',
                constraints: this.$parent
            });

            this.instance.fixData();
            this.server.respond(helpers.responseFor([fixtures.fullyAddress]));

            expect(this.parentInstance.selection.data).toEqual(jasmine.objectContaining({
                region: 'Тульская',
                region_type: 'обл',
                area: 'Узловский',
                area_type: 'р-н'
            }));
        });

        it('Should remove city_fias_id from request', function () {
            var suggestions = [
                {
                    value: 'г Санкт-Петербург',
                    data: {
                        city_fias_id: 'c2deb16a-0330-4f05-821f-1d09c93331e6',
                        city: 'Санкт-Петербург',
                        city_type: 'г',
                        region_fias_id: 'c2deb16a-0330-4f05-821f-1d09c93331e6',
                        region: 'Санкт-Петербург',
                        region_type: 'г',
                    }
                }
            ];

            this.$parent.val('Санкт');
            this.parentInstance.onValueChange();
            this.server.respond(helpers.responseFor(suggestions));
            this.parentInstance.selectedIndex = 0;
            helpers.hitEnter(this.$parent);
            this.server.respond(helpers.responseFor(suggestions));

            this.instance.setOptions({
                bounds: 'city',
                constraints: this.$parent
            });

            this.input.value = 'кол';
            this.instance.onValueChange();
            var body = JSON.parse(this.server.lastRequest.requestBody);
            expect(body.locations[0].city_fias_id).toBe(undefined);
        });

    });

    describe('can restrict values', function () {

        it('one constraint (region)', function () {
            this.instance.setOptions({
                constraints: {
                    locations: {
                        region: 'тульская'
                    }
                },
                restrict_value: true
            });

            expect(this.instance.getSuggestionValue(fixtures.fullyAddress, { hasBeenEnriched: true })).toEqual('Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара');
        });

        it('one constraint (city)', function () {
            this.instance.setOptions({
                constraints: {
                    locations: {
                        city: 'узловая'
                    }
                },
                restrict_value: true
            });

            expect(this.instance.getSuggestionValue(fixtures.fullyAddress, { hasBeenEnriched: true })).toEqual('поселок Брусянский, ул Строителей, д 1-бара');
        });

        it('one constraint (street)', function () {
            this.instance.setOptions({
                constraints: {
                    locations: {
                        street: 'строителей'
                    }
                },
                restrict_value: true
            });

            expect(this.instance.getSuggestionValue(fixtures.fullyAddress, { hasBeenEnriched: true })).toEqual('д 1-бара');
        });

        it('one constraint (region by kladr_id)', function () {
            this.instance.setOptions({
                constraints: {
                    locations: {
                        // kladr of region
                        kladr_id: '7100000000'
                    }
                },
                restrict_value: true
            });

            expect(this.instance.getSuggestionValue(fixtures.fullyAddress, { hasBeenEnriched: true })).toEqual('Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара');
        });

        it('one constraint (street by kladr_id)', function () {
            this.instance.setOptions({
                constraints: {
                    locations: {
                        // Kladr of street
                        kladr_id: '71022001002003100'
                    }
                },
                restrict_value: true
            });

            expect(this.instance.getSuggestionValue(fixtures.fullyAddress, { hasBeenEnriched: true })).toEqual('д 1-бара');
        });

        it('one constraint (region by region_fias_id)', function () {
            this.instance.setOptions({
                constraints: {
                    label: "Краснодарский край",
                    locations: { region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8" }
                },
                restrict_value: true
            });
            var suggestion = {
                data: {
                    capital_marker: '0',
                    city: 'Сочи',
                    city_fias_id: '79da737a-603b-4c19-9b54-9114c96fb912',
                    city_kladr_id: '2300000700000',
                    city_type: 'г',
                    city_type_full: 'город',
                    city_with_type: 'г Сочи',
                    country: 'Россия',
                    fias_id: '79da737a-603b-4c19-9b54-9114c96fb912',
                    fias_level: '4',
                    geo_lat: '43.5816249',
                    geo_lon: '39.7229455',
                    kladr_id: '2300000700000',
                    okato: '03426000000',
                    oktmo: '03726000',
                    qc_geo: '4',
                    region: 'Краснодарский',
                    region_fias_id: 'd00e1013-16bd-4c09-b3d5-3cb09fc54bd8',
                    region_kladr_id: '2300000000000',
                    region_type: 'край',
                    region_type_full: 'край',
                    region_with_type: 'Краснодарский край',
                    tax_office: '2300'
                },
                unrestricted_value: 'Краснодарский край, г Сочи',
                value: 'г Сочи'
            };

            var value = this.instance.getSuggestionValue(suggestion, { hasBeenEnriched: true });
            expect(value).toEqual('г Сочи');
        });

        describe('set of constraints', function () {
            beforeEach(function () {
                this.instance.setOptions({
                    constraints: [
                        // Москва
                        {
                            locations: { region: 'Москва' },
                            deletable: true
                        },
                        // Московская область
                        {
                            label: 'МО',
                            locations: { kladr_id: '50' },
                            deletable: true
                        }
                    ],
                    restrict_value: true
                });
            });

            it('crop city if matches', function () {

                expect(this.instance.getSuggestionValue({
                    data: {
                        city: "Москва",
                        city_area: "Центральный",
                        city_district: "Хамовники р-н",
                        city_district_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                        city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                        city_kladr_id: "7700000000000",
                        city_type: "г",
                        city_type_full: "город",
                        city_with_type: "г Москва",
                        kladr_id: "77000000000714800",
                        okato: "45286590000",
                        oktmo: "45383000",
                        region: "Москва",
                        region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                        region_kladr_id: "7700000000000",
                        region_type: "г",
                        region_type_full: "город",
                        region_with_type: "г Москва",
                        street: "Турчанинов",
                        street_fias_id: "0f7981e6-65c6-4513-b771-f5db3bfafe60",
                        street_kladr_id: "77000000000714800",
                        street_type: "пер",
                        street_type_full: "переулок",
                        street_with_type: "Турчанинов пер"
                    }
                }, { hasBeenEnriched: true })).toEqual('Турчанинов пер');
            });

            it('crop region if matches', function () {

                expect(this.instance.getSuggestionValue({
                    data: {
                        city: "Коломна",
                        city_fias_id: "b367fb03-29f9-4dac-8d85-01595cfb6ad9",
                        city_kladr_id: "5000002700000",
                        city_type: "г",
                        city_type_full: "город",
                        city_with_type: "г Коломна",
                        country: "Россия",
                        fias_id: "b367fb03-29f9-4dac-8d85-01595cfb6ad9",
                        fias_level: "4",
                        kladr_id: "5000002700000",
                        okato: "46438000000",
                        oktmo: "46738000001",
                        region: "Московская",
                        region_fias_id: "29251dcf-00a1-4e34-98d4-5c47484a36d4",
                        region_kladr_id: "5000000000000",
                        region_type: "обл",
                        region_type_full: "область",
                        region_with_type: "Московская обл"
                    }
                }, { hasBeenEnriched: true })).toEqual('г Коломна');
            });

        });

    });

});
