this.helpers = (function () {

    var helpers = {
        keydown: function(el, keyCode) {
            var event = $.Event('keydown');
            event.keyCode = event.which = keyCode;
            $(el).trigger(event);
        },
        responseFor: function(suggestions) {
            return [
                200,
                {'Content-type': 'application/json'},
                JSON.stringify({
                    suggestions: suggestions
                })
            ];
        },
        hitEnter: function(el) {
            helpers.keydown(el, 13); // code of Enter
        },
        fireBlur: function(el) {
            $(el).trigger($.Event('blur'))
        }
    };
    return helpers;
}.call(typeof window != 'undefined' && window || {}));