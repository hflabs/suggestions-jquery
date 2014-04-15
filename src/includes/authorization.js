    (function(){
        /**
         * Methods related to plugin's authorization on server
         */

        var tokensValid = {};

        var methods = {

            checkToken: function () {
                var that = this,
                    token = $.trim(that.options.token),
                    tokenValid = tokensValid[token],
                    onTokenReady = function () {
                        that.checkToken();
                    },
                    serviceUrl;

                if (token) {
                    if (tokenValid && $.isFunction(tokenValid.promise)) {
                        switch (tokenValid.state()) {
                            case 'resolved':
                                that.enable();
                                break;
                            case 'rejected':
                                that.disable();
                                break;
                            default:
                                tokenValid.always(onTokenReady);
                        }
                    } else {
                        serviceUrl = that.options.serviceUrl;
                        if ($.isFunction(serviceUrl)) {
                            serviceUrl = serviceUrl.call(that.element);
                        }
                        tokensValid[token] = $.ajax(
                            $.extend(that.getAjaxParams(), {
                                url: serviceUrl
                            })
                        ).always(onTokenReady);
                    }
                }
            }

        };

        Suggestions.resetTokens = function () {
            tokensValid = {};
        };

        $.extend(Suggestions.prototype, methods);

        setOptionsHooks.push(methods.checkToken);

    }());