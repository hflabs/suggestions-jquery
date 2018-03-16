describe('Adding space on selecting', function () {
    'use strict';

    var serviceUrl = '/some/url',
        $body = $(document.body);

    describe('For NAME controls', function () {

        beforeEach(function () {
            $.Suggestions.resetTokens();

            this.server = sinon.fakeServer.create();

            this.input = document.createElement('input');
            this.$input = $(this.input).appendTo($body);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME'
            }).suggestions();

            helpers.returnPoorStatus(this.server);
        });

        afterEach(function () {
            this.server.restore();
            this.instance.dispose();
            this.$input.remove();
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

        it('Should not add SPACE if only part expected', function () {
            this.instance.setOptions({
                params: {
                    parts: ['SURNAME']
                }
            });
            this.input.value = 'S';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Surname',
                data: {
                    surname: 'Surname',
                    name: null,
                    patronymic: null,
                    gender: 'UNKNOWN'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Surname');
        });

        it('Should not add SPACE if only part expected (params set as function)', function () {
            this.instance.setOptions({
                params: function (query) {
                    return {
                        parts: ['SURNAME']
                    };
                }
            });
            this.input.value = 'S';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Surname',
                data: {
                    surname: 'Surname',
                    name: null,
                    patronymic: null,
                    gender: 'UNKNOWN'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 13);

            expect(this.input.value).toEqual('Surname');
        });

    });

    describe('For ADDRESS controls', function () {

        beforeEach(function () {
            $.Suggestions.resetTokens();

            this.server = sinon.fakeServer.create();

            this.input = document.createElement('input');
            this.$input = $(this.input).appendTo($body);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'ADDRESS',
                geoLocation: false,
                enrichmentEnabled: false
            }).suggestions();

            helpers.returnPoorStatus(this.server);
        });

        afterEach(function () {
            this.instance.dispose();
            this.server.restore();
            this.$input.remove();
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

        it('Should add SPACE at the end if COUNTRY..HOUSE specified', function () {
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Россия, г Москва, ул Арбат, д 1',
                data: {
                    country: 'Россия',
                    city: 'Москва',
                    city_type: 'г',
                    street: 'Арбат',
                    street_type: 'ул',
                    house_type: 'д',
                    house: '1'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.hitEnter(this.input);

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат, д 1 ');
        });

        it('Should not add SPACE at the end if FLAT specified', function () {
            this.input.value = 'Р';
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor([{
                value: 'Россия, г Москва, ул Арбат, д 1, кв 22',
                data: {
                    country: 'Россия',
                    city: 'Москва',
                    city_type: 'г',
                    street: 'Арбат',
                    street_type: 'ул',
                    house: '1',
                    house_type: 'д',
                    flat: '22',
                    flat_type: 'кв'
                }
            }]));

            this.instance.selectedIndex = 0;
            helpers.hitEnter(this.input);

            expect(this.input.value).toEqual('Россия, г Москва, ул Арбат, д 1, кв 22');
        });

    });

});