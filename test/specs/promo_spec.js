describe("Promo block", function() {
    "use strict";

    var serviceUrl = "/some/url";
    var token = "1234";

    function query(self) {
        self.input.value = "ант";
        self.instance.onValueChange();
        self.server.respond(
            helpers.responseFor([{ value: "Антон" }, { value: "Антонина" }])
        );
        return self.instance.$container
            .get(0)
            .querySelector(".suggestions-promo");
    }

    function queryNothing(self) {
        self.input.value = "фф";
        self.instance.onValueChange();
        self.server.respond(helpers.responseFor([]));
        return self.instance.$container
            .get(0)
            .querySelector(".suggestions-promo");
    }

    beforeEach(function() {
        $.Suggestions.resetTokens();
        this.server = sinon.fakeServer.create();
        this.input = document.createElement("input");
        document.body.appendChild(this.input);
        this.instance = $(this.input)
            .suggestions({
                serviceUrl: serviceUrl,
                type: "NAME",
                token: token
            })
            .suggestions();
    });

    afterEach(function() {
        this.instance.dispose();
        document.body.removeChild(this.input);
        this.server.restore();
        $.Suggestions.resetTokens();
    });

    it("Should set plan according to server", function() {
        expect(this.server.requests.length).toEqual(1);
        expect(this.server.requests[0].url).toMatch(/status\/fio/);
        this.server.respond([200, { "X-Plan": "FREE" }, '{ "search": true }']);
        expect(this.instance.status.plan).toEqual("FREE");
    });

    it("Should show promo block for free plan", function() {
        this.server.respond([200, { "X-Plan": "FREE" }, '{ "search": true }']);
        var promo = query(this);
        expect(helpers.isHidden(promo)).toBeFalsy();
    });

    it("Promo link should lead to Dadata", function() {
        this.server.respond([200, { "X-Plan": "FREE" }, '{ "search": true }']);
        var promo = query(this);
        var link = promo.querySelector("a");
        expect(link.href).toEqual(
            "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery"
        );
    });

    it("Should NOT show promo block for premium plan", function() {
        this.server.respond([
            200,
            { "X-Plan": "MEDIUM" },
            '{ "search": true }'
        ]);
        var promo = query(this);
        expect(helpers.isHidden(promo)).toBeTruthy();
    });

    it("Should NOT show promo block for standalone suggestions", function() {
        this.server.respond([200, { "X-Plan": "NONE" }, '{ "search": true }']);
        var promo = query(this);
        expect(helpers.isHidden(promo)).toBeTruthy();
    });

    it("Should NOT show promo block if header is missing", function() {
        this.server.respond([200, {}, '{ "search": true }']);
        var promo = query(this);
        expect(helpers.isHidden(promo)).toBeTruthy();
    });

    it("Should not show when response is empty", function() {
        this.server.respond([200, { "X-Plan": "FREE" }, '{ "search": true }']);
        var promo = queryNothing(this);
        expect(promo).toBeNull();
    });
});
