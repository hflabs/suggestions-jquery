describe('Hiding dropdown on selecting', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl,
            useDadata: false
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.server.restore();
        this.instance.dispose();
    });

    it('Should hide if received suggestions contains only one suggestion equal to current', function () {
        var suggestions = [{
            value: 'Some value',
            data: null
        }];

        // show list
        this.input.value = 'S';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        spyOn(this.instance, 'hide');

        // select suggestion from list
        this.instance.selection = suggestions[0];
        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        // list is waiting for being updated
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide if selected NAME suggestion with all fields filled', function () {
        var suggestions = [{
            value: 'Surname Name Patronymic',
            data: {
                surname: 'Surname',
                name: 'Name',
                patronymic: 'Patronymic',
                gender: 'MALE'
            }
        }];

        this.instance.setOptions({
            type: 'NAME'
        });

        this.input.value = 'S';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide if selected ADDRESS suggestion with `house` field filled', function () {
        var suggestions = [{
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
        }];

        this.instance.setOptions({
            type: 'ADDRESS'
        });

        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(serviceUrl, helpers.responseFor(suggestions));

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

});