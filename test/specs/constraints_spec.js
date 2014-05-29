
describe('Address constraints', function () {
    'use strict';

    var serviceUrl = '/some/url'

    beforeEach(function(){
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            useDadata: false,
            constraints: false
        }).suggestions();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should not have `restrictions` parameter in request by default', function () {
        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).not.toContain('restrictions');
    });

    it('Should not have `restrictions` parameter in request if empty constraints specified', function () {
        this.instance.setOptions({
            constraints: {}
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).not.toContain('restrictions');
    });

    it('Should not have `restrictions` parameter in request if bad-formatted constraints specified', function () {
        this.instance.setOptions({
            constraints: {
                city:'Москва'
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).not.toContain('restrictions');
    });

    it('Should have `restrictions` parameter in request if constraints specified as single object', function () {
        this.instance.setOptions({
            constraints: {
                restrictions: {
                    city:'Москва'
                }
            }
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"restrictions":[{"city":"Москва"}]');
    });

    it('Should have `restrictions` parameter in request if constraints specified as array of objects', function () {
        this.instance.setOptions({
            constraints: [
                {
                    restrictions: {
                        city:'Москва'
                    }
                },
                {
                    restrictions: {
                        kladr_id:'6500000000000'
                    }
                }
            ]
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"restrictions":[{"city":"Москва"},{"kladr_id":"6500000000000"}]');
    });

    it('Should have `restrictions` parameter in request if constraints and their restrictions specified as arrays', function () {
        var restrictions = [
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
                    restrictions: restrictions[0]
                },
                {
                    label: 'УФО',
                    restrictions: restrictions[1]
                }
            ]
        });

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"restrictions":' + JSON.stringify(restrictions[0].concat(restrictions[1])));
    });

    it('Should show label for added constraint, which is build from restrictions', function () {
        this.instance.setOptions({
            constraints: {
                restrictions: {
                    city:'Москва'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('Москва');

        this.instance.setOptions({
            constraints: {
                restrictions: [
                    {
                        region: 'Москва'
                    },
                    {
                        city: 'Санкт-петербург'
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
                restrictions: {              // параметры, которые будут переданы на сервер
                    'region': 'новосибирская',
                    'city': 'бердск'
                }
            }
        });

        var $items = this.instance.$constraints.children('li');
        expect($items.length).toEqual(1);
        expect($items.first().text()).toEqual('Берск (НСО)');
    });

    it('Should not show any cross sign if `deletable` option is omitted', function () {
        this.instance.setOptions({
            constraints: {
                restrictions: {
                    city:'Москва'
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
                restrictions: {
                    city:'Москва'
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
                restrictions: {
                    city:'Москва'
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
        expect(this.server.requests[0].requestBody).not.toContain('"restrictions"');
        jQuery.fx.off = false;
    });

    it('Should use geolocation request if no constraints specified', function () {
        this.instance.setOptions({
            constraints: null
        });

        expect(this.server.requests[0].url).toContain('detectAddressByIp');
        this.server.respond([200, {'Content-type':'application/json'}, JSON.stringify({
            location: {
                data: {
                    region: 'москва',
                    kladr_id: '7700000000000'
                },
                value: '1.2.3.4'
            }
        })]);

        this.input.value = 'A';
        this.instance.onValueChange();

        expect(this.server.requests[1].requestBody).toContain('"restrictions":[{"kladr_id":"7700000000000"}]');
    });

});