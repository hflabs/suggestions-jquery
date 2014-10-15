    (function(){
        /**
         * Methods related to plugin's authorization on server
         */

        var tokenRequests = {};

        var methods = {

            checkToken: function () {
                var that = this,
                    token = $.trim(that.options.token),
                    tokenRequest = tokenRequests[token];

                function onTokenReady() {
                    that.checkToken();
                }

                if (token) {
                    if (tokenRequest && $.isFunction(tokenRequest.promise)) {
                        switch (tokenRequest.state()) {
                            case 'resolved':
                                that.enable();
                                break;
                            case 'rejected':
                                that.disable();
                                break;
                            default:
                                tokenRequest.always(onTokenReady);
                        }
                    } else {
                        (tokenRequests[token] = $.ajax(that.getAjaxParams('suggest')))
                            .always(onTokenReady);
                    }
                }
            }

        };

        Suggestions.resetTokens = function () {
            tokenRequests = {};
        };

        $.extend(Suggestions.prototype, methods);

        notificator
            .on('setOptions', methods.checkToken);

    }());