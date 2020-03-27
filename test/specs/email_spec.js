describe("Email", function() {
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
                type: "EMAIL",
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

    it("Should not request until @ typed", function() {
        this.instance.setOptions({
            suggest_local: false
        });

        this.input.value = "jam";
        this.instance.onValueChange();

        expect(this.server.requests.length).toEqual(0);
    });
});
