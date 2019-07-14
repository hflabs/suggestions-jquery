describe("FixData", function() {
    "use strict";

    beforeEach(function() {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();

        this.input = document.createElement("input");
        this.$input = $(this.input).appendTo("body");
        this.instance = this.$input
            .suggestions({
                type: "ADDRESS"
            })
            .suggestions();

        helpers.returnGoodStatus(this.server);
    });

    afterEach(function() {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it("should not clear value on fixData", function() {
        var value = "Санкт-Петербург, ул. Софийская, д.35, корп.4, кв.81";
        this.input.value = value;

        this.$input.suggestions().fixData();
        this.server.respond(helpers.responseFor([]));

        expect(this.input.value).toEqual(value);
    });
});
