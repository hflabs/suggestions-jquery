describe('Selecting details', function () {
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

    it('Should not add SPACE at the end if `type` option not specified', function () {
        this.instance.setOptions({
            lookup: [{
                value: 'Name',
                data: {
                    surname: null,
                    name: 'Name',
                    patronymic: null,
                    gender: 'MALE'
                }
            }]
        });

        this.input.value = 'N';
        this.instance.onValueChange();

        this.instance.selectedIndex = 0;
        $(this.input).trigger($.Event('blur'));

        expect(this.input.value).toEqual('Name');
    });


    describe('For NAME controls', function(){

        beforeEach(function(){
            this.instance.setOptions({
                type: 'NAME'
            });
        });

        it('Should add SPACE at the end if only NAME specified', function () {
            this.instance.setOptions({
                lookup: [{
                    value: 'Name',
                    data: {
                        surname: null,
                        name: 'Name',
                        patronymic: null,
                        gender: 'MALE'
                    }
                }]
            });

            this.input.value = 'N';
            this.instance.onValueChange();

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Name ');
        });

        it('Should add SPACE at the end if only SURNAME specified', function () {
            this.instance.setOptions({
                lookup: [{
                    value: 'Surname',
                    data: {
                        surname: 'Surname',
                        name: null,
                        patronymic: null,
                        gender: 'MALE'
                    }
                }]
            });

            this.input.value = 'S';
            this.instance.onValueChange();

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Surname ');
        });

        it('Should add SPACE at the end if only NAME and PATRONYMIC specified', function () {
            this.instance.setOptions({
                lookup: [{
                    value: 'Name Patronymic',
                    data: {
                        surname: null,
                        name: 'Name',
                        patronymic: 'Patronymic',
                        gender: 'MALE'
                    }
                }]
            });

            this.input.value = 'N';
            this.instance.onValueChange();

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Name Patronymic ');
        });

        it('Should not add SPACE at the end if full name specified', function () {
            this.instance.setOptions({
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

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Surname Name Patronymic');
        });

    });

    describe('For ADDRESS controls', function(){

        beforeEach(function(){
            this.instance.setOptions({
                type: 'ADDRESS'
            });
        });

        it('Should add SPACE at the end if only COUNTRY specified', function () {
            this.instance.setOptions({
                lookup: [{
                    value: 'Россия',
                    data: {
                        country: 'Россия'
                    }
                }]
            });

            this.input.value = 'Р';
            this.instance.onValueChange();

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Россия ');
        });

        it('Should add SPACE at the end if only COUNTRY, CITY and STREET specified', function () {
            this.instance.setOptions({
                lookup: [{
                    value: 'Россия, г Москва, ул Арбат',
                    data: {
                        country: 'Россия',
                        city: 'Москва',
                        city_type: 'г',
                        street: 'Арбат',
                        street_type: 'ул'
                    }
                }]
            });

            this.input.value = 'Р';
            this.instance.onValueChange();

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат ');
        });

        it('Should not add SPACE at the end if COUNTRY, CITY, STREET and HOUSE specified', function () {
            this.instance.setOptions({
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

            this.instance.selectedIndex = 0;
            $(this.input).trigger($.Event('blur'));

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат, дом 10');
        });

    });

});