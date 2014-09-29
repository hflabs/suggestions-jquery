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
        }

    };

    $.extend(defaultOptions, optionsUsed);

    initializeHooks.push(methods.setupBounds);

    setOptionsHooks.push(methods.setBoundsOptions);

    requestParamsHooks.push(methods.constructBoundsParams);

})();