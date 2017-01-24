import $ from 'jquery';

import { notificator } from './notificator';
import { Suggestions } from './suggestions';

/**
 * Methods related to plugin's authorization on server
 */

// keys are "[type][token]"
var statusRequests = {};

function resetTokens () {
    $.each(statusRequests, function(){
        this.abort();
    });
    statusRequests = {};
}

resetTokens();

var methods = {

    checkStatus: function () {
        var that = this,
            token = $.trim(that.options.token),
            requestKey = that.options.type + token,
            request = statusRequests[requestKey];

        if (!request) {
            request = statusRequests[requestKey] = $.ajax(that.getAjaxParams('status'));
        }

        request
            .done(function(status){
                if (status.search) {
                    $.extend(that.status, status);
                } else {
                    triggerError('Service Unavailable');
                }
            })
            .fail(function(){
                triggerError(request.statusText);
            });

        function triggerError(errorThrown){
            // If unauthorized
            if ($.isFunction(that.options.onSearchError)) {
                that.options.onSearchError.call(that.element, null, request, 'error', errorThrown);
            }
        }
    }

};

Suggestions.resetTokens = resetTokens;

$.extend(Suggestions.prototype, methods);

notificator
    .on('setOptions', methods.checkStatus);

//export { methods, resetTokens };