    (function(){
        /**
         * Methods related to plugin's authorization on server
         */

        // Two-dimensional hash [type][token]
        var tokenRequests = {};

        function resetTokens () {
            $.each(types, function(typeName){
                tokenRequests[typeName] = {};
            });
        }
        resetTokens();

        var methods = {

            checkToken: function () {
                var that = this,
                    token = $.trim(that.options.token),
                    requestsOfType = tokenRequests[that.options.type],
                    tokenRequest = requestsOfType[token];

                function onTokenReady() {
                    that.checkToken();
                }

                if (token) {
                    if (tokenRequest && $.isFunction(tokenRequest.promise)) {
                        switch (tokenRequest.state()) {
                            case 'resolved':
                                break;
                            case 'rejected':
                                if ($.isFunction(that.options.onSearchError)) {
                                    that.options.onSearchError.call(that.element, null, tokenRequest, 'error', tokenRequest.statusText);
                                }
                                break;
                            default:
                                tokenRequest.always(onTokenReady);
                        }
                    } else {
                        (requestsOfType[token] = $.ajax(that.getAjaxParams('suggest')))
                            .always(onTokenReady);
                    }
                }
            }

        };

        Suggestions.resetTokens = resetTokens;

        $.extend(Suggestions.prototype, methods);

        notificator
            .on('setOptions', methods.checkToken);

    }());