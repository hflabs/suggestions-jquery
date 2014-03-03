this.helpers = (function () {

    var helpers = {
        keydown: function(el, keyCode) {
            var event = $.Event('keydown');
            event.keyCode = event.which = keyCode;
            $(el).trigger(event);
        }
    };
    return helpers;
}.call(typeof window != 'undefined' && window || {}));