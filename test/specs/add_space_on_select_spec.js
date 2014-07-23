describe('Adding space on selecting', function () {
    'use strict';

    var serviceUrl = '/some/url';

    describe('For NAME controls', function(){

        beforeEach(function(){
            this.input = document.createElement('input');
            this.$input = $(this.input);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME',
                useDadata: false
            }).suggestions();

            this.server = sinon.fakeServer.create();
        });

        afterEach(function () {
            this.server.restore();
            this.instance.dispose()
        });

        it('Should add SPACE at the end if only NAME specified', function () {
            this.input.value = 'N';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Name',
                data: {
                    surname: null,
                    name: 'Name',
                    patronymic: null,
                    gender: 'MALE'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Name ');
        });

        it('Should add SPACE at the end if only SURNAME specified', function () {
            this.input.value = 'S';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Surname',
                data: {
                    surname: 'Surname',
                    name: null,
                    patronymic: null,
                    gender: 'MALE'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Surname ');
        });

        it('Should add SPACE at the end if only NAME and PATRONYMIC specified', function () {
            this.input.value = 'N';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Name Patronymic',
                data: {
                    surname: null,
                    name: 'Name',
                    patronymic: 'Patronymic',
                    gender: 'MALE'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Name Patronymic ');
        });

        it('Should not add SPACE at the end if full name specified', function () {
            this.input.value = 'S';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Surname Name Patronymic',
                data: {
                    surname: 'Surname',
                    name: 'Name',
                    patronymic: 'Patronymic',
                    gender: 'MALE'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Surname Name Patronymic');
        });

    });

    describe('For ADDRESS controls', function(){

        beforeEach(function(){
            this.input = document.createElement('input');
            this.$input = $(this.input);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'ADDRESS',
                useDadata: false,
                constraints: false
            }).suggestions();

            this.server = sinon.fakeServer.create();
        });

        afterEach(function () {
            this.server.restore();
            this.instance.dispose()
        });

        it('Should add SPACE at the end if only COUNTRY specified', function () {
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Россия',
                data: {
                    country: 'Россия'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Россия ');
        });

        it('Should add SPACE at the end if only COUNTRY, CITY and STREET specified', function () {
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Россия, г Москва, ул Арбат',
                data: {
                    country: 'Россия',
                    city: 'Москва',
                    city_type: 'г',
                    street: 'Арбат',
                    street_type: 'ул'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.hitEnter(this.input);

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат ');
        });

        it('Should not add SPACE at the end if COUNTRY, CITY, STREET and HOUSE specified', function () {
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
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
            }]));

            this.instance.selectedIndex = 0;
            helpers.hitEnter(this.input);

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат, дом 10');
        });

        it('Should add SPACE at the end if COUNTRY, CITY, STREET and HOUSE specified but flat is expected', function () {
            this.instance.setOptions({
                useDadata: true,
                token: '123'
            });

            // select address
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
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
            }]));

            this.server.requests.length = 0;
            this.instance.selectedIndex = 0;
            helpers.hitEnter(this.input);

            // enriched answers
            expect(this.server.requests.length).toEqual(1);
            this.server.respond(helpers.responseFor([{
                value: 'Россия, г Москва, ул Арбат, дом 10',
                data: {
                    country: 'Россия',
                    city: 'Москва',
                    city_type: 'г',
                    street: 'Арбат',
                    street_type: 'ул',
                    house: '10',
                    house_type: 'дом',
                    qc: 0,
                    qc_complete: 5 // means flat expected
                }
            }]));

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат, дом 10 ');
        });

    });

});