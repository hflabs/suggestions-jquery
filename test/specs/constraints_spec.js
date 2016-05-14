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
            geoLocation: false
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

    });

});