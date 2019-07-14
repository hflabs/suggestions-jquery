describe("Select on Space", function() {
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
                type: "NAME",
                deferRequestBy: 0,
                triggerSelectOnSpace: true
            })
            .suggestions();

        helpers.returnGoodStatus(this.server);
    });

    afterEach(function() {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it("Should trigger when suggestion is selected", function() {
        var suggestions = [{ value: "Jamaica", data: "J" }],
            options = {
                onSelect: function() {}
            };
        spyOn(options, "onSelect");

        this.instance.setOptions(options);

        this.input.value = "Jam";
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;

        helpers.keydown(this.input, 32);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(
            helpers.appendUnrestrictedValue(suggestions[0]),
            true
        );
    });

    it("Should trigger when nothing is selected but there is exact match", function() {
        var suggestions = [{ value: "Jamaica", data: "J" }],
            options = {
                onSelect: function() {}
            };
        spyOn(options, "onSelect");

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = "Jamaica";
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(
            helpers.appendUnrestrictedValue(suggestions[0]),
            true
        );
    });

    it("Should NOT trigger when triggerSelectOnSpace = false", function() {
        var suggestions = [{ value: "Jamaica", data: "J" }],
            options = {
                triggerSelectOnSpace: false,
                onSelect: function() {}
            };
        spyOn(options, "onSelect");

        this.instance.setOptions(options);

        this.input.value = "Jam";
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 32); // code of space

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it("Should keep SPACE if selecting has been caused by space", function() {
        var suggestions = [
                {
                    value: "name",
                    data: { name: "name" }
                },
                {
                    value: "name surname",
                    data: { name: "name", surname: "surname" }
                }
            ],
            options = { onSelect: $.noop };

        spyOn(options, "onSelect");
        this.instance.setOptions(options);

        this.input.value = "name";
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));

        this.instance.selectedIndex = 0;
        helpers.keydown(this.input, 32);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(this.input.value).toEqual("name ");
    });
});
