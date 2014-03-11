describe('Select on Space', function () {
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
        $('.suggestions-suggestions').remove();
        this.server.restore();
    });

    it('Should trigger when suggestion is selected', function () {
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
        event.keyCode = event.which = 32; // code of space
        $(this.input).trigger(event);

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should trigger when nothing is selected but there is exact match', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jamaica';
        this.instance.onValueChange();
        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect).toHaveBeenCalledWith(suggestion);
    });

    it('Should NOT trigger when triggerSelectOnSpace = false', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                triggerSelectOnSpace: false,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect).not.toHaveBeenCalled();
    });


});