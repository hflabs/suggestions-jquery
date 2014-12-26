describe('Enrich', function () {
    'use strict';

    var serviceUrl = 'some/url',
        fixtures = {
            poorName: [{
                value: 'Романов Иван Петрович',
                data: {
                    name: 'Иван',
                    patronymic: 'Петрович',
                    surname: 'Романов',
                    gender: 'MALE',
                    qc: null
                }
            }],
            poorAddress: [{
                value: 'Москва',
                data: {
                    city: 'Москва',
                    qc: null
                }
            }],
            poorParty: [{
                value: 'Фирма',
                data: {
                    qc: null
                }
            }],
            enriched: [{
                value: 'Москва',
                data: {
                    city: 'Москва',
                    qc: 0
                }
            }]
        };

    beforeEach(function(){
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            token: '123'
        }).suggestions();
    });

    afterEach(function () {
        this.instance.dispose();
        this.server.restore();
    });

    it('Should NOT enrich a suggestion for names', function () {
        this.instance.setOptions({
            type: 'NAME'
        });

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorName));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

    it('Should NOT enrich a suggestion for parties', function () {
        this.instance.setOptions({
            type: 'PARTY'
        });

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorParty));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

    it('Should enrich address when selected', function () {

        // select address
        this.input.value = 'М';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddress));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).toContain('"count":1');
        expect(this.server.requests[0].requestBody).toContain('"query":"' + fixtures.poorAddress[0].value + '"');
    });

    it('Should not enrich a suggestion when selected by SPACE', function () {

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poor));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 32); // code of Space

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

    it('Should NOT enrich a suggestion when useDadata set to `false`', function () {
        this.instance.setOptions({
            useDadata: false
        });

        // select address
        this.input.value = 'М';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddress));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

    it('Should NOT enrich a suggestion with specified qc', function () {

        // select address
        this.input.value = 'М';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.enriched));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

});