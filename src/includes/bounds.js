(function() {
    /**
     * features for connected instances
     */

    var optionsUsed = {
        bounds: null
    };

    var KLADR_LENGTH = {
            'region': { digits: 2, zeros: 11 },
            'area': { digits: 5, zeros: 8 },
            'city': { digits: 8, zeros: 5 },
            'settlement': { digits: 11, zeros: 2 },
            'street': { digits: 15, zeros: 2 },
            'house': {digits: 19 }
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
                boundTo = newBounds[newBounds.length - 1],
                boundsOwn = [],
                boundIsOwn,
                boundsAll = [],
                indexTo;

            if ($.inArray(boundFrom, boundsAvailable) === -1) {
                boundFrom = null;
            }

            indexTo = $.inArray(boundTo, boundsAvailable);
            if (indexTo === -1 || indexTo === boundsAvailable.length - 1) {
                boundTo = null;
            }

            if (boundFrom || boundTo) {
                boundIsOwn = !boundFrom;
                $.each(boundsAvailable, function (i, bound) {
                    if (bound == boundFrom) {
                        boundIsOwn = true;
                    }
                    boundsAll.push(bound);
                    if (boundIsOwn) {
                        boundsOwn.push(bound);
                    }
                    if (bound == boundTo) {
                        return false;
                    }
                });
            }

            that.bounds.from = boundFrom;
            that.bounds.to = boundTo;
            that.bounds.all = boundsAll;
            that.bounds.own = boundsOwn;
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
                valueData;

            // If any bounds set up
            if (that.bounds.own.length && that.type.composeValue) {
                valueData = that.copyBoundedData(suggestion.data, that.bounds.own);
                suggestion.value = that.type.composeValue(valueData);
            }
        },

        copyBoundedData: function (data, boundsRange) {
            var result = {},
                boundsFields = this.type.boundsFields;

            if (boundsFields) {
                $.each(boundsRange, function (i, bound) {
                    var fields = boundsFields[bound];

                    if (fields) {
                        $.each(fields, function (i, field) {
                            if (data[field] != null) {
                                result[field] = data[field];
                            }
                        })
                    }
                });
            }

            return result;
        },

        getBoundedKladrId: function (kladr_id, boundsRange) {
            var boundTo = boundsRange[boundsRange.length - 1],
                kladrLength = KLADR_LENGTH[boundTo],
                result = kladr_id.substr(0, kladrLength.digits);

            if (kladrLength.zeros) {
                result += new Array(kladrLength.zeros + 1).join('0');
            }

            return result;
        }

    };

    $.extend(defaultOptions, optionsUsed);

    $.extend($.Suggestions.prototype, methods);

    notificator
        .on('initialize', methods.setupBounds)
        .on('setOptions', methods.setBoundsOptions)
        .on('requestParams', methods.constructBoundsParams);

})();