describe('Enrich', function () {
    'use strict';

    var serviceUrl = 'some/url',
        fixtures = {
            poor: [{
                value: 'Романов Иван Петрович',
                data: {
                    name: 'Иван',
                    patronymic: 'Петрович',
                    surname: 'Романов',
                    gender: 'MALE',
                    qc: null
                }
            }],
            enriched: [{
                value: 'Романов Иван Петрович',
                data: {
                    name: 'Иван',
                    patronymic: 'Петрович',
                    surname: 'Романов',
                    gender: 'MALE',
                    qc: 0
                }
            }]
        };

    beforeEach(function(){
        this.input = document.createElement('input');
        this.$input = $(this.input);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            token: '123'
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.server.restore();
        this.instance.dispose()
    });

    it('Should enrich a suggestion when selected', function () {

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poor));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).toContain('"count":1');
        expect(this.server.requests[0].requestBody).toContain('"query":"' + fixtures.poor[0].value + '"');
    });

    it('Should NOT enrich a suggestion when useDadata set to `false`', function () {
        this.instance.setOptions({
            useDadata: false
        });

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poor));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

    it('Should NOT enrich a suggestion with specified qc', function () {

        // select address
        this.input.value = 'Р';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.enriched));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });

});