import { jqapi } from "./jqapi";
import { notificator } from "./notificator";
import { utils } from "./utils";
import { Suggestions } from "./suggestions";

/**
 * Methods related to plugin's authorization on server
 */

// keys are "[type][token]"
var statusRequests = {};

function resetTokens() {
    utils.each(statusRequests, function(req) {
        req.abort();
    });
    statusRequests = {};
}

resetTokens();

var methods = {
    checkStatus: function() {
        var that = this,
            token = (that.options.token && that.options.token.trim()) || "",
            requestKey = that.options.type + token,
            request = statusRequests[requestKey];

        if (!request) {
            request = statusRequests[requestKey] = jqapi.ajax(
                that.getAjaxParams("status")
            );
        }

        request
            .done(function(status, textStatus, request) {
                if (status.search) {
                    var plan = request.getResponseHeader("X-Plan");
                    status.plan = plan;
                    jqapi.extend(that.status, status);
                } else {
                    triggerError("Service Unavailable");
                }
            })
            .fail(function() {
                triggerError(request.statusText);
            });

        function triggerError(errorThrown) {
            // If unauthorized
            if (utils.isFunction(that.options.onSearchError)) {
                that.options.onSearchError.call(
                    that.element,
                    null,
                    request,
                    "error",
                    errorThrown
                );
            }
        }
    }
};

Suggestions.resetTokens = resetTokens;

jqapi.extend(Suggestions.prototype, methods);

notificator.on("setOptions", methods.checkStatus);

//export { methods, resetTokens };
