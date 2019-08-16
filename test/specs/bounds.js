describe("Bounds", function() {
    "use strict";

    var serviceUrl = "/some/url",
        $body = $(document.body);

    beforeEach(function() {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement("input");
        this.$input = $(this.input).appendTo($body);
        this.instance = this.$input
            .suggestions({
                serviceUrl: serviceUrl,
                type: "ADDRESS",
                geoLocation: false,
                // disable mobile view features
                mobileWidth: NaN
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

    it("Should include `bounds` option into request, if it is a range", function() {
        this.instance.setOptions({
            bounds: "city-street"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"city"}'
        );
        expect(this.server.requests[0].requestBody).toContain(
            '"to_bound":{"value":"street"}'
        );
    });

    it("Should include `bounds` option into request, if it is a single value", function() {
        this.instance.setOptions({
            bounds: "city"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"city"}'
        );
        expect(this.server.requests[0].requestBody).toContain(
            '"to_bound":{"value":"city"}'
        );
    });

    it("Should include `bounds` option into request, if it is an open range", function() {
        this.instance.setOptions({
            bounds: "street-"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"street"}'
        );
        expect(this.server.requests[0].requestBody).not.toContain(
            '"to_bound":'
        );
    });

    it("Should treat country as valid single bound", function() {
        this.instance.setOptions({
            bounds: "country"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"country"}'
        );
        expect(this.server.requests[0].requestBody).toContain(
            '"to_bound":{"value":"country"}'
        );
    });

    it("Should treat country as valid part of range bound", function() {
        this.instance.setOptions({
            bounds: "country-city"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"country"}'
        );
        expect(this.server.requests[0].requestBody).toContain(
            '"to_bound":{"value":"city"}'
        );
    });

    it("Should modify suggestion according to `bounds`", function() {
        this.instance.setOptions({
            bounds: "city-settlement"
        });

        this.instance.setSuggestion({
            value:
                "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
            unrestricted_value:
                "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
            data: {
                country: "Россия",
                region_type: "обл",
                region_type_full: "область",
                region: "Тульская",
                region_with_type: "Тульская обл",
                area_type: "р-н",
                area_type_full: "район",
                area: "Узловский",
                area_with_type: "Узловский р-н",
                city_type: "г",
                city_type_full: "город",
                city: "Узловая",
                city_with_type: "г Узловая",
                settlement_type: "п",
                settlement_type_full: "поселок",
                settlement: "Брусянский",
                settlement_with_type: "поселок Брусянский",
                street_type: "ул",
                street_type_full: "улица",
                street: "Строителей",
                street_with_type: "ул Строителей",
                house_type: "д",
                house_type_full: "дом",
                house: "1-бара",
                kladr_id: "7102200100200310001"
            }
        });

        expect(this.$input.val()).toEqual("г Узловая, поселок Брусянский");
        expect(this.instance.selection.data.street).toBeUndefined();
        expect(this.instance.selection.data.kladr_id).toEqual("7102200100200");
    });
});
