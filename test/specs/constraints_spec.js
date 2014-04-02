
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
            useDadata: false
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

});