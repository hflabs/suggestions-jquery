import $ from 'jquery';

import { utils } from './utils';
import { types } from './types';
import { CLASSES, DATA_ATTR_KEY, EVENT_NS } from './constants';
import { DEFAULT_OPTIONS } from './default-options';
import { notificator } from './notificator';

var serviceMethods = {
    'suggest': {
        defaultParams: {
            type: utils.getDefaultType(),
            dataType: 'json',
            contentType: utils.getDefaultContentType()
        },
        addTypeInUrl: true
    },
    'detectAddressByIp': {
        defaultParams: {
            type: 'GET',
            dataType: 'json'
        },
        addTypeInUrl: false
    },
    'status': {
        defaultParams: {
            type: 'GET',
            dataType: 'json'
        },
        addTypeInUrl: true
    },
    'findById': {
        defaultParams: {
            type: utils.getDefaultType(),
            dataType: 'json',
            contentType: utils.getDefaultContentType()
        },
        addTypeInUrl: true
    }
};

var requestModes = {
    'suggest': {
        method: 'suggest',
        userSelect: true,
        updateValue: true,
        enrichmentEnabled: true
    },
    'findById': {
        method: 'findById',
        userSelect: false,
        updateValue: false,
        enrichmentEnabled: false
    }
};

function Suggestions(el, options) {
    var that = this;

    // Shared variables:
    that.element = el;
    that.el = $(el);
    that.suggestions = [];
    that.badQueries = [];
    that.selectedIndex = -1;
    that.currentValue = that.element.value;
    that.intervalId = 0;
    that.cachedResponse = {};
    that.enrichmentCache = {};
    that.currentRequest = null;
    that.inputPhase = $.Deferred();
    that.fetchPhase = $.Deferred();
    that.enrichPhase = $.Deferred();
    that.onChangeTimeout = null;
    that.triggering = {};
    that.$wrapper = null;
    that.options = $.extend({}, DEFAULT_OPTIONS, options);
    that.classes = CLASSES;
    that.disabled = false;
    that.selection = null;
    that.$viewport = $(window);
    that.$body = $(document.body);
    that.type = null;
    that.status = {};

    that.setupElement();

    that.initializer = $.Deferred();

    if (that.el.is(':visible')) {
        that.initializer.resolve();
    } else {
        that.deferInitialization();
    }

    that.initializer.done($.proxy(that.initialize, that));
}

Suggestions.prototype = {

    // Creation and destruction

    initialize: function () {
        var that = this;

        that.uniqueId = utils.uniqueId('i');

        that.createWrapper();
        that.notify('initialize');

        that.bindWindowEvents();

        that.setOptions();
        that.fixPosition();
    },

    /**
     * Initialize when element is firstly interacted
     */
    deferInitialization: function () {
        var that = this,
            events = 'mouseover focus keydown',
            timer,
            callback = function () {
                that.initializer.resolve();
                that.enable();
            };

        that.initializer.always(function(){
            that.el.off(events, callback);
            clearInterval(timer);
        });

        that.disabled = true;
        that.el.on(events, callback);
        timer = setInterval(function(){
            if (that.el.is(':visible')) {
                callback();
            }
        }, that.options.initializeInterval);
    },

    isInitialized: function () {
        return this.initializer.state() === 'resolved';
    },

    dispose: function () {
        var that = this;

        that.initializer.reject();
        that.notify('dispose');
        that.el.removeData(DATA_ATTR_KEY)
            .removeClass('suggestions-input');
        that.unbindWindowEvents();
        that.removeWrapper();
        that.el.trigger('suggestions-dispose');
    },

    notify: function (chainName) {
        var that = this,
            args = utils.slice(arguments, 1);

        return $.map(notificator.get(chainName), function (method) {
            return method.apply(that, args);
        });
    },

    createWrapper: function () {
        var that = this;

        that.$wrapper = $('<div class="suggestions-wrapper"/>');
        that.el.after(that.$wrapper);

        that.$wrapper.on('mousedown' + EVENT_NS, $.proxy(that.onMousedown, that));
    },

    removeWrapper: function () {
        var that = this;

        if (that.$wrapper) {
            that.$wrapper.remove();
        }
        $(that.options.$helpers).off(EVENT_NS);
    },

    /** This whole handler is needed to prevent blur event on textbox
     * when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
     * See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
     */
    onMousedown: function (e) {
        var that = this;

        // prevent moving focus out of the text field
        e.preventDefault();

        // IE doesn't prevent moving focus even with e.preventDefault()
        // so we set a flag to know when we should ignore the blur event
        that.cancelBlur = true;
        utils.delay(function () {
            delete that.cancelBlur;
        });

        // clicking on the scrollbar causes focus to shift to the body
        // but we can't detect a mouseup or a click immediately afterward
        // so we have to track the next mousedown and close the menu if
        // the user clicks somewhere outside of the autocomplete
        if ($(e.target).closest(".ui-menu-item").length == 0) {
            utils.delay(function () {
                $(document).one("mousedown", function (e) {
                    var $elements = that.el
                        .add(that.$wrapper)
                        .add(that.options.$helpers);

                    if (that.options.floating) {
                        $elements = $elements.add(that.$container);
                    }

                    $elements = $elements.filter(function () {
                        return this === e.target || $.contains(this, e.target);
                    });

                    if (!$elements.length) {
                        that.hide();
                    }
                });
            });
        }
    },

    bindWindowEvents: function () {
        var that = this,
            handler = $.proxy(that.fixPosition, that);

        that.$viewport
            .on('resize' + EVENT_NS + that.uniqueId, handler)
            .on('scroll' + EVENT_NS + that.uniqueId, handler);
    },

    unbindWindowEvents: function () {
        this.$viewport
            .off('resize' + EVENT_NS + this.uniqueId)
            .off('scroll' + EVENT_NS + this.uniqueId);
    },

    scrollToTop: function () {
        var that = this,
            scrollTarget = that.options.scrollOnFocus;

        if (scrollTarget === true) {
            scrollTarget = that.el;
        }
        if (scrollTarget instanceof $ && scrollTarget.length > 0) {
            $('body,html').animate({
                scrollTop: scrollTarget.offset().top
            }, 'fast');
        }
    },

    // Configuration methods

    setOptions: function (suppliedOptions) {
        var that = this;

        $.extend(that.options, suppliedOptions);

        that['type'] = types.get(that.options['type']);

        // Check mandatory options
        $.each({
            'requestMode': requestModes
        }, function (option, available) {
            that[option] = available[that.options[option]];
            if (!that[option]) {
                that.disable();
                throw '`' + option + '` option is incorrect! Must be one of: ' + $.map(available, function (value, name) {
                    return '"' + name + '"';
                }).join(', ');
            }
        });

        $(that.options.$helpers)
            .off(EVENT_NS)
            .on('mousedown' + EVENT_NS, $.proxy(that.onMousedown, that));

        if (that.isInitialized()) {
            that.notify('setOptions');
        }
    },

    // Common public methods

    fixPosition: function (e) {
        var that = this,
            elLayout = {},
            wrapperOffset,
            origin;

        that.isMobile = that.$viewport.width() <= that.options.mobileWidth;

        if (!that.isInitialized() || (e && e.type == 'scroll' && !(that.options.floating || that.isMobile))) return;
        that.$container.appendTo(that.options.floating ? that.$body : that.$wrapper);

        that.notify('resetPosition');
        // reset input's padding to default, determined by css
        that.el.css('paddingLeft', '');
        that.el.css('paddingRight', '');
        elLayout.paddingLeft = parseFloat(that.el.css('paddingLeft'));
        elLayout.paddingRight = parseFloat(that.el.css('paddingRight'));

        $.extend(elLayout, that.el.offset());
        elLayout.borderTop = that.el.css('border-top-style') == 'none' ? 0 : parseFloat(that.el.css('border-top-width'));
        elLayout.borderLeft = that.el.css('border-left-style') == 'none' ? 0 : parseFloat(that.el.css('border-left-width'));
        elLayout.innerHeight = that.el.innerHeight();
        elLayout.innerWidth = that.el.innerWidth();
        elLayout.outerHeight = that.el.outerHeight();
        elLayout.componentsLeft = 0;
        elLayout.componentsRight = 0;
        wrapperOffset = that.$wrapper.offset();

        origin = {
            top: elLayout.top - wrapperOffset.top,
            left: elLayout.left - wrapperOffset.left
        };

        that.notify('fixPosition', origin, elLayout);

        if (elLayout.componentsLeft > elLayout.paddingLeft) {
            that.el.css('paddingLeft', elLayout.componentsLeft + 'px');
        }
        if (elLayout.componentsRight > elLayout.paddingRight) {
            that.el.css('paddingRight', elLayout.componentsRight + 'px');
        }
    },

    clearCache: function () {
        this.cachedResponse = {};
        this.enrichmentCache = {};
        this.badQueries = [];
    },

    clear: function () {
        var that = this,
            currentSelection = that.selection;

        if (that.isInitialized()) {
            that.clearCache();
            that.currentValue = '';
            that.selection = null;
            that.hide();
            that.suggestions = [];
            that.el.val('');
            that.el.trigger('suggestions-clear');
            that.notify('clear');
            that.trigger('InvalidateSelection', currentSelection);
        }
    },

    disable: function () {
        var that = this;

        that.disabled = true;
        that.abortRequest();
        if (that.visible) {
            that.hide();
        }
    },

    enable: function () {
        this.disabled = false;
    },

    isUnavailable: function () {
        return this.disabled;
    },

    update: function () {
        var that = this,
            query = that.el.val();

        if (that.isInitialized()) {
            that.currentValue = query;
            if (that.isQueryRequestable(query)) {
                that.updateSuggestions(query);
            } else {
                that.hide();
            }
        }
    },

    setSuggestion: function (suggestion) {
        var that = this,
            data,
            value;

        if ($.isPlainObject(suggestion) && $.isPlainObject(suggestion.data)) {
            suggestion = $.extend(true, {}, suggestion);

            if (that.isUnavailable() && that.initializer && that.initializer.state() === 'pending') {
                that.initializer.resolve();
                that.enable();
            }

            if (that.bounds.own.length) {
                that.checkValueBounds(suggestion);
                data = that.copyDataComponents(suggestion.data, that.bounds.all);
                if (suggestion.data.kladr_id) {
                    data.kladr_id = that.getBoundedKladrId(suggestion.data.kladr_id, that.bounds.all);
                }
                suggestion.data = data;
            }

            that.selection = suggestion;

            // `that.suggestions` required by `that.getSuggestionValue` and must be set before
            that.suggestions = [suggestion];
            value = that.getSuggestionValue(suggestion) || '';
            that.currentValue = value;
            that.el.val(value);
            that.abortRequest();
            that.el.trigger('suggestions-set');
        }
    },

    /**
     * Fetch full object for current INPUT's value
     * if no suitable object found, clean input element
     */
    fixData: function () {
        var that = this,
            fullQuery = that.extendedCurrentValue(),
            currentValue = that.el.val(),
            resolver = $.Deferred();

        resolver
            .done(function (suggestion) {
                that.selectSuggestion(suggestion, 0, currentValue, { hasBeenEnriched: true });
                that.el.trigger('suggestions-fixdata', suggestion);
            })
            .fail(function () {
                that.selection = null;
                that.el.trigger('suggestions-fixdata');
            });

        if (that.isQueryRequestable(fullQuery)) {
            that.currentValue = fullQuery;
            that.getSuggestions(fullQuery, { count: 1, from_bound: null, to_bound: null })
                .done(function (suggestions) {
                    // data fetched
                    var suggestion = suggestions[0];
                    if (suggestion) {
                        resolver.resolve(suggestion);
                    } else {
                        resolver.reject();
                    }
                })
                .fail(function () {
                    // no data fetched
                    resolver.reject();
                });
        } else {
            resolver.reject();
        }
    },

    // Querying related methods

    /**
     * Looks up parent instances
     * @returns {String} current value prepended by parents' values
     */
    extendedCurrentValue: function () {
        var that = this,
            parentInstance = that.getParentInstance(),
            parentValue = parentInstance && parentInstance.extendedCurrentValue(),
            currentValue = $.trim(that.el.val());

        return utils.compact([parentValue, currentValue]).join(' ');
    },

    getAjaxParams: function (method, custom) {
        var that = this,
            token = $.trim(that.options.token),
            partner = $.trim(that.options.partner),
            serviceUrl = that.options.serviceUrl,
            url = that.options.url,
            serviceMethod = serviceMethods[method],
            params = $.extend({
                timeout: that.options.timeout
            }, serviceMethod.defaultParams),
            headers = {};

        if (url) {
            serviceUrl = url;
        } else {
            if (!/\/$/.test(serviceUrl)) {
                serviceUrl += '/';
            }
            serviceUrl += method;
            if (serviceMethod.addTypeInUrl) {
                serviceUrl += '/' + that.type.urlSuffix;
            }
        }

        serviceUrl = utils.fixURLProtocol(serviceUrl);

        if ($.support.cors) {
            // for XMLHttpRequest put token in header
            if (token) {
                headers['Authorization'] = 'Token ' + token;
            }
            if (partner) {
                headers['X-Partner'] = partner;
            }
            headers['X-Version'] = Suggestions.version;
            if (!params.headers) {
                params.headers = {};
            }
            if (!params.xhrFields) {
                params.xhrFields = {};
            }
            $.extend(params.headers, that.options.headers, headers);
            // server sets Access-Control-Allow-Origin: *
            // which requires no credentials
            params.xhrFields.withCredentials = false;

        } else {
            // for XDomainRequest put token into URL
            if (token) {
                headers['token'] = token;
            }
            if (partner) {
                headers['partner'] = partner;
            }
            headers['version'] = Suggestions.version;
            serviceUrl = utils.addUrlParams(serviceUrl, headers);
        }

        params.url = serviceUrl;

        return $.extend(params, custom);
    },

    isQueryRequestable: function (query) {
        var that = this,
            result;

        result = query.length >= that.options.minChars;

        if (result && that.type.isQueryRequestable) {
            result = that.type.isQueryRequestable.call(that, query);
        }

        return result;
    },

    constructRequestParams: function (query, customParams) {
        var that = this,
            options = that.options,
            params = $.isFunction(options.params)
                ? options.params.call(that.element, query)
                : $.extend({}, options.params);

        if (that.type.constructRequestParams) {
            $.extend(params, that.type.constructRequestParams.call(that));
        }
        $.each(that.notify('requestParams'), function (i, hookParams) {
            $.extend(params, hookParams);
        });
        params[options.paramName] = query;
        if ($.isNumeric(options.count) && options.count > 0) {
            params.count = options.count;
        }

        return $.extend(params, customParams);
    },

    updateSuggestions: function (query) {
        var that = this;

        that.fetchPhase = that.getSuggestions(query)
            .done(function (suggestions) {
                that.assignSuggestions(suggestions, query);
            });
    },

    /**
     * Get suggestions from cache or from server
     * @param {String} query
     * @param {Object} customParams parameters specified here will be passed to request body
     * @param {Object} requestOptions
     * @param {Boolean} [requestOptions.noCallbacks]  flag, request competence callbacks will not be invoked
     * @param {Boolean} [requestOptions.useEnrichmentCache]
     * @return {$.Deferred} waiter which is to be resolved with suggestions as argument
     */
    getSuggestions: function (query, customParams, requestOptions) {
        var response,
            that = this,
            options = that.options,
            noCallbacks = requestOptions && requestOptions.noCallbacks,
            useEnrichmentCache = requestOptions && requestOptions.useEnrichmentCache,
            method = requestOptions && requestOptions.method || that.requestMode.method,
            params = that.constructRequestParams(query, customParams),
            cacheKey = $.param(params || {}),
            resolver = $.Deferred();

        response = that.cachedResponse[cacheKey];
        if (response && $.isArray(response.suggestions)) {
            resolver.resolve(response.suggestions);
        } else {
            if (that.isBadQuery(query)) {
                resolver.reject();
            } else {
                if (!noCallbacks && options.onSearchStart.call(that.element, params) === false) {
                    resolver.reject();
                } else {
                    that.doGetSuggestions(params, method)
                        .done(function (response) {
                            // if response is correct and current value has not been changed
                            if (that.processResponse(response) && query == that.currentValue) {

                                // Cache results if cache is not disabled:
                                if (!options.noCache) {
                                    if (useEnrichmentCache) {
                                        that.enrichmentCache[query] = response.suggestions[0];
                                    } else {
                                        that.enrichResponse(response, query);
                                        that.cachedResponse[cacheKey] = response;
                                        if (options.preventBadQueries && response.suggestions.length === 0) {
                                            that.badQueries.push(query);
                                        }
                                    }
                                }

                                resolver.resolve(response.suggestions);
                            } else {
                                resolver.reject();
                            }
                            if (!noCallbacks) {
                                options.onSearchComplete.call(that.element, query, response.suggestions);
                            }
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                        resolver.reject();
                        if (!noCallbacks && textStatus !== 'abort') {
                            options.onSearchError.call(that.element, query, jqXHR, textStatus, errorThrown);
                        }
                    });
                }
            }
        }
        return resolver;
    },

    /**
     * Sends an AJAX request to server suggest method.
     * @param {Object} params request params
     * @returns {$.Deferred} response promise
     */
    doGetSuggestions: function (params, method) {
        var that = this,
            request = $.ajax(
                that.getAjaxParams(method, { data: utils.serialize(params) })
            );

        that.abortRequest();
        that.currentRequest = request;
        that.notify('request');

        request.always(function () {
            that.currentRequest = null;
            that.notify('request');
        });

        return request;
    },

    isBadQuery: function (q) {
        if (!this.options.preventBadQueries) {
            return false;
        }

        var result = false;
        $.each(this.badQueries, function (i, query) {
            return !(result = q.indexOf(query) === 0);
        });
        return result;
    },

    abortRequest: function () {
        var that = this;

        if (that.currentRequest) {
            that.currentRequest.abort();
        }
    },

    /**
     * Checks response format and data
     * @return {Boolean} response contains acceptable data
     */
    processResponse: function (response) {
        var that = this,
            suggestions;

        if (!response || !$.isArray(response.suggestions)) {
            return false;
        }

        that.verifySuggestionsFormat(response.suggestions);
        that.setUnrestrictedValues(response.suggestions);

        if ($.isFunction(that.options.onSuggestionsFetch)) {
            suggestions = that.options.onSuggestionsFetch.call(that.element, response.suggestions);
            if ($.isArray(suggestions)) {
                response.suggestions = suggestions;
            }
        }

        return true;
    },

    verifySuggestionsFormat: function (suggestions) {
        if (typeof suggestions[0] === 'string') {
            $.each(suggestions, function (i, value) {
                suggestions[i] = { value: value, data: null };
            });
        }
    },

    /**
     * Gets string to set as input value
     *
     * @param suggestion
     * @param {Object} [selectionOptions]
     * @param {boolean} selectionOptions.hasBeenEnriched
     * @param {boolean} selectionOptions.hasSameValues
     * @return {string}
     */
    getSuggestionValue: function (suggestion, selectionOptions) {
        var that = this,
            formatSelected = that.options.formatSelected || that.type.formatSelected,
            hasSameValues = selectionOptions && selectionOptions.hasSameValues,
            hasBeenEnriched = selectionOptions && selectionOptions.hasBeenEnriched,
            formattedValue,
            typeFormattedValue = null;


        if ($.isFunction(formatSelected)) {
            formattedValue = formatSelected.call(that, suggestion);
        }

        if (typeof formattedValue !== 'string') {
            formattedValue = suggestion.value;

            if (that.type.getSuggestionValue) {
                typeFormattedValue = that.type.getSuggestionValue(that, {
                    suggestion: suggestion,
                    hasSameValues: hasSameValues,
                    hasBeenEnriched: hasBeenEnriched,
                });

                if (typeFormattedValue !== null) {
                    formattedValue = typeFormattedValue;
                }
            }
        }

        return formattedValue;
    },

    hasSameValues: function(suggestion){
        var hasSame = false;

        $.each(this.suggestions, function(i, anotherSuggestion){
            if (anotherSuggestion.value === suggestion.value && anotherSuggestion !== suggestion) {
                hasSame = true;
                return false;
            }
        });

        return hasSame;
    },

    assignSuggestions: function (suggestions, query) {
        var that = this;
        that.suggestions = suggestions;
        that.notify('assignSuggestions', query);
    },

    shouldRestrictValues: function () {
        var that = this;
        // treat suggestions value as restricted only if there is one constraint
        // and restrict_value is true
        return that.options.restrict_value
            && that.constraints
            && Object.keys(that.constraints).length == 1;
    },

    /**
     * Fills suggestion.unrestricted_value property
     */
    setUnrestrictedValues: function (suggestions) {
        var that = this,
            shouldRestrict = that.shouldRestrictValues(),
            label = that.getFirstConstraintLabel();

        $.each(suggestions, function (i, suggestion) {
            if (!suggestion.unrestricted_value) {
                suggestion.unrestricted_value = shouldRestrict ? label + ', ' + suggestion.value : suggestion.value;
            }
        });
    },

    areSuggestionsSame: function (a, b) {
        return a && b &&
            a.value === b.value &&
            utils.areSame(a.data, b.data);
    },

    getNoSuggestionsHint: function () {
        var that = this;
        if (that.options.noSuggestionsHint === false) {
            return false;
        }
        return that.options.noSuggestionsHint || that.type.noSuggestionsHint;
    }

};

export { Suggestions };
