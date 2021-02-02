describe("Text to insert after selection", function() {
    "use strict";

    var serviceUrl = "/some/url";

    beforeEach(function() {
        this.server = sinon.fakeServer.create();

        this.input = document.createElement("input");
        this.$input = $(this.input).appendTo("body");
        this.instance = this.$input
            .suggestions({
                serviceUrl: serviceUrl,
                type: "NAME",
                // disable mobile view features
                mobileWidth: NaN,
            })
            .suggestions();

        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;
    });

    afterEach(function() {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it("Should invoke formatSelected callback", function() {
        this.instance.setOptions({
            formatSelected: function(suggestion) {
                return suggestion.data.customValue;
            },
        });
        this.input.value = "A";
        this.instance.onValueChange();
        this.server.respond(
            helpers.responseFor([
                {
                    value: "A",
                    data: {
                        customValue: "custom value",
                    },
                },
            ])
        );
        this.instance.select(0);

        expect(this.input.value).toEqual("custom value ");
    });

    it("Should use default value if formatSelected returns null", function() {
        this.instance.setOptions({
            formatSelected: function(suggestion) {
                return null;
            },
            params: {
                parts: ["NAME"],
            },
        });
        this.input.value = "Al";
        this.instance.onValueChange();
        this.server.respond(
            helpers.responseFor([
                {
                    value: "Alex",
                    data: {
                        name: "Alex",
                    },
                },
            ])
        );
        this.instance.select(0);

        expect(this.input.value).toEqual("Alex");
    });

    it("Should not use default value if formatSelected returns empty string", function() {
        this.instance.setOptions({
            formatSelected: function(suggestion) {
                return "";
            },
            params: {
                parts: ["NAME"],
            },
        });
        this.input.value = "Al";
        this.instance.onValueChange();
        this.server.respond(
            helpers.responseFor([
                {
                    value: "Alex",
                    data: {
                        name: "Alex",
                    },
                },
            ])
        );
        this.instance.select(0);

        expect(this.input.value).toEqual("");
    });

    it("Should invoke type-specified formatSelected method", function() {
        this.instance.setOptions({
            type: "BANK",
        });
        this.input.value = "Альфа";
        this.instance.onValueChange();
        this.server.respond(
            helpers.responseFor([
                {
                    value: "АЛЬФА-БАНК",
                    data: {
                        name: {
                            full: 'АКЦИОНЕРНОЕ ОБЩЕСТВО "АЛЬФА-БАНК"',
                            payment: 'АО "АЛЬФА-БАНК"',
                            short: "АЛЬФА-БАНК",
                        },
                    },
                },
            ])
        );
        this.instance.select(0);
        this.server.respond(
            helpers.responseFor([
                {
                    value: "АЛЬФА-БАНК",
                    data: {
                        name: {
                            full: 'АКЦИОНЕРНОЕ ОБЩЕСТВО "АЛЬФА-БАНК"',
                            payment: 'АО "АЛЬФА-БАНК"',
                            short: "АЛЬФА-БАНК",
                        },
                    },
                },
            ])
        );

        expect(this.input.value).toEqual('АО "АЛЬФА-БАНК"');
    });

    it("Should apply restriction to enriched suggestion", function() {
        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            constraints: {
                locations: { city: "Москва" },
            },
            restrict_value: true,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "Турист";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(
            helpers.responseFor([
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
                        street_with_type: "ул Туристская",
                    },
                },
            ])
        );

        // Selecting causes enrichment
        this.instance.select(0);

        // Respond with suggestions without restriction
        this.server.respond(
            helpers.responseFor([
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
                        street_with_type: "ул Туристская",
                    },
                },
            ])
        );

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("ул Туристская ");
    });

    it("Should show only city if region equals to city", function() {
        var suggestions = [
            {
                unrestricted_value: "г Москва",
                value: "г Москва",
                data: {
                    region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    region_kladr_id: "7700000000000",
                    region_with_type: "г Москва",
                    region_type: "г",
                    region_type_full: "город",
                    region: "Москва",
                    city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    city_kladr_id: "7700000000000",
                    city_with_type: "г Москва",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Москва",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            restrict_value: true,
            bounds: "region-city",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "г Мос";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("г Москва");
    });

    it("Should not include city district in constrained value (district from OKATO)", function() {
        var suggestions = [
            {
                unrestricted_value: "г Москва, р-н Новокосино, ул Суздальская",
                value: "г Москва, ул Суздальская",
                data: {
                    city: "Москва",
                    city_area: "Восточный",
                    city_district: "Новокосино",
                    city_district_fias_id: null,
                    city_district_kladr_id: null,
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district_with_type: "р-н Новокосино",
                    city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    city_kladr_id: "7700000000000",
                    city_type: "г",
                    city_type_full: "город",
                    city_with_type: "г Москва",
                    street_fias_id: "343a5d1b-87b4-43cc-8a82-30297a90fb61",
                    street_kladr_id: "77000000000045100",
                    street_with_type: "ул Суздальская",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Суздальская",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            constraints: {
                locations: { city: "Москва" },
            },
            restrict_value: true,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "Москва Суздальская";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("ул Суздальская ");
    });

    it("Should not include city district in constrained value (district from FIAS)", function() {
        var suggestions = [
            {
                value: "Краснодарский край, г Сочи, ул Лазурная",
                unrestricted_value:
                    "Краснодарский край, г Сочи, Адлерский р-н, ул Лазурная",
                data: {
                    region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8",
                    region_kladr_id: "2300000000000",
                    region_with_type: "Краснодарский край",
                    region_type: "край",
                    region_type_full: "край",
                    region: "Краснодарский",
                    city_fias_id: "79da737a-603b-4c19-9b54-9114c96fb912",
                    city_kladr_id: "2300000700000",
                    city_with_type: "г Сочи",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Сочи",
                    city_area: null,
                    city_district_fias_id:
                        "f1acccf5-36e2-44d5-9143-437cc7459ed1",
                    city_district_kladr_id: null,
                    city_district_with_type: "Адлерский р-н",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Адлерский",
                    street_fias_id: "24222d22-f165-42c6-8682-07aa04dd197c",
                    street_kladr_id: "23000007000168600",
                    street_with_type: "ул Лазурная",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Лазурная",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            constraints: {
                locations: {
                    region: "Краснодарский",
                    city: "Сочи",
                },
            },
            restrict_value: true,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "Сочи Лазурная";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("ул Лазурная ");
    });

    it("Should not include city district in bounded value (district from OKATO)", function() {
        var suggestions = [
            {
                unrestricted_value: "г Москва, р-н Новокосино, ул Суздальская",
                value: "г Москва, ул Суздальская",
                data: {
                    city: "Москва",
                    city_area: "Восточный",
                    city_district: "Новокосино",
                    city_district_fias_id: null,
                    city_district_kladr_id: null,
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district_with_type: "р-н Новокосино",
                    city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
                    city_kladr_id: "7700000000000",
                    city_type: "г",
                    city_type_full: "город",
                    city_with_type: "г Москва",
                    street_fias_id: "343a5d1b-87b4-43cc-8a82-30297a90fb61",
                    street_kladr_id: "77000000000045100",
                    street_with_type: "ул Суздальская",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Суздальская",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            bounds: "city-street",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "Москва Суздальская";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("г Москва, ул Суздальская");
    });

    it("Should not include city district in bounded value (district from FIAS)", function() {
        var suggestions = [
            {
                value: "Краснодарский край, г Сочи, ул Лазурная",
                unrestricted_value:
                    "Краснодарский край, г Сочи, Адлерский р-н, ул Лазурная",
                data: {
                    region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8",
                    region_kladr_id: "2300000000000",
                    region_with_type: "Краснодарский край",
                    region_type: "край",
                    region_type_full: "край",
                    region: "Краснодарский",
                    city_fias_id: "79da737a-603b-4c19-9b54-9114c96fb912",
                    city_kladr_id: "2300000700000",
                    city_with_type: "г Сочи",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Сочи",
                    city_area: null,
                    city_district_fias_id:
                        "f1acccf5-36e2-44d5-9143-437cc7459ed1",
                    city_district_kladr_id: null,
                    city_district_with_type: "Адлерский р-н",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Адлерский",
                    street_fias_id: "24222d22-f165-42c6-8682-07aa04dd197c",
                    street_kladr_id: "23000007000168600",
                    street_with_type: "ул Лазурная",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Лазурная",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            bounds: "city-street",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "Сочи Лазурная";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        // Value must be restricted by plugin
        expect(this.input.value).toEqual("г Сочи, ул Лазурная");
    });

    it("Should not include city district in bounded city-settlement parent (district from OKATO)", function() {
        var suggestions = [
            {
                unrestricted_value:
                    "Новосибирская обл, г Новосибирск, Заельцовский р-н, ул Вавилова",
                value: "г Новосибирск, ул Вавилова",
                data: {
                    postal_code: "630082",
                    country: "Россия",
                    region_fias_id: "1ac46b49-3209-4814-b7bf-a509ea1aecd9",
                    region_kladr_id: "5400000000000",
                    region_with_type: "Новосибирская обл",
                    region_type: "обл",
                    region_type_full: "область",
                    region: "Новосибирская",
                    city_fias_id: "8dea00e3-9aab-4d8e-887c-ef2aaa546456",
                    city_kladr_id: "5400000100000",
                    city_with_type: "г Новосибирск",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Новосибирск",
                    city_district_with_type: "Заельцовский р-н",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Заельцовский",
                    street_fias_id: "989d3078-b3cd-4c9a-a6c1-f7c62035d8b2",
                    street_kladr_id: "54000001000017800",
                    street_with_type: "ул Вавилова",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Вавилова",
                    fias_id: "989d3078-b3cd-4c9a-a6c1-f7c62035d8b2",
                    fias_level: "7",
                    kladr_id: "54000001000017800",
                    capital_marker: "2",
                    okato: "50401372000",
                    oktmo: "50701000",
                    tax_office: "5402",
                    geo_lat: "55.0556543",
                    geo_lon: "82.895762",
                    qc_geo: "2",
                },
            },
        ];

        var $parent = $("<input>").appendTo($(document.body));

        $parent.suggestions({
            serviceUrl: serviceUrl,
            type: "ADDRESS",
            geoLocation: false,
            bounds: "city-settlement",
            mobileWidth: NaN,
        });

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            bounds: "street",
            constraints: $parent,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        $parent.val("Ново");
        this.input.value = "Вави";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        expect($parent.val()).toEqual("г Новосибирск");

        $parent.remove();
    });

    it("Should not include city district in bounded city-settlement parent (district from FIAS)", function() {
        var suggestions = [
            {
                value: "Краснодарский край, г Сочи, ул Авиационная",
                unrestricted_value:
                    "Краснодарский край, г Сочи, Адлерский р-н, ул Авиационная",
                data: {
                    postal_code: "354340",
                    country: "Россия",
                    region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8",
                    region_kladr_id: "2300000000000",
                    region_with_type: "Краснодарский край",
                    region_type: "край",
                    region_type_full: "край",
                    region: "Краснодарский",
                    city_fias_id: "79da737a-603b-4c19-9b54-9114c96fb912",
                    city_kladr_id: "2300000700000",
                    city_with_type: "г Сочи",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Сочи",
                    city_district_fias_id:
                        "f1acccf5-36e2-44d5-9143-437cc7459ed1",
                    city_district_with_type: "Адлерский р-н",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Адлерский",
                    street_fias_id: "3ad045d7-ac58-4c82-8183-727fd14d83ef",
                    street_kladr_id: "23000007000162000",
                    street_with_type: "ул Авиационная",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Авиационная",
                    fias_id: "3ad045d7-ac58-4c82-8183-727fd14d83ef",
                    fias_level: "7",
                    kladr_id: "23000007000162000",
                    capital_marker: "0",
                    okato: "03426000000",
                    oktmo: "03726000",
                    tax_office: "2367",
                    geo_lat: "43.4306102",
                    geo_lon: "39.9347608",
                    qc_geo: "2",
                },
            },
        ];

        var $parent = $("<input>").appendTo($(document.body));

        $parent.suggestions({
            serviceUrl: serviceUrl,
            type: "ADDRESS",
            geoLocation: false,
            bounds: "city-settlement",
            mobileWidth: NaN,
        });

        this.instance.setOptions({
            type: "ADDRESS",
            geoLocation: false,
            bounds: "street",
            constraints: $parent,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        $parent.val("Сочи");
        this.input.value = "Авиа";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor(suggestions));

        expect($parent.val()).toEqual("г Сочи");

        $parent.remove();
    });

    it("Should include city district in constrained value for streets with same names", function() {
        // если в выпадашке есть данные с одинаковым value, то в input должен попасть район
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая",
                data: {
                    region_fias_id: "6f2cbfd8-692a-4ee4-9b16-067210bde3fc",
                    region_kladr_id: "0200000000000",
                    region_with_type: "респ Башкортостан",
                    region_type: "респ",
                    region_type_full: "республика",
                    region: "Башкортостан",
                    area_fias_id: "4295ec00-1d3f-475b-8f7f-bb8615aeff51",
                    area_kladr_id: "0200900000000",
                    area_with_type: "Белебеевский р-н",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Белебеевский",
                    city_fias_id: "11e85c3e-c276-43b3-94e8-6b7f6cde5ac1",
                    city_kladr_id: "0200900100000",
                    city_with_type: "г Белебей",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Белебей",
                    city_area: null,
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_kladr_id: null,
                    city_district_with_type: "р-н Девон",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Девон",
                    street_fias_id: "3a8bf88f-279c-412b-8bda-1c2976e2f8cb",
                    street_kladr_id: "02009001000028700",
                    street_with_type: "ул Вторая",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Вторая",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            constraints: {
                locations: {
                    region: "Башкортостан",
                    city: "Белебей",
                },
            },
            restrict_value: true,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual("р-н Девон, ул Вторая ");
    });

    it("Should include city district in bounded value for streets with same names", function() {
        // если в выпадашке есть данные с одинаковым value, то в input должен попасть район
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая",
                data: {
                    region_fias_id: "6f2cbfd8-692a-4ee4-9b16-067210bde3fc",
                    region_kladr_id: "0200000000000",
                    region_with_type: "респ Башкортостан",
                    region_type: "респ",
                    region_type_full: "республика",
                    region: "Башкортостан",
                    area_fias_id: "4295ec00-1d3f-475b-8f7f-bb8615aeff51",
                    area_kladr_id: "0200900000000",
                    area_with_type: "Белебеевский р-н",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Белебеевский",
                    city_fias_id: "11e85c3e-c276-43b3-94e8-6b7f6cde5ac1",
                    city_kladr_id: "0200900100000",
                    city_with_type: "г Белебей",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Белебей",
                    city_area: null,
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_kladr_id: null,
                    city_district_with_type: "р-н Девон",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Девон",
                    street_fias_id: "3a8bf88f-279c-412b-8bda-1c2976e2f8cb",
                    street_kladr_id: "02009001000028700",
                    street_with_type: "ул Вторая",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Вторая",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            bounds: "city-street",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual("г Белебей, р-н Девон, ул Вторая");
    });

    it("Should include city district in unrestricted value for streets with same names", function() {
        // если в выпадашке есть данные с одинаковым value, то в input должен попасть unrestricted_value
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая",
                data: {
                    region_with_type: "респ Башкортостан",
                    area_with_type: "Белебеевский р-н",
                    city_with_type: "г Белебей",
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_with_type: "р-н Девон",
                    street_with_type: "ул Вторая",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual(
            "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая "
        );
    });

    it("Should NOT include city district in constrained value for streets with same names IF unique street is selected", function() {
        // если в выпадашке есть данные с одинаковым value, то в input должен попасть район
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая",
                data: {
                    region_fias_id: "6f2cbfd8-692a-4ee4-9b16-067210bde3fc",
                    region_kladr_id: "0200000000000",
                    region_with_type: "респ Башкортостан",
                    region_type: "респ",
                    region_type_full: "республика",
                    region: "Башкортостан",
                    area_fias_id: "4295ec00-1d3f-475b-8f7f-bb8615aeff51",
                    area_kladr_id: "0200900000000",
                    area_with_type: "Белебеевский р-н",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Белебеевский",
                    city_fias_id: "11e85c3e-c276-43b3-94e8-6b7f6cde5ac1",
                    city_kladr_id: "0200900100000",
                    city_with_type: "г Белебей",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Белебей",
                    city_area: null,
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_kladr_id: null,
                    city_district_with_type: "р-н Девон",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Девон",
                    street_fias_id: "3a8bf88f-279c-412b-8bda-1c2976e2f8cb",
                    street_kladr_id: "02009001000028700",
                    street_with_type: "ул Вторая",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Вторая",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Двадцать вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Двадцать вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Двадцать вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Двадцать вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            constraints: {
                locations: {
                    region: "Башкортостан",
                    city: "Белебей",
                },
            },
            restrict_value: true,
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual("ул Вторая ");
    });

    it("Should NOT include city district in bounded value for streets with same names IF unique street is selected", function() {
        // если в выпадашке есть данные с одинаковым value, то в input должен попасть район
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, ул Вторая",
                data: {
                    region_fias_id: "6f2cbfd8-692a-4ee4-9b16-067210bde3fc",
                    region_kladr_id: "0200000000000",
                    region_with_type: "респ Башкортостан",
                    region_type: "респ",
                    region_type_full: "республика",
                    region: "Башкортостан",
                    area_fias_id: "4295ec00-1d3f-475b-8f7f-bb8615aeff51",
                    area_kladr_id: "0200900000000",
                    area_with_type: "Белебеевский р-н",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Белебеевский",
                    city_fias_id: "11e85c3e-c276-43b3-94e8-6b7f6cde5ac1",
                    city_kladr_id: "0200900100000",
                    city_with_type: "г Белебей",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Белебей",
                    city_area: null,
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_kladr_id: null,
                    city_district_with_type: "р-н Девон",
                    city_district_type: "р-н",
                    city_district_type_full: "район",
                    city_district: "Девон",
                    street_fias_id: "3a8bf88f-279c-412b-8bda-1c2976e2f8cb",
                    street_kladr_id: "02009001000028700",
                    street_with_type: "ул Вторая",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Вторая",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Двадцать вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Двадцать вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Двадцать вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Двадцать вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            bounds: "city-street",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual("г Белебей, ул Вторая");
    });

    it("Should NOT include city district in unrestricted value for streets with same names IF unique street is selected", function() {
        // если в выпадашке есть подсказки с одинаковым value, но выбрана подсказка с уникальным value,
        // то в input попадет просто value (не unrestricted_value)
        var suggestions = [
            {
                value: "респ Башкортостан, г Белебей, пер Тукаевский 2-й",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Девон, пер Тукаевский 2-й",
                data: {
                    region_with_type: "респ Башкортостан",
                    area_with_type: "Белебеевский р-н",
                    city_with_type: "г Белебей",
                    city_district_fias_id:
                        "916cb442-6505-4341-8f86-0ba8d3d966c8",
                    city_district_with_type: "р-н Девон",
                    street_with_type: "пер Тукаевский 2-й",
                },
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, р-н Ласточка, ул Вторая",
                data: {},
            },
            {
                value: "респ Башкортостан, г Белебей, ул Вторая",
                unrestricted_value:
                    "респ Башкортостан, Белебеевский р-н, г Белебей, Лесной р-н, ул Вторая",
                data: {},
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "белебей вторая";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual(
            "респ Башкортостан, г Белебей, пер Тукаевский 2-й "
        );
    });

    it("Should include city district in single input", function() {
        // отдельное поле для внутригородского района
        // ожидаем появления в нем района
        var suggestions = [
            {
                value: "Адлерский р-н",
                unrestricted_value: "Краснодарский край, г Сочи, Адлерский р-н",
                data: {
                    region_with_type: "Краснодарсский край",
                    city_with_type: "г Сочи",
                    city_district: "Адлерский",
                    city_district_fias_id:
                        "f1acccf5-36e2-44d5-9143-437cc7459ed1",
                    city_district_type: "р-н",
                    city_district_with_type: "Адлерский р-н",
                },
            },
        ];

        this.instance.setOptions({
            type: "ADDRESS",
            bounds: "city_district",
        });

        // Setting type will request for status
        helpers.returnGoodStatus(this.server);
        this.server.requests.length = 0;

        this.input.value = "адлер";
        this.instance.onValueChange();

        // Respond with suggestions with restricted values
        this.server.respond(helpers.responseFor(suggestions));

        // Selecting causes enrichment
        this.instance.select(0);
        this.server.respond(helpers.responseFor([suggestions[0]]));

        expect(this.input.value).toEqual("Адлерский р-н");
    });
});
