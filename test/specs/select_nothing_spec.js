describe('Nothing selected callback', function () {
    'use strict';

    var serviceUrl = '/some/url',
        fixtures = [
            { value: 'Afghanistan', data: 'Af' },
            { value: 'Albania', data: 'Al' },
            { value: 'Andorra', data: 'An' }
        ];

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            onSelect: $.noop,
            geoLocation: false
        }).suggestions();

        helpers.returnGoodStatus(this.server);

        this.server.respond();
        this.server.requests.length = 0;
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should be triggered on ENTER pressed with no suggestions visible', function () {
        var options = {
            onSelectNothing: function () {
            }
        };
        spyOn(options, 'onSelectNothing');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        helpers.hitEnter(this.input);

        expect(options.onSelectNothing.calls.count()).toEqual(1);
        expect(options.onSelectNothing).toHaveBeenCalledWith('A');
    });

    it('Should be triggered on ENTER pressed with no matching suggestion', function () {
        var options = {
            onSelectNothing: function () {
            }
        };
        spyOn(options, 'onSelectNothing');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures));

        helpers.hitEnter(this.input);

        expect(options.onSelectNothing.calls.count()).toEqual(1);
        expect(options.onSelectNothing).toHaveBeenCalledWith('A');
    });

    it('Should be triggered when focus lost and no matching suggestion', function () {
        var options = {
            onSelectNothing: function () {
            }
        };
        spyOn(options, 'onSelectNothing');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures));

        helpers.fireBlur(this.input);

        expect(options.onSelectNothing.calls.count()).toEqual(1);
        expect(options.onSelectNothing).toHaveBeenCalledWith('A');
    });

});