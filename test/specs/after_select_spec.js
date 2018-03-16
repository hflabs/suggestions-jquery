describe('After selecting', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo($('body'));
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            enrichmentEnabled: false
        }).suggestions();

        helpers.returnPoorStatus(this.server);
    });

    afterEach(function () {
        this.server.restore();
        this.instance.dispose();
        this.$input.remove();
    });

    it('Should hide dropdown if received suggestions contains only one suggestion equal to current', function () {
        var suggestions = [
            {
                value: 'Some value',
                data: null
            }
        ];

        // show list
        this.input.value = 'S';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        spyOn(this.instance, 'hide');

        // select suggestion from list
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // list is waiting for being updated
        this.server.respond(helpers.responseFor(suggestions));

        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide dropdown if selected NAME suggestion with all fields filled', function () {
        var suggestions = [
            {
                value: 'Surname Name Patronymic',
                data: {
                    surname: 'Surname',
                    name: 'Name',
                    patronymic: 'Patronymic',
                    gender: 'MALE'
                }
            }
        ];

        this.input.value = 'S';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide dropdown if selected NAME suggestion with name and surname filled for IOF', function () {
        var suggestions = [
            {
                value: 'Николай Александрович',
                data: {
                    surname: 'Александрович',
                    name: 'Николай',
                    patronymic: null,
                    gender: 'MALE'
                }
            }
        ];

        this.input.value = 'Н';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide dropdown if selected ADDRESS suggestion with `house` field filled', function () {
        var suggestions = [
            {
                value: 'Россия, г Москва, ул Арбат, дом 10',
                data: {
                    country: 'Россия',
                    city: 'Москва',
                    city_type: 'г',
                    street: 'Арбат',
                    street_type: 'ул',
                    house: '10',
                    house_type: 'дом'
                }
            }
        ];

        this.instance.setOptions({
            type: 'ADDRESS',
            geoLocation: false
        });
        helpers.returnPoorStatus(this.server);

        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should do nothing if select same suggestion twice', function () {
        var suggestion = {
                value: 'Some value',
                data: {}
            },
            options = {
                onSelect: $.noop
            };

        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        // show list
        this.input.value = 'S';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([suggestion]));

        this.instance.setSuggestion(suggestion);

        // select suggestion from list
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should show hint if no suggestions received', function () {
        var suggestions = [];

        this.instance.setOptions({
            type: 'ADDRESS',
            geoLocation: false
        });
        helpers.returnPoorStatus(this.server);
        spyOn(this.instance, 'hide');

        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        var $hint = this.instance.$container.find('.suggestions-hint');
        expect($hint.length).toEqual(1);
        expect(this.instance.hide).not.toHaveBeenCalled();
    });

});