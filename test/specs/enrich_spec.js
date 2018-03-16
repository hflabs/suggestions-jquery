describe('Enrich', function () {
    'use strict';

    var serviceUrl = 'some/url',
        $body = $(document.body),
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
            poorAddressRestricted: [{
                value: 'ул Солянка, д 6',
                unrestricted_value: 'г Москва, ул Солянка, д 6',
                data: {
                    region: 'Москва',
                    region_type: 'г',
                    region_with_type: 'г Москва',
                    city: 'Москва',
                    city_type: 'г',
                    city_with_type: 'г Москва',
                    street: 'Солянка',
                    street_type: 'ул',
                    street_with_type: 'ул Солянка',
                    house: '6',
                    qc: null
                }
            }],
            poorParty: [{
                value: 'Фирма',
                data: {
                    hid: '123'
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

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo($body);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            token: '123',
            geoLocation: false
        }).suggestions();

        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
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

    it('Should enrich a suggestion for parties', function () {
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
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).toContain('"count":1');
        expect(this.server.requests[0].requestBody).toContain('"query":"' + fixtures.poorParty[0].data.hid + '"');
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

    it('Should send unrestricted_value for enrichment', function () {

        this.instance.setOptions({
            constraints: {
                locations: { region_type: 'г', region: 'Москва', region_with_type: 'г Москва' }
            },
            restrict_value: true
        });

        // select address
        this.input.value = 'Сол';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddressRestricted));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).toContain('"count":1');
        expect(this.server.requests[0].requestBody).toContain('"query":"' + fixtures.poorAddressRestricted[0].unrestricted_value + '"');
    });

    it('Should not send constraints and boost parameters for enrichment', function () {

        this.instance.setOptions({
            constraints: {
                locations: { region_type: 'г', region: 'Москва', region_with_type: 'г Москва' }
            },
            restrict_value: true
        });

        // select address
        this.input.value = 'Сол';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddressRestricted));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].requestBody).not.toContain('"locations"');
        expect(this.server.requests[0].requestBody).not.toContain('"locations_boost"');
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

    it('Should ignore server `enrich:false` status', function () {
        $.Suggestions.resetTokens();
        this.instance.setOptions({
            token: '456'
        });
        helpers.returnStatus(this.server, {
            search: true,
            enrich: false
        });
        this.server.requests.length = 0;

        // select address
        this.input.value = 'М';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddress));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request enriched suggestion is sent
        expect(this.server.requests.length).toEqual(1);
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

    it('Should remove null values on GET request (cors disabled)', function () {
        var cors = $.support.cors;

        $.support.cors = false;

        // select address
        this.input.value = 'М';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(fixtures.poorAddress));

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        var bodyParts = this.server.requests[0].requestBody.split('&');
        // при GET запросе пустые параметры отсекаются
        expect(bodyParts.length).toEqual(2);

        $.support.cors = cors;
    });

});