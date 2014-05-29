    (function() {

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
                        var constraint = that.formatConstraint({
                            deletable: true,
                            restrictions: addr
                        });
                        constraint.restrictions = [ { kladr_id: addr.kladr_id } ];
                        that.setupConstraints(constraint);
                    }
                });
            }

        };

        $.extend(Suggestions.prototype, methods);

        setOptionsHooks.push(methods.checkLocation);

    }());