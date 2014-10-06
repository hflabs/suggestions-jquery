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
                boundsAvailable = that.type.boundsAvailable,
                newBounds = $.trim(that.options.bounds).split('-'),
                boundFrom = newBounds[0],
                boundTo = newBounds[newBounds.length - 1];

            if ($.inArray(boundFrom, boundsAvailable) === -1) {
                boundFrom = null;
            }
            if ($.inArray(boundTo, boundsAvailable) === -1) {
                boundTo = null;
            }

            that.bounds.from = boundFrom;
            that.bounds.to = boundTo;
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
        }

    };

    $.extend(defaultOptions, optionsUsed);

    initializeHooks.push(methods.setupBounds);

    setOptionsHooks.push(methods.setBoundsOptions);

    requestParamsHooks.push(methods.constructBoundsParams);

})();