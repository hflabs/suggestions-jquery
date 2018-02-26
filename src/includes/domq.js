/**
 * DOM querying abstractions.
 */
var domq = {
    byClass: function(classname, parent) {
        var selector = '.' + classname;
        if (parent) {
            return parent.querySelector(selector);
        } else {
            return document.querySelector(selector);
        }
    }
};

export { domq };