this.helpers = function() {
    var helpers = {
        isHidden: function(el) {
            return el.offsetParent === null;
        },
        keydown: function(el, keyCode) {
            var event = $.Event("keydown");
            event.keyCode = event.which = keyCode;
            $(el).trigger(event);
        },
        keyup: function(el, keyCode) {
            var event = $.Event("keyup");
            event.keyCode = event.which = keyCode;
            $(el).trigger(event);
        },
        click: function(el) {
            var event = $.Event("click");
            $(el).trigger(event);
        },
        responseFor: function(suggestions) {
            return [
                200,
                { "Content-type": "application/json" },
                JSON.stringify({
                    suggestions: suggestions
                })
            ];
        },
        hitEnter: function(el) {
            helpers.keydown(el, 13); // code of Enter
        },
        fireBlur: function(el) {
            $(el).trigger($.Event("blur"));
        },
        appendUnrestrictedValue: function(suggestion) {
            return $.extend({}, suggestion, {
                unrestricted_value: suggestion.value
            });
        },
        wrapFormattedValue: function(value, status) {
            return (
                '<span class="suggestions-value"' +
                (status ? ' data-suggestion-status="' + status + '"' : "") +
                ">" +
                value +
                "</span>"
            );
        },
        returnStatus: function(server, status) {
            var urlPattern = "\\/status\\/(\\w)";

            if (server.responses) {
                server.responses = $.grep(server.responses, function(response) {
                    return !response.url || response.url.source !== urlPattern;
                });
            }
            server.respond(
                "GET",
                new RegExp(urlPattern),
                JSON.stringify(status)
            );
        },
        returnGoodStatus: function(server) {
            helpers.returnStatus(server, { search: true, enrich: true });
        },
        returnPoorStatus: function(server) {
            helpers.returnStatus(server, { search: true, enrich: false });
        }
    };
    return helpers;
}.call((typeof window != "undefined" && window) || {});
