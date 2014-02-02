/**
 * Suggestions-jquery plugin, version 4.1.2
 *
 * Suggestions-jquery plugin is freely distributable under the terms of MIT-style license
 * Depends on Ajax Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)
 * For details, see https://github.com/hflabs/suggestions-jquery
 */
!function(factory) {
    "use strict";
    "function" == typeof define && define.amd ? define([ "jquery" ], factory) : factory(jQuery);
}(function($) {
    "use strict";
    var Autocomplete = $.Autocomplete;
    if (!$.isFunction(Autocomplete)) throw 'Required plugin "jquery.autocomplete" not found';
    var Suggestions = function(el, options) {
        options = $.extend({
            dataType: "jsonp"
        }, options || {}), options.transformResult = function(response) {
            var result = "string" == typeof response ? $.parseJSON(response) : response;
            return result.suggestions || (result.suggestions = []), result;
        }, Autocomplete.call(this, el, options);
    }, keys = {
        ESC: 27,
        TAB: 9,
        RETURN: 13,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };
    Suggestions.prototype = $.extend({}, Autocomplete.prototype, {
        isBadQuery: function() {
            return !1;
        },
        onKeyPress: function(e) {
            var that = this;
            if (!that.disabled && !that.visible && e.which === keys.DOWN && that.currentValue) return void that.suggest();
            if (!that.disabled && that.visible) {
                switch (e.which) {
                  case keys.ESC:
                    that.el.val(that.currentValue), that.hide();
                    break;

                  case keys.RIGHT:
                    if (that.hint && that.options.onHint && that.isCursorAtEnd()) {
                        that.selectHint();
                        break;
                    }
                    return;

                  case keys.TAB:
                    if (that.hint && that.options.onHint) return void that.selectHint();

                  case keys.RETURN:
                    if (-1 === that.selectedIndex) return void that.hide();
                    if (that.select(that.selectedIndex), e.which === keys.TAB && that.options.tabDisabled === !1) return;
                    break;

                  case keys.SPACE:
                    return void that.updateValue(that.selectedIndex);

                  case keys.UP:
                    that.moveUp();
                    break;

                  case keys.DOWN:
                    that.moveDown();
                    break;

                  default:
                    return;
                }
                e.stopImmediatePropagation(), e.preventDefault();
            }
        },
        updateValue: function(i, shouldIgnoreNextValueChange) {
            var that = this, selectedValue = that.suggestions[i];
            selectedValue && (that.el.val(selectedValue), that.ignoreValueChange = shouldIgnoreNextValueChange, 
            that.onSelect(i));
        }
    }), $.fn.suggestions = function(options, args) {
        var dataKey = "suggestions";
        return 0 === arguments.length ? this.first().data(dataKey) : this.each(function() {
            var inputElement = $(this), instance = inputElement.data(dataKey);
            "string" == typeof options ? instance && "function" == typeof instance[options] && instance[options](args) : (instance && instance.dispose && instance.dispose(), 
            instance = new Suggestions(this, options), inputElement.data(dataKey, instance));
        });
    };
});