describe('Select on blur', function () {
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
        this.server.restore();
        this.instance.dispose()
    });

    it('Should trigger on full match', function () {
        var suggestions = [
                { value: 'Afghanistan', data: 'Af' },
                { value: 'Albania', data: 'Al' },
                { value: 'Andorra', data: 'An' }
            ],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Albania';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        $(this.input).trigger($.Event('blur'));

        expect(options.onSelect).toHaveBeenCalledWith(suggestions[1]);
    });

    it('Should trigger when suggestion is selected manually', function () {
        var suggestions = [
            { value: 'Afghanistan', data: 'Af' },
            { value: 'Albania', data: 'Al' },
            { value: 'Andorra', data: 'An' }
        ];
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        this.instance.selectedIndex = 2;
        $(this.input).trigger($.Event('blur'));

        expect(options.onSelect).toHaveBeenCalledWith(suggestions[2]);
    });

    it('Should NOT trigger on partial match', function () {
        var suggestions = [
                { value: 'Jamaica', data: 'J' }
            ],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when nothing matched', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Alg';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
    });
});