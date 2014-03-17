
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
            token: token
        }).suggestions();
    });
    
    afterEach(function () {
        this.instance.dispose()
        this.$input.remove();
        this.server.restore();
        $.Suggestions.resetTokens();
    });

    it('Should send empty authorization request if `token` option specified', function () {
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestHeaders.Authorization).toEqual('Token ' + token);
    });

    it('Should deactivate plugin if authorization failed', function () {
        this.server.respond(serviceUrl, [401, {}, 'Not Authorized']);
        expect(this.instance.disabled).toEqual(true);
    });

    it('Should stay enabled if request succesed', function () {
        this.server.respond(serviceUrl, [200, {}, '{}']);
        expect(this.instance.disabled).toBeFalsy();
    });

    describe('Several instances with the same token', function () {
        
        beforeEach(function(){
            this.input2 = document.createElement('input');
            this.$input2 = $(this.input2).appendTo('body');
            this.instance2 = this.$input2.suggestions({
                serviceUrl: serviceUrl,
                token: token
            }).suggestions();
        });
        
        afterEach(function(){
            this.instance2.dispose()
        });
            
        it('Should use the same authorization query', function() {
            expect(this.server.requests.length).toEqual(1);
        });
        
        it('Should be enabled/disabled altogether', function(){
            this.server.respond(serviceUrl, [401, {}, 'Not Authorized']);
            expect(this.instance.disabled).toEqual(true);
            expect(this.instance2.disabled).toEqual(true);
        });
    });

/*
    it('Should destroy suggestions instance', function () {
        var $div = $(document.createElement('div'));

        this.instance.$wrapper.appendTo($div);
        
        expect(this.$input.data('suggestions')).toBeDefined();
        expect($div.find('.suggestions-suggestions').length).toBeGreaterThan(0);
        expect($div.find('.suggestions-preloader').length).toBeGreaterThan(0);

        this.$input.suggestions('dispose');

        expect(this.$input.data('suggestions')).toBeUndefined();
        expect($div.find('.suggestions-suggestions').length).toEqual(0);
        expect($div.find('.suggestions-preloader').length).toEqual(0);
    });

    it('Should construct serviceUrl via callback function.', function () {
        this.instance.setOptions({
            ignoreParams: true,
            serviceUrl: function (query) {
                return '/dynamic-url/' + (query && encodeURIComponent(query).replace(/%20/g, "+") || '');
            }
        });

        this.input.value = 'Hello World';
        this.instance.onValueChange();

        expect(this.server.requests[0].url).toBe('/dynamic-url/Hello+World');
    });

    it('Should set width to be greater than zero', function () {
        this.instance.setOptions({
            lookup: [{ value: 'Jamaica', data: 'B' }]
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();
        var width = $(this.instance.suggestionsContainer).width();

        expect(width).toBeGreaterThan(0);
    });

    it('Should call beforeRender and pass container jQuery object', function () {
        var context, elementCount;
        
        this.instance.setOptions({
            lookup: [{ value: 'Jamaica', data: 'B' }],
            beforeRender: function (container) {
                context = this;
                elementCount = container.length;
            }
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(context).toBe(this.input);
        expect(elementCount).toBe(1);
    });

    it('Should prevent Ajax requests if previous query with matching root failed.', function () {

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests.length).toEqual(1);
        this.server.respond('POST', serviceUrl, [
            200,
            {'Content-type':'application/json'},
            JSON.stringify({suggestions:[]})
        ]);
        
        this.input.value = 'Jama';
        this.instance.onValueChange();
        
        expect(this.server.requests.length).toEqual(1);
        
        this.instance.setOptions({ preventBadQueries: false });
        this.input.value = 'Jamai';
        this.instance.onValueChange();
        
        expect(this.server.requests.length).toEqual(2);
    });

    it('Should highlight search phrase', function () {
        this.instance.setOptions({
            lookup: ['Japaneese lives in Japan and love non-japaneese']
        });

        this.input.value = 'japa';
        this.instance.onValueChange();
        
        var $item = $('.suggestions-suggestion');
            
        expect($item.length).toEqual(1);
        expect($item.html()).toContain('<strong>Japa<\/strong>neese lives in <strong>Japa<\/strong>n and love non-japaneese');
    });
*/
});