describe("Base features", function() {
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

    describe("Misc", function() {
        it("Should get current value", function() {
            this.input.value = "Jam";
            this.instance.onValueChange();

            this.server.respond(
                helpers.responseFor([{ value: "Jamaica", data: "B" }])
            );

            expect(this.instance.visible).toBe(true);
            expect(this.instance.currentValue).toEqual("Jam");
        });

        it("Should convert suggestions format", function() {
            this.input.value = "A";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(["Alex", "Ammy", "Anny"]));
            expect(this.instance.suggestions[0]).toEqual(
                helpers.appendUnrestrictedValue({ value: "Alex", data: null })
            );
            expect(this.instance.suggestions[1]).toEqual(
                helpers.appendUnrestrictedValue({ value: "Ammy", data: null })
            );
            expect(this.instance.suggestions[2]).toEqual(
                helpers.appendUnrestrictedValue({ value: "Anny", data: null })
            );
        });

        it("Should destroy suggestions instance", function() {
            var $div = $(document.createElement("div"));

            $div.append(this.input);

            expect(this.$input.data("suggestions")).toBeDefined();

            this.$input.suggestions("dispose");

            expect(this.$input.data("suggestions")).toBeUndefined();
            $.each(
                [
                    ".suggestions-suggestions",
                    ".suggestions-addon",
                    ".suggestions-constraints"
                ],
                function(i, selector) {
                    expect($div.find(selector).length).toEqual(0);
                }
            );
        });

        it("Should set width to be greater than zero", function() {
            this.input.value = "Jam";
            this.instance.onValueChange();
            this.server.respond(
                helpers.responseFor([{ value: "Jamaica", data: "B" }])
            );
            expect(this.instance.$container.width()).toBeGreaterThan(0);
        });

        it("Should call beforeRender and pass container jQuery object", function() {
            var options = {
                beforeRender: function() {}
            };
            spyOn(options, "beforeRender");
            this.instance.setOptions(options);

            this.input.value = "Jam";
            this.instance.onValueChange();
            this.server.respond(
                helpers.responseFor([{ value: "Jamaica", data: "B" }])
            );

            expect(options.beforeRender.calls.count()).toEqual(1);
            expect(options.beforeRender).toHaveBeenCalledWith(
                this.instance.$container
            );
        });

        it("Should prevent Ajax requests if previous query with matching root failed.", function() {
            this.instance.setOptions({ preventBadQueries: true });
            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests.length).toEqual(1);
            this.server.respond(helpers.responseFor([]));

            this.input.value = "Jama";
            this.instance.onValueChange();

            expect(this.server.requests.length).toEqual(1);

            this.input.value = "Jamai";
            this.instance.onValueChange();

            expect(this.server.requests.length).toEqual(1);
        });

        it("Should initialize forced on call setSuggestion", function() {
            var hiddenInput = document.createElement("input"),
                $hiddenInput = $(hiddenInput).appendTo($body),
                instance;

            $hiddenInput.css({ display: "none" });

            $hiddenInput.suggestions({ type: "ADDRESS" });
            instance = $hiddenInput.suggestions();

            // initialization is deferred until element is hidden
            expect(instance.isUnavailable()).toEqual(true);
            expect(instance.initializer.state()).toEqual("pending");

            instance.setSuggestion({
                data: {}
            });

            expect(instance.isUnavailable()).toEqual(false);
            expect(instance.initializer.state()).toEqual("resolved");

            instance.dispose();
            $hiddenInput.remove();
        });
    });

    describe("onSelect callback", function() {
        it("Verify onSelect callback (fully changed)", function() {
            var suggestions = [{ value: "Abcdef", data: "B" }],
                options = {
                    onSelect: function() {}
                };
            spyOn(options, "onSelect");

            this.instance.setOptions(options);
            this.input.value = "A";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(suggestions));
            this.instance.select(0);

            expect(options.onSelect.calls.count()).toEqual(1);
            expect(options.onSelect).toHaveBeenCalledWith(
                helpers.appendUnrestrictedValue(suggestions[0]),
                true
            );
        });

        it("Verify onSelect callback (just enriched)", function() {
            var suggestions = [
                    {
                        value: "Abc",
                        data: {
                            name: "Name",
                            surname: "Surname",
                            patronymic: "Patronymic"
                        }
                    }
                ],
                options = {
                    onSelect: function() {}
                };
            spyOn(options, "onSelect");

            this.instance.setOptions(options);
            this.input.value = "Abc";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(suggestions));
            this.instance.select(0);

            expect(options.onSelect.calls.count()).toEqual(1);
            expect(options.onSelect).toHaveBeenCalledWith(
                helpers.appendUnrestrictedValue(suggestions[0]),
                false
            );
        });
    });

    describe("onSuggestionsFetch callback", function() {
        beforeEach(function() {
            this.suggestions = [
                helpers.appendUnrestrictedValue({
                    value: "Afghanistan",
                    data: { country: "Afghanistan" }
                }),
                helpers.appendUnrestrictedValue({
                    value: "Albania",
                    data: { country: "Albania" }
                }),
                helpers.appendUnrestrictedValue({
                    value: "Andorra",
                    data: { country: "Andorra" }
                })
            ];

            this.input.value = "A";
            this.instance.onValueChange();
        });

        it("invoked", function() {
            var options = {
                onSuggestionsFetch: function() {}
            };

            spyOn(options, "onSuggestionsFetch");

            this.instance.setOptions(options);

            this.server.respond(helpers.responseFor(this.suggestions));

            expect(options.onSuggestionsFetch.calls.count()).toEqual(1);
            expect(options.onSuggestionsFetch).toHaveBeenCalledWith(
                this.suggestions
            );
        });

        it("can modify argument", function() {
            this.instance.setOptions({
                onSuggestionsFetch: function(suggestions) {
                    // Move first option to the end
                    suggestions.push(suggestions.shift());
                }
            });

            this.server.respond(helpers.responseFor(this.suggestions));

            var $items = this.instance.$container.find(
                ".suggestions-suggestion"
            );

            // Second option become first
            expect($items.eq(0)).toContainText(this.suggestions[1].value);
            expect($items.eq(1)).toContainText(this.suggestions[2].value);
            // First option become last
            expect($items.eq(2)).toContainText(this.suggestions[0].value);
        });

        it("can use returned array", function() {
            this.instance.setOptions({
                onSuggestionsFetch: function(suggestions) {
                    // Return new array
                    return [suggestions[1], suggestions[2], suggestions[0]];
                }
            });

            this.server.respond(helpers.responseFor(this.suggestions));

            var $items = this.instance.$container.find(
                ".suggestions-suggestion"
            );

            // Second option become first
            expect($items.eq(0)).toContainText(this.suggestions[1].value);
            expect($items.eq(1)).toContainText(this.suggestions[2].value);
            // First option become last
            expect($items.eq(2)).toContainText(this.suggestions[0].value);
        });
    });

    describe("Hint message", function() {
        it("Should display default hint message above suggestions", function() {
            this.input.value = "jam";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(["Jamaica"]));

            var $hint = this.instance.$container.find(".suggestions-hint");

            expect($hint.length).toEqual(1);
            expect($hint.text()).toEqual($.Suggestions.defaultOptions.hint);
        });

        it("Should display custom hint message above suggestions", function() {
            var customHint = "This is custon hint";
            this.instance.setOptions({
                hint: customHint
            });

            this.input.value = "jam";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(["Jamaica"]));

            var $hint = this.instance.$container.find(".suggestions-hint");

            expect($hint.length).toEqual(1);
            expect($hint.text()).toEqual(customHint);
        });

        it("Should not display any hint message above suggestions", function() {
            this.instance.setOptions({
                hint: false
            });

            this.input.value = "jam";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(["Jamaica"]));

            var $hint = this.instance.$container.find(".suggestions-hint");

            expect($hint.length).toEqual(0);
        });

        it("Should not display any hint message for narrow-screen (mobile) view", function() {
            this.instance.setOptions({
                hint: false,
                mobileWidth: 20000
            });

            this.input.value = "jam";
            this.instance.onValueChange();
            this.server.respond(helpers.responseFor(["Jamaica"]));

            var $hint = this.instance.$container.find(".suggestions-hint");

            expect($hint.length).toEqual(0);
        });
    });

    describe("Language", function() {
        it("Should not include default language into request", function() {
            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).not.toContain(
                "language"
            );
        });

        it("Should include custom language into request", function() {
            this.instance.setOptions({
                language: "en"
            });
            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).toContain(
                '"language":"en"'
            );
        });
    });

    describe("Custom params", function() {
        it("Should use custom query parameter name", function() {
            this.instance.setOptions({
                paramName: "custom"
            });

            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).toContain(
                '"custom":"Jam"'
            );
        });

        it("Should include params option into request", function() {
            this.instance.setOptions({
                params: {
                    a: 1
                }
            });

            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).toContain('{"a":1,');
        });

        it("Should include params option into request when it is a function", function() {
            this.instance.setOptions({
                params: function() {
                    return { a: 2 };
                }
            });

            this.input.value = "Jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestBody).toContain('{"a":2,');
        });
    });

    describe("Headers", function() {
        it("Should include version info in requests", function() {
            this.input.value = "jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestHeaders["X-Version"]).toMatch(
                /\d+\.\d+\.\d+|9999/
            );
        });

        it("Should send custom HTTP headers", function() {
            this.instance.setOptions({
                headers: { "X-my-header": "blabla" }
            });
            this.input.value = "jam";
            this.instance.onValueChange();

            expect(
                this.server.requests[0].requestHeaders["X-my-header"]
            ).toEqual("blabla");
        });

        it("Should overwrite custom HTTP headers with ones used by plugin", function() {
            this.instance.setOptions({
                headers: { "X-Version": "blabla" }
            });
            this.input.value = "jam";
            this.instance.onValueChange();

            expect(this.server.requests[0].requestHeaders["X-Version"]).toEqual(
                $.Suggestions.version
            );
        });
    });
});
