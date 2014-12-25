
describe('Authorization features', function () {
    'use strict';
    
    var serviceUrl = '/some/url',
        token = '1234';

    beforeEach(function(){
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

    it('Should deactivate plugin if authorization failed', function () {
        this.server.respond([401, {}, 'Not Authorized']);
        expect(this.instance.disabled).toBeTruthy();
    });

    it('Should stay enabled if request succesed', function () {
        this.server.respond([200, {}, '{}']);
        expect(this.instance.disabled).toBeFalsy();
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
        
        it('Should be enabled/disabled altogether', function(){
            this.server.respond([401, {}, 'Not Authorized']);
            expect(this.instance.disabled).toEqual(true);
            expect(this.instance2.disabled).toEqual(true);
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