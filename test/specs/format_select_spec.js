describe('Text to insert after selection', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function () {
        this.server = sinon.fakeServer.create();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            // disable mobile view features
            mobileWidth: NaN
        }).suggestions();

        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should invoke formatSelected callback', function () {
        this.instance.setOptions({
            formatSelected: function (suggestion) {
                return suggestion.data.customValue;
            }
        });
        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'A',
                data: {
                    customValue: 'custom value'
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('custom value ');
    });

    it('Should use default value if formatSelected returns nothing', function () {
        this.instance.setOptions({
            formatSelected: function (suggestion) {
                return '';
            },
            params: {
                parts: ['NAME']
            }
        });
        this.input.value = 'Al';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'Alex',
                data: {
                    name: 'Alex'
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('Alex');
    });

    it('Should invoke type-specified formatSelected method', function () {
        this.instance.setOptions({
            type: 'BANK'
        });
        this.input.value = 'Альфа';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([
            {
                value: 'АЛЬФА-БАНК',
                data: {
                    name: {
                        full: 'АКЦИОНЕРНОЕ ОБЩЕСТВО "АЛЬФА-БАНК"',
                        payment: 'АО "АЛЬФА-БАНК"',
                        short: 'АЛЬФА-БАНК'
                    }
                }
            }
        ]));
        this.instance.select(0);

        expect(this.input.value).toEqual('АО "АЛЬФА-БАНК"');
    });

    it('Should apply restriction to enriched suggestion', function(){
        this.instance.setOptions({
            type: 'ADDRESS',
            geoLocation: false,
            constraints: {
                locations: { city: "Москва" }
            },
            restrict_value: true
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = 'Турист';
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor([
            {
                unrestricted_value: "г Москва, ул Туристская",
                value: "ул Туристская",
                data: {
                    city: "Москва",
                    city_type: "г",
                    city_type_full: "город",
                    city_with_type: "г Москва",
                    country: "Россия",
                    fias_id: "69d0825b-f27c-4bf1-b04a-bb27b0796152",
                    fias_level: "7",
                    kladr_id: "77000000000294700",
                    region: "Москва",
                    region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    region_kladr_id: "7700000000000",
                    region_type: "г",
                    region_type_full: "город",
                    region_with_type: "г Москва",
                    street: "Туристская",
                    street_fias_id: "69d0825b-f27c-4bf1-b04a-bb27b0796152",
                    street_kladr_id: "77000000000294700",
                    street_type: "ул",
                    street_type_full: "улица",
                    street_with_type: "ул Туристская"
                }
            }
        ]));

        // Selecting causes enrichment
        this.instance.select(0);

        // Respond with suggestions without restriction
        this.server.respond(helpers.responseFor([
            {
                unrestricted_value: "г Москва, ул Туристская",
                value: "г Москва, ул Туристская",
                data: {
                    city: "Москва",
                    city_type: "г",
                    city_type_full: "город",
                    city_with_type: "г Москва",
                    country: "Россия",
                    fias_id: "69d0825b-f27c-4bf1-b04a-bb27b0796152",
                    fias_level: "7",
                    kladr_id: "77000000000294700",
                    region: "Москва",
                    region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    region_kladr_id: "7700000000000",
                    region_type: "г",
                    region_type_full: "город",
                    region_with_type: "г Москва",
                    street: "Туристская",
                    street_fias_id: "69d0825b-f27c-4bf1-b04a-bb27b0796152",
                    street_kladr_id: "77000000000294700",
                    street_type: "ул",
                    street_type_full: "улица",
                    street_with_type: "ул Туристская"
                }
            }
        ]));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual('ул Туристская ');
    });

});