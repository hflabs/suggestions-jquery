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
        this.server.restore();
        this.instance.dispose();
    });

    it('Should trigger when suggestion is selected', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;

        helpers.keydown(this.input, 32);

        expect(options.onSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('Should trigger when nothing is selected but there is exact match', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jamaica';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('Should NOT trigger when triggerSelectOnSpace = false', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                triggerSelectOnSpace: false,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect).not.toHaveBeenCalled();
    });


});