(function() {
    /**
     * features for connected instances
     */

    var optionsUsed = {
        bounds: null
    };

    var methods = {

        setupBounds: function () {
            this.bounds = {
                from: null,
                to: null
            };
        },

        setBoundsOptions: function () {
            var that = this,
                newBounds = $.trim(that.options.bounds).split('-');

            that.bounds.from = newBounds[0];
            that.bounds.to = newBounds[newBounds.length - 1];
        },

        constructBoundsParams: function () {
            var that = this,
                params = {};

            if (that.bounds.from) {
                params['from_bound'] = { value: that.bounds.from };
            }
            if (that.bounds.to) {
                params['to_bound'] = { value: that.bounds.to };
            }

            return params;
        },

        checkValueBounds: function (suggestion) {
            var that = this,
                value,
                bounds = that.type.boundsAvailable,
                boundedData = {},
                includeBound = !that.bounds.from;

            if ((that.bounds.from || that.bounds.to) && suggestion.data && that.type.composeValue) {
                $.each(bounds, function (i, bound) {
                    if (bound == that.bounds.from) {
                        includeBound = true;
                    }
                    if (includeBound) {
                        boundedData[bound] = suggestion.data[bound];
                        boundedData[bound + '_type'] = suggestion.data[bound + '_type'];
                    }
                    if (bound == that.bounds.to) {
                        return false;
                    }
                });
                value = that.type.composeValue(boundedData);
                if (value) {
                    suggestion.value = value;
                }
            }
        }

    };

    $.extend(defaultOptions, optionsUsed);

    $.extend(Suggestions.prototype, {
        checkValueBounds: methods.checkValueBounds
    });

    initializeHooks.push(methods.setupBounds);

    setOptionsHooks.push(methods.setBoundsOptions);

    requestParamsHooks.push(methods.constructBoundsParams);

})();