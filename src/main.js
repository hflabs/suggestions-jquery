import $ from "jquery";

import { Suggestions } from "./includes/suggestions";

import {} from "./includes/element";
import {} from "./includes/status";
import {} from "./includes/geolocation";
import {} from "./includes/enrich";
import {} from "./includes/container";
import {} from "./includes/constraints";
import {} from "./includes/select";
import {} from "./includes/bounds";
import {} from "./includes/promo";

import { DATA_ATTR_KEY } from "./includes/constants";
import { DEFAULT_OPTIONS } from "./includes/default-options";

Suggestions.defaultOptions = DEFAULT_OPTIONS;

Suggestions.version = "%VERSION%";

$.Suggestions = Suggestions;

// Create chainable jQuery plugin:
$.fn.suggestions = function(options, args) {
    // If function invoked without argument return
    // instance of the first matched element:
    if (arguments.length === 0) {
        return this.first().data(DATA_ATTR_KEY);
    }

    return this.each(function() {
        var inputElement = $(this),
            instance = inputElement.data(DATA_ATTR_KEY);

        if (typeof options === "string") {
            if (instance && typeof instance[options] === "function") {
                instance[options](args);
            }
        } else {
            // If instance already exists, destroy it:
            if (instance && instance.dispose) {
                instance.dispose();
            }
            instance = new Suggestions(this, options);
            inputElement.data(DATA_ATTR_KEY, instance);
        }
    });
};
