//import * as $ from 'jquery';
var $ = {};

import { utils } from './includes/utils';
import { Suggestions } from './includes/suggestions';
//import matchers from './includes/matchers';
import types from './includes/types';

import notificator from './includes/notificator';

import { methods as elementMethods } from './includes/element';
import { methods as statusMethods, resetTokens } from './includes/status';
import geolocation from './includes/geolocation';
import enrich from './includes/enrich';
import container from './includes/container';
import addon from './includes/addon';
import constraints from './includes/constraints';
import select from './includes/select';
import bounds from './includes/bounds';

var
    keys = {
        ENTER: 13,
        ESC:   27,
        TAB:   9,
        SPACE: 32,
        UP:    38,
        DOWN:  40
    },
    //types = {},
    eventNS = '.suggestions',
    dataAttrKey = 'suggestions',
    wordDelimiters = '\\s"\'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№',
    wordSplitter = new RegExp('[' + wordDelimiters + ']+', 'g'),
    wordPartsDelimiters = '\\-\\+\\/\\\\\\?!@#$%^&',
    wordPartsSplitter = new RegExp('[' + wordPartsDelimiters + ']+', 'g');
    /*defaultOptions = {
        autoSelectFirst: false,
        serviceUrl: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
        onSearchStart: $.noop,
        onSearchComplete: $.noop,
        onSearchError: $.noop,
        onSuggestionsFetch: null,
        onSelect: null,
        onSelectNothing: null,
        onInvalidateSelection: null,
        minChars: 1,
        deferRequestBy: 100,
        params: {},
        paramName: 'query',
        timeout: 3000,
        formatResult: null,
        formatSelected: null,
        noCache: false,
        containerClass: 'suggestions-suggestions',
        tabDisabled: false,
        triggerSelectOnSpace: false,
        triggerSelectOnEnter: true,
        triggerSelectOnBlur: true,
        preventBadQueries: false,
        hint: 'Выберите вариант или продолжите ввод',
        type: null,
        requestMode: 'suggest',
        count: 5,
        $helpers: null,
        headers: null,
        scrollOnFocus: true,
        mobileWidth: 980,
        initializeInterval: 100
    };*/



//include "utils.js"

//include "matchers.js"

//include "types.js"

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

/*function Suggestions(el, options) {
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
    that.options = $.extend({}, defaultOptions, options);
    that.classes = {
        hint: 'suggestions-hint',
        mobile: 'suggestions-mobile',
        nowrap: 'suggestions-nowrap',
        selected: 'suggestions-selected',
        suggestion: 'suggestions-suggestion',
        subtext: 'suggestions-subtext',
        subtext_inline: 'suggestions-subtext suggestions-subtext_inline',
        subtext_delimiter: 'suggestions-subtext-delimiter',
        subtext_label: 'suggestions-subtext suggestions-subtext_label',
        removeConstraint: 'suggestions-remove',
        value: 'suggestions-value'
    };
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
}*/

//Suggestions.utils = utils;

//Suggestions.defaultOptions = defaultOptions;

Suggestions.version = '%VERSION%';

$.Suggestions = Suggestions;

//include "element.js"
//$.extend(Suggestions.prototype, elementMethods);

//include "status.js"
//Suggestions.resetTokens = resetTokens;
//$.extend(Suggestions.prototype, statusMethods);

//include "geolocation.js"
//$.extend(defaultOptions, {
//    geoLocation: defaultGeoLocation
//});

//$.extend(Suggestions, {
//    resetLocation: resetLocation
//});

//$.extend(Suggestions.prototype, {
//    getGeoLocation: methods.getGeoLocation
//});

//include "enrich.js"

//include "container.js"

//include "addon.js"

//include "constraints.js"

//include "select.js"

//include "bounds.js"

// Create chainable jQuery plugin:
$.fn.suggestions = function (options, args) {
    // If function invoked without argument return
    // instance of the first matched element:
    if (arguments.length === 0) {
        return this.first().data(dataAttrKey);
    }

    return this.each(function () {
        var inputElement = $(this),
            instance = inputElement.data(dataAttrKey);

        if (typeof options === 'string') {
            if (instance && typeof instance[options] === 'function') {
                instance[options](args);
            }
        } else {
            // If instance already exists, destroy it:
            if (instance && instance.dispose) {
                instance.dispose();
            }
            instance = new Suggestions(this, options);
            inputElement.data(dataAttrKey, instance);
        }
    });
};
