describe('Select on blur', function () {
    'use strict';

    var serviceUrl = '/some/url',
        $body = $(document.body);

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo($body);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();

        helpers.returnGoodStatus(this.server);
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should trigger on full match', function () {
        var suggestions = [
                { value: 'Afghanistan', data: 'Af' },
                { value: 'Albania', data: 'Al' },
                { value: 'Andorra', data: 'An' }
            ],
            options = {
                onSelect: function () {
                }
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Albania';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        helpers.fireBlur(this.input);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(
            helpers.appendUnrestrictedValue(suggestions[1]),
            false
        );
    });

    it('Should trigger when suggestion is selected manually', function () {
        var suggestions = [
            { value: 'Afghanistan', data: 'Af' },
            { value: 'Albania', data: 'Al' },
            { value: 'Andorra', data: 'An' }
        ];
        var options = {
            onSelect: function () {
            }
        };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        this.instance.selectedIndex = 2;
        helpers.fireBlur(this.input);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(
            helpers.appendUnrestrictedValue(suggestions[2]),
            true
        );
    });

    it('Should NOT trigger on partial match', function () {
        var suggestions = [
                { value: 'Jamaica', data: 'J' }
            ],
            options = {
                onSelect: function () {
                }
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when nothing matched', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                onSelect: function () {
                }
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Alg';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        this.input.blur();

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when triggerSelectOnBlur is false', function () {
        var suggestions = [{ value: 'Jamaica', data: 'J' }],
            options = {
                onSelect: function () {
                },
                triggerSelectOnBlur: false
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;
        helpers.fireBlur(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });
});