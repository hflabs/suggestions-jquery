/**
*  Suggestions-jquery plugin, version 4.1
*  (c) 2014 hflabs.ru
*
*  Suggestions-jquery is freely distributable under the terms of an MIT-style license.
*  Depends on Ajax Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)
*  For details, see the web site: https://github.com/hflabs/suggestions-jquery
*
*/

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    'use strict';
    
    var Autocomplete = $.Autocomplete;
    
    if (!$.isFunction(Autocomplete)) {
        throw 'Required plugin "jquery.autocomplete" not found';
    }

    var Suggestions = function(el, options) {
        
        options = $.extend({
            dataType: 'jsonp'
        }, options || {});
        
        options.transformResult = function (response) {
            var result = typeof response === 'string' ? $.parseJSON(response) : response;
            if (!result.suggestions) {
                result.suggestions = [];
            }
            return result;
        };

        Autocomplete.call(this, el, options);
    };

    var keys = {
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
        
        /**
         * All queries consider to be valid, to aviod getting suggessions from cache.
         * @override
         */
        isBadQuery: function (q) {
            return false;
        },
        
        onKeyPress: function (e) {
            var that = this;

            // If suggestions are hidden and user presses arrow down, display suggestions:
            if (!that.disabled && !that.visible && e.which === keys.DOWN && that.currentValue) {
                that.suggest();
                return;
            }

            if (that.disabled || !that.visible) {
                return;
            }

            switch (e.which) {
                case keys.ESC:
                    that.el.val(that.currentValue);
                    that.hide();
                    break;
                case keys.RIGHT:
                    if (that.hint && that.options.onHint && that.isCursorAtEnd()) {
                        that.selectHint();
                        break;
                    }
                    return;
                case keys.TAB:
                    if (that.hint && that.options.onHint) {
                        that.selectHint();
                        return;
                    }
                    // Fall through to RETURN
                case keys.RETURN:
                    if (that.selectedIndex === -1) {
                        that.hide();
                        return;
                    }
                    that.select(that.selectedIndex);
                    if (e.which === keys.TAB && that.options.tabDisabled === false) {
                        return;
                    }
                    break;
                case keys.SPACE:
                    that.updateValue(that.selectedIndex);
                    return;
                case keys.UP:
                    that.moveUp();
                    break;
                case keys.DOWN:
                    that.moveDown();
                    break;
                default:
                    return;
            }

            // Cancel event if function did not return:
            e.stopImmediatePropagation();
            e.preventDefault();
        },

        /**
         * Selects value and continues selecting
         */
        updateValue: function(i, shouldIgnoreNextValueChange){
            var that = this,
                selectedValue = that.suggestions[i];

            if (selectedValue) {
                that.el.val(selectedValue);
                that.ignoreValueChange = shouldIgnoreNextValueChange;
                that.onSelect(i);
            }
        }
        
    });
    
    $.fn.suggestions = function(options, args){
        
        var dataKey = 'suggestions';

        if (arguments.length === 0) {
            return this.first().data(dataKey);
        }

        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);

            if (typeof options === 'string') {
                if (instance && typeof instance[options] === 'function') {
                    instance[options](args);
                }
            } else {
                // If instance already exists, destroy it:
                if (instance && instance.dispose) {
                    instance.dispose();
                }
                instance = new Suggestions(this, options);
                inputElement.data(dataKey, instance);
            }
        });

    };
    
}));