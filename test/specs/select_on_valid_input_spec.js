describe('Select on valid input', function () {
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

    it('Should trigger when input value matches suggestion', function () {
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

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should NOT trigger when input value matches suggestion', function () {
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
});