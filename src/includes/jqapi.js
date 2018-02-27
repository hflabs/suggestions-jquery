import $ from 'jquery';


/**
 * jQuery API.
 */
var jqapi = {

    Deferred: function() {
        return $.Deferred();
    },

    ajax: function(settings) {
        return $.ajax(settings);
    },

    extend: function() {
        return $.extend.apply(null, arguments);
    },

    param: function(obj) {
        return $.param(obj);
    },

    proxy: function(func, context) {
        return $.proxy(func, context);
    },

    supportsCors: function() {
        return $.support.cors;
    }
}

export { jqapi };