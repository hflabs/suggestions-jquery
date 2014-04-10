describe('Hiding dropdown on selecting', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl,
            useDadata: false
        }).suggestions();

    });

    afterEach(function () {
        this.instance.dispose()
    });

    it('Should request for new suggestions when any selected', function () {
        var suggestions = [
            {
                value: 'Some value',
                data: null
            }
        ];
        this.instance.setOptions({
            lookup: suggestions
        });

        this.input.value = 'S';
        this.instance.onValueChange();

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.getSuggestions).toHaveBeenCalled();
        expect(this.instance.hide).not.toHaveBeenCalled();
    });

    it('Should hide if received suggestions contains only one suggestion equal to current', function () {
        var suggestions = [{
            value: 'Some value',
            data: null
        }];
        this.instance.setOptions({
            lookup: suggestions
        });

        this.instance.selection = suggestions[0];

        this.input.value = 'S';
        this.instance.onValueChange();

        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide if selected NAME suggestion with all fields filled', function () {
        this.instance.setOptions({
            type: 'NAME',
            lookup: [{
                value: 'Surname Name Patronymic',
                data: {
                    surname: 'Surname',
                    name: 'Name',
                    patronymic: 'Patronymic',
                    gender: 'MALE'
                }
            }]
        });

        this.input.value = 'S';
        this.instance.onValueChange();

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

    it('Should hide if selected ADDRESS suggestion with `house` field filled', function () {
        this.instance.setOptions({
            type: 'ADDRESS',
            lookup: [{
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
            }]
        });

        this.input.value = 'Р';
        this.instance.onValueChange();

        spyOn(this.instance, 'getSuggestions');
        spyOn(this.instance, 'hide');

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 13);

        expect(this.instance.getSuggestions).not.toHaveBeenCalled();
        expect(this.instance.hide).toHaveBeenCalled();
    });

});