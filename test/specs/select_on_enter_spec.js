describe('Select on Enter', function () {
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

    it('Should trigger first suggestion when it is not selected', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();

        var event = $.Event('keydown');
        event.keyCode = event.which = 13; // code of Enter
        $(this.input).trigger(event);

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should trigger first suggestion when it is selected', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();

        this.instance.selectedIndex = 0;

        var event = $.Event('keydown');
        event.keyCode = event.which = 13; // code of Enter
        $(this.input).trigger(event);

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should trigger other (not first) suggestion when it is selected', function () {
        var suggestions = [
            { value: 'Afghanistan', data: 'Af' },
            { value: 'Albania', data: 'Al' },
            { value: 'Andorra', data: 'An' }
        ];
        var options = {
                lookup: suggestions,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'A';
        this.instance.onValueChange();

        this.instance.selectedIndex = 2;

        var event = $.Event('keydown');
        event.keyCode = event.which = 13; // code of Enter
        $(this.input).trigger(event);

        expect(options.onSelect).toHaveBeenCalledWith(suggestions[2]);
    });

    it('Should NOT trigger when nothing matched', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Alg';
        this.instance.onValueChange();

        var event = $.Event('keydown');
        event.keyCode = event.which = 13; // code of Enter
        $(this.input).trigger(event);

        expect(options.onSelect).not.toHaveBeenCalled();
    });
});