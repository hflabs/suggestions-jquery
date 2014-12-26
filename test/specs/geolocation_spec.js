describe('Geolocation', function(){
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        $.Suggestions.resetLocation();
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
        $.Suggestions.resetLocation();
    });

    it('Should send geolocation request if no `geoLocation` option specified', function () {
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].url).toContain('detectAddressByIp');
    });

    it('Should send location with request', function () {

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

        expect(this.server.requests[1].requestBody).toContain('"locations_boost":[{"region":"москва","kladr_id":"7700000000000"}]');
    });

    it('Should not send geolocation request if `geoLocation` set to false', function () {
        this.server.requests.length = 0;

        this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            useDadata: false,
            geoLocation: false
        });

        expect(this.server.requests.length).toEqual(0);
    });

    it('Should not send geolocation request if `geoLocation` set as object', function () {
        this.server.requests.length = 0;

        this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            useDadata: false,
            geoLocation: {
                kladr_id: 83
            }
        });

        expect(this.server.requests.length).toEqual(0);
    });

    it('Should send location set by `geoLocation` option', function () {

        this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            useDadata: false,
            geoLocation: {
                kladr_id: '83'
            }
        });

        this.$input.val('A');
        this.$input.suggestions('onValueChange');

        expect(this.server.requests[1].requestBody).toContain('"locations_boost":[{"kladr_id":"83"}]');
    });

});