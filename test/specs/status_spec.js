describe('Status features', function () {
    'use strict';

    var serviceUrl = '/some/url',
        token = '1234';

    beforeEach(function () {
        $.Suggestions.resetTokens();
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            token: token
        }).suggestions();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
        $.Suggestions.resetTokens();
    });

    it('Should send status request with token', function () {
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].url).toMatch(/status\/fio/);
        expect(this.server.requests[0].requestHeaders.Authorization).toEqual('Token ' + token);
    });

    it('Should send status request without token', function () {
        this.server.requests.length = 0;
        this.instance.setOptions({
            token: null
        });

        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].url).toMatch(/status\/fio/);
        expect(this.server.requests[0].requestHeaders.Authorization).toBeUndefined();
    });

    it('Should invoke `onSearchError` callback if status request failed', function () {
        var options = {
            onSearchError: $.noop,
            token: '456'
        };
        spyOn(options, 'onSearchError');
        this.instance.setOptions(options);

        this.server.respond([401, {}, 'Not Authorized']);

        expect(options.onSearchError).toHaveBeenCalled();
    });

    it('Should use url param (if it passed) instead of serviceUrl', function () {
        this.server.requests.length = 0;
        this.instance.setOptions({
            token: null,
            url: 'http://unchangeable/url'
        });

        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].url).toEqual('http://unchangeable/url');
    });

    describe('Several instances with the same token', function () {

        beforeEach(function () {
            this.input2 = document.createElement('input');
            this.$input2 = $(this.input2).appendTo('body');
            this.instance2 = this.$input2.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME',
                token: token
            }).suggestions();
        });

        afterEach(function () {
            this.instance2.dispose();
            this.$input2.remove();
        });

        it('Should use the same authorization query', function () {
            expect(this.server.requests.length).toEqual(1);
        });

        it('Should make another request for controls of different types', function () {
            this.instance.setOptions({
                type: 'ADDRESS',
                geoLocation: false
            });

            expect(this.server.requests.length).toEqual(2);
        });

        it('Should invoke `onSearchError` callback on controls with same type and token', function () {
            var options = {
                onSearchError: $.noop
            };
            spyOn(options, 'onSearchError');
            this.instance2.setOptions(options);

            this.server.respond([401, {}, 'Not Authorized']);

            expect(options.onSearchError).toHaveBeenCalled();
        });
    });

});
