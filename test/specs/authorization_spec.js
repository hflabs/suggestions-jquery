
describe('Authorization features', function () {
    'use strict';
    
    var serviceUrl = '/some/url',
        token = '1234';

    beforeEach(function(){
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

    it('Should send empty authorization request if `token` option specified', function () {
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestHeaders.Authorization).toEqual('Token ' + token);
    });

    it('Should invoke `onSearchError` callback if authorization failed', function () {
        var options = {
            onSearchError: $.noop
        };
        spyOn(options, 'onSearchError');
        this.instance.setOptions(options);

        this.server.respond([401, {}, 'Not Authorized']);

        expect(options.onSearchError).toHaveBeenCalled();
    });

    describe('Several instances with the same token', function () {
        
        beforeEach(function(){
            this.input2 = document.createElement('input');
            this.$input2 = $(this.input2).appendTo('body');
            this.instance2 = this.$input2.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME',
                token: token
            }).suggestions();
        });
        
        afterEach(function(){
            this.instance2.dispose();
            this.$input2.remove();
        });
            
        it('Should use the same authorization query', function() {
            expect(this.server.requests.length).toEqual(1);
        });

        it('Should make another request for controls of different types', function() {
            this.instance.setOptions({
                type: 'ADDRESS',
                geoLocation: false
            });

            expect(this.server.requests.length).toEqual(2);
        });

        it('Should invoke `onSearchError` callback on controls with same type and token', function(){
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

describe('Authorization without token', function() {
    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });


    it('Should not send authorization request (no token)', function() {
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();

        expect(this.server.requests.length).toEqual(0);
    });

    it('Should not send authorization request (empty token)', function() {
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            token: ''
        }).suggestions();

        expect(this.server.requests.length).toEqual(0);
    });
});