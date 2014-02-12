
describe('Suggestions-jquery', function () {
    'use strict';
    
    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl
        }).suggestions();
        
        this.server = sinon.fakeServer.create();
    });
    
    afterEach(function () {
        $('.autocomplete-suggestions').remove();
        this.server.restore();
    });

    it('Should initialize suggestions options', function () {
        expect(this.instance.options.serviceUrl).toEqual(serviceUrl);
        expect(this.instance.suggestionsContainer).not.toBeNull();
    });

    it('Should get current value', function () {
        this.instance.setOptions({
            lookup: [{ value: 'Jamaica', data: 'B' }]
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.instance.visible).toBe(true);
        expect(this.instance.currentValue).toEqual('Jam');
    });

    it('Verify onSelect callback', function () {
        var suggestion = { value: 'A', data: 'B' },
            options = {
                lookup: [suggestion],
                triggerSelectOnValidInput: false,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');
        
        this.instance.setOptions(options);
        this.input.value = 'A';
        this.instance.onValueChange();
        this.instance.select(0);

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should convert suggestions format', function () {
        this.instance.setOptions({
            lookup: ['A', 'B']
        });

        expect(this.instance.options.lookup[0].value).toBe('A');
        expect(this.instance.options.lookup[1].value).toBe('B');
    });

    it('Should not autoselect first item by default', function () {
        this.instance.setOptions({
            lookup: ['Jamaica', 'Jamaica', 'Jamaica']
        });
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.instance.selectedIndex).toBe(-1);
    });

    it('Should autoselect first item if autoSelectFirst set to true', function () {
        this.instance.setOptions({
            lookup: ['Jamaica', 'Jamaica', 'Jamaica'],
            autoSelectFirst: true
        });
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.instance.selectedIndex).toBe(0);
    });

    it('Should use custom query parameter name', function () {
        var paramName = 'custom',
            paramValue = null;
        this.instance.setOptions({
            serviceUrl: '/test-query',
            paramName: paramName
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"custom":"Jam"');
    });

    it('Should destroy suggestions instance', function () {
        var $div = $(document.createElement('div')),
            $input = $(this.input);
        $input.suggestions({
            serviceUrl: '/test-dispose',
            appendTo: $div
        });

        expect($input.data('suggestions')).toBeDefined();
        expect($div.children().length).toBeGreaterThan(0);

        $input.suggestions('dispose');

        expect($input.data('suggestions')).toBeUndefined();
        expect($div.children().length).toBe(0);
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

    it('Should trigger select when input value matches suggestion', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                triggerSelectOnValidInput: true,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jamaica';
        this.instance.onValueChange();

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });
    
    it('Should trigger select when space bar pressed and triggerSelectOnSpace set to true', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                triggerSelectOnSpace: true,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();
        
        this.instance.selectedIndex = 0;
        
        var event = $.Event('keydown');
        event.keyCode = event.which = 32; // code of space
        $(this.input).trigger(event);
        
        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should NOT trigger select when input value matches suggestion', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                triggerSelectOnValidInput: false,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jamaica';
        this.instance.onValueChange();

        expect(options.onSelect).not.toHaveBeenCalled();
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
        
        var $item = $('.autocomplete-suggestion');
            
        expect($item.length).toEqual(1);
        expect($item.html()).toContain('<strong>Japa<\/strong>neese lives in <strong>Japa<\/strong>n and love non-japaneese');
    });


});