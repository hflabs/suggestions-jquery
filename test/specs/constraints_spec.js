
describe('Address constraints', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            useDadata: false,
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
                region:'Москва'
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
                    region:'Москва'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"region":"Москва"}]');
    });

    it('Should have `locations` parameter in request if constraints specified as single object named `restrictions`', function () {
        this.instance.setOptions({
            constraints: {
                restrictions: {
                    region:'Москва'
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
                        region:'Москва'
                    }
                },
                {
                    locations: {
                        kladr_id:'6500000000000'
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
                {'region': 'адыгея'},
                {'region': 'астраханская'},
                {'region': 'волгоградская'},
                {'region': 'калмыкия'},
                {'region': 'краснодарский'},
                {'region': 'ростовская'}
            ],
            [
                {region: 'курганская'},
                {region: 'свердловская'},
                {region: 'тюменская'},
                {region: 'ханты-мансийский'},
                {region: 'челябинская'},
                {region: 'ямало-ненецкая'}
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
                    region:'Москва'
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

    it('Should not display constraint when `label` is empty and can not be generated from `data`', function() {
        this.instance.setOptions({
            constraints: {
                locations: {
                    kladr_id: '71'
                }
            }
        });

        expect(this.instance.$constraints.children().length).toEqual(0);
    });

    it('Should not show any cross sign if `deletable` option is omitted', function () {
        this.instance.setOptions({
            constraints: {
                locations: {
                    region:'Москва'
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
                    region:'Москва'
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
                    region:'Москва'
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

    it('Should set unrestricted suggestion value', function() {
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
        var suggestions = [{ value: 'ул Буквенная, д 20', data: null }];

        this.input.value = 'Буквенная 20';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        expect(this.instance.suggestions[0]).toEqual({
            value: 'ул Буквенная, д 20',
            unrestricted_value: 'обл Ростовская, г Ростов-на-Дону, ул Буквенная, д 20',
            data: null
        });
    });

    it('Should not set unrestricted suggestion value on multiple constraints', function() {
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
        var suggestions = [{ value: 'ул Буквенная, д 20', data: null }];

        this.input.value = 'Буквенная 20';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        expect(this.instance.suggestions[0]).toEqual({
            value: 'ул Буквенная, д 20',
            unrestricted_value: 'ул Буквенная, д 20',
            data: null
        });
    });

    it('Should set another control\'s suggestion as a constraint', function () {
        var $parent = $('<input>')
            .appendTo($('body'));

        $parent.suggestions({
            type: 'ADDRESS',
            serviceUrl: serviceUrl,
            geoLocation: false,
            useDadata: false
        });

        $parent.suggestions().setSuggestion({
            value: 'г. Санкт-Петербург',
            data: {
                kladr_id: '7800000000000'
            }
        });

        this.instance.setOptions({
            constraints: $parent
        });

        this.input.value = 'улица';
        this.instance.onValueChange();
        $parent.remove();

        expect(this.server.requests[0].requestBody).toContain('"locations":[{"kladr_id":"7800000000000"}]');
        expect(this.server.requests[0].requestBody).toContain('"restrict_value":true');
    });

    it('Should fill empty controls, that are set as constraints', function () {
        var $parent = $('<input>')
            .appendTo($('body'));

        $parent.suggestions({
            type: 'ADDRESS',
            serviceUrl: serviceUrl,
            geoLocation: false,
            useDadata: false,
            bounds: 'region-settlement',
            params: { 'id': 'parent' }
        });

        this.instance.setOptions({
            bounds: 'street-',
            constraints: $parent
        });

        this.input.value = 'бара';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                "value": "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
                "unrestricted_value": "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
                "data": {
                    "country": "Россия",
                    "region_type": "обл", "region_type_full": "область", "region": "Тульская",
                    "area_type": "р-н", "area_type_full": "район", "area": "Узловский",
                    "city_type": "г", "city_type_full": "город", "city": "Узловая",
                    "settlement_type": "п", "settlement_type_full": "поселок", "settlement": "Брусянский",
                    "street_type": "ул", "street_type_full": "улица", "street": "Строителей",
                    "house_type": "д", "house_type_full": "дом", "house": "1-бара",
                    "kladr_id": "7102200100200310001"
                }
            }
        ]));
        this.instance.selectedIndex = 0;
        this.instance.select(0);

        var request = JSON.parse(this.server.requests[1].requestBody);
        expect(request).toEqual(jasmine.objectContaining({id:"parent"}));
        expect(request).toEqual(jasmine.objectContaining({locations:[{"area":"Узловский","city":"Узловая","region":"Тульская"}]}));
        expect(request).toEqual(jasmine.objectContaining({query:"Брусянский"}));
        this.server.respond(helpers.responseFor([
            {
                "value": "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский",
                "unrestricted_value": "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский",
                "data": {
                    "country": "Россия",
                    "region_type": "обл", "region_type_full": "область", "region": "Тульская",
                    "area_type": "р-н", "area_type_full": "район", "area": "Узловский",
                    "city_type": "г", "city_type_full": "город", "city": "Узловая",
                    "settlement_type": "п", "settlement_type_full": "поселок", "settlement": "Брусянский",
                    "kladr_id": "7102200100200000000"
                }
            }
        ]));

        expect($parent.val()).toEqual('Тульская обл, р-н Узловский, г Узловая, п Брусянский');
        expect(this.$input.val()).toEqual('ул Строителей, д 1-бара');
        $parent.remove();
    });

});