this.helpers = (function () {

    var helpers = {
        keydown: function(el, keyCode) {
            var event = $.Event('keydown');
            event.keyCode = event.which = keyCode;
            $(el).trigger(event);
        },
        hitEnter: function(el) {
            helpers.keydown(el, 13); // code of Enter
        }
    };
    return helpers;
}.call(typeof window != 'undefined' && window || {}));