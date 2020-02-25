describe("Fias", function() {
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
                type: "FIAS",
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

    it("Should support planning structure in locations", function() {
        this.instance.setOptions({
            constraints: {
                locations: [{ planning_structure_fias_id: "123" }]
            }
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"locations":[{"planning_structure_fias_id":"123"}'
        );
    });

    it("Should support planning structure in bounds", function() {
        this.instance.setOptions({
            bounds: "planning_structure"
        });

        this.input.value = "Jam";
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain(
            '"from_bound":{"value":"planning_structure"}'
        );
        expect(this.server.requests[0].requestBody).toContain(
            '"to_bound":{"value":"planning_structure"}'
        );
    });

    it("Should not iplocate", function() {
        this.server.requests.length = 0;

        this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: "FIAS"
        });

        expect(this.server.requests.length).toEqual(0);
    });

    it("Should not enrich", function() {
        // select address
        this.input.value = "Р";
        this.instance.onValueChange();
        this.server.respond(
            helpers.responseFor([
                {
                    value: "Москва",
                    data: {
                        city: "Москва",
                        qc: null
                    }
                }
            ])
        );

        this.server.requests.length = 0;
        this.instance.selectedIndex = 0;
        helpers.hitEnter(this.input);

        // request for enriched suggestion not sent
        expect(this.server.requests.length).toEqual(0);
    });
});
