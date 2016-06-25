describe('Element events', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
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

    it('`suggestions-select` should be triggered', function () {
        var suggestion = { value: 'A', data: 'B' },
            eventArgs = [];

        this.$input.on('suggestions-select', function (e, sug) {
            eventArgs.push(sug);
        });

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([suggestion]));
        this.instance.select(0);

        expect(eventArgs).toEqual([helpers.appendUnrestrictedValue(suggestion)]);
    });

    it('`suggestions-selectnothing` should be triggered', function () {
        var eventArgs = [];

        this.$input.on('suggestions-selectnothing', function (e, val) {
            eventArgs.push(val);
        });

        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        helpers.hitEnter(this.input);

        expect(eventArgs).toEqual(['A']);
    });

    it('`suggestions-invalidateselection` should be triggered', function () {
        var suggestion = { value: 'A', data: 'B' },
            eventArgs = [];

        this.$input.on('suggestions-invalidateselection', function (e, val) {
            eventArgs.push(val);
        });

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([suggestion]));
        this.instance.select(0);

        this.input.value = 'Aaaa';
        this.instance.onValueChange();
        helpers.hitEnter(this.input);

        expect(eventArgs).toEqual([helpers.appendUnrestrictedValue(suggestion)]);
    });

    it('`suggestions-dispose` should be triggered', function () {
        var $parent = $('<input>')
            .appendTo($('body'));

        $parent.suggestions({
            type: 'ADDRESS',
            serviceUrl: serviceUrl,
            geoLocation: false
        });

        spyOn(this.instance, 'onParentDispose');

        this.instance.setOptions({
            constraints: $parent
        });

        $parent.suggestions().dispose();
        $parent.remove();

        expect(this.instance.onParentDispose).toHaveBeenCalled();
    });

    it('`suggestions-set` should be triggered', function () {
        // this.$input is different with this.instance.el, thought contains same element
        var $input = this.instance.el;
        spyOn($input, 'trigger');

        this.instance.setSuggestion({
            value: 'somethind',
            data: {}
        });

        expect($input.trigger).toHaveBeenCalledWith('suggestions-set');
    });

    it('`suggestions-fixdata` should be triggered', function () {
        // this.$input is different with this.instance.el, thought contains same element
        var $input = this.instance.el;
        spyOn($input, 'trigger');

        this.input.value = 'г Москва';
        this.instance.fixData();

        this.server.respond('GET', /address/, [200, { 'Content-type': 'application/json' }, JSON.stringify([
            {
                value: 'г Москва',
                data: {}
            }
        ])]);

        expect($input.trigger).toHaveBeenCalledWith('suggestions-fixdata');
    });

});