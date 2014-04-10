describe('Select on blur', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl
        }).suggestions();
    });

    afterEach(function () {
        this.instance.dispose()
    });

    it('Should trigger on full match', function () {
        var suggestions = [
                { value: 'Afghanistan', data: 'Af' },
                { value: 'Albania', data: 'Al' },
                { value: 'Andorra', data: 'An' }
            ],
            options = {
                lookup: suggestions,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Albania';
        this.instance.onValueChange();

        $(this.input).trigger($.Event('blur'));

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(suggestions[1]);
    });

    it('Should trigger when suggestion is selected manually', function () {
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
        $(this.input).trigger($.Event('blur'));

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(suggestions[2]);
    });

    it('Should NOT trigger on partial match', function () {
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
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
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
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
    });
});