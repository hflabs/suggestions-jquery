describe('Text to insert after selection', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function () {
        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            // disable mobile view features
            mobileWidth: NaN
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should invoke formatSelected callback', function () {
        this.instance.setOptions({
            formatSelected: function (suggestion) {
                return suggestion.data.customValue;
            }
        });
        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'A',
                data: {
                    customValue: 'custom value'
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('custom value ');
    });

    it('Should use default value if formatSelected returns nothing', function () {
        this.instance.setOptions({
            formatSelected: function (suggestion) {
                return '';
            },
            params: {
                parts: ['NAME']
            }
        });
        this.input.value = 'Al';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'Alex',
                data: {
                    name: 'Alex'
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('Alex');
    });

    it('Should invoke type-specified formatSelected method', function () {
        this.instance.setOptions({
            type: 'BANK'
        });
        this.input.value = 'Альфа';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'АЛЬФА-БАНК',
                data: {
                    name: {
                        full: 'АКЦИОНЕРНОЕ ОБЩЕСТВО "АЛЬФА-БАНК"',
                        payment: 'АО "АЛЬФА-БАНК"',
                        short: 'АЛЬФА-БАНК'
                    }
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('АО "АЛЬФА-БАНК"');
    });

});