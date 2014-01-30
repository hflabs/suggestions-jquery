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

        Autocomplete.call(this, el, options);
    };

    Suggestions.prototype = $.extend({}, Autocomplete.prototype, {
        
        /**
         * All queries consider to be valid, to aviod getting suggessions from cache.
         * @override
         */
        isBadQuery: function (q) {
            return false;
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