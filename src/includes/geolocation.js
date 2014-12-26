    (function() {

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
        }

        var locationRequest;

        var methods = {

            checkLocation: function () {
                var that = this;

                if (!that.type.geoEnabled || that.options.constraints != null) {
                    return;
                }

                if (!locationRequest) {
                    locationRequest = $.ajax(that.getAjaxParams('detectAddressByIp'));
                }

                locationRequest.done(function (resp) {
                    var addr = resp && resp.location && resp.location.data;
                    if (addr && addr.kladr_id) {
                        that.enableGeolocation(addr);
                    }
                });
            },

            enableGeolocation: function(address) {
                var that = this,
                    constraint = that.formatConstraint({
                        deletable: true,
                        locations: address
                    });
                constraint.locations = [ {
                    region: address.region,
                    area: address.area,
                    city: address.city,
                    settlement: address.settlement,
                    kladr_id: address.kladr_id
                } ];
                that.setupConstraints(constraint);
                // strip restricted value from suggestion value when geolocation is on
                that.options.restrict_value = true;
            }

        };

        $.extend(Suggestions.prototype, methods);

        setOptionsHooks.push(methods.checkLocation);

    }());