import $ from "jquery";

import { Suggestions } from "./suggestions";
import { DEFAULT_OPTIONS } from "./default-options";
import { notificator } from "./notificator";

/**
 * features for connected instances
 */

var optionsUsed = {
    bounds: null,
};

var methods = {
    setupBounds: function() {
        this.bounds = {
            from: null,
            to: null,
        };
    },

    setBoundsOptions: function() {
        var that = this,
            boundsAvailable = [],
            newBounds = $.trim(that.options.bounds).split("-"),
            boundFrom = newBounds[0],
            boundTo = newBounds[newBounds.length - 1],
            boundsOwn = [],
            boundIsOwn,
            boundsAll = [];

        if (that.type.dataComponents) {
            $.each(that.type.dataComponents, function() {
                if (this.forBounds) {
                    boundsAvailable.push(this.id);
                }
            });
        }

        if (boundsAvailable.indexOf(boundFrom) === -1) {
            boundFrom = null;
        }

        if (boundsAvailable.indexOf(boundTo) === -1) {
            boundTo = null;
        }

        if (boundFrom || boundTo) {
            boundIsOwn = !boundFrom;
            $.each(boundsAvailable, function(i, bound) {
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

    constructBoundsParams: function() {
        var that = this,
            params = {};

        if (that.bounds.from) {
            params["from_bound"] = { value: that.bounds.from };
        }
        if (that.bounds.to) {
            params["to_bound"] = { value: that.bounds.to };
        }

        return params;
    },

    /**
     * Подстраивает suggestion.value под that.bounds.own
     * Ничего не возвращает, меняет в самом suggestion
     * @param suggestion
     */
    checkValueBounds: function(suggestion) {
        var that = this,
            valueData;

        // If any bounds set up
        if (that.bounds.own.length && that.type.composeValue) {
            // делаем копию
            var bounds = that.bounds.own.slice(0);
            // если роль текущего инстанса плагина показывать только район города
            // то для корректного формировния нужен city_district_fias_id
            if (bounds.length === 1 && bounds[0] === "city_district") {
                bounds.push("city_district_fias_id");
            }
            valueData = that.copyDataComponents(suggestion.data, bounds);
            suggestion.value = that.type.composeValue(valueData);
        }
    },

    copyDataComponents: function(data, components) {
        var result = {},
            dataComponentsById = this.type.dataComponentsById;

        if (dataComponentsById) {
            $.each(components, function(i, component) {
                $.each(dataComponentsById[component].fields, function(
                    i,
                    field
                ) {
                    if (data[field] != null) {
                        result[field] = data[field];
                    }
                });
            });
        }

        return result;
    },

    getBoundedKladrId: function(kladr_id, boundsRange) {
        var boundTo = boundsRange[boundsRange.length - 1],
            kladrFormat;

        $.each(this.type.dataComponents, function(i, component) {
            if (component.id === boundTo) {
                kladrFormat = component.kladrFormat;
                return false;
            }
        });

        return (
            kladr_id.substr(0, kladrFormat.digits) +
            new Array((kladrFormat.zeros || 0) + 1).join("0")
        );
    },
};

$.extend(DEFAULT_OPTIONS, optionsUsed);

$.extend(Suggestions.prototype, methods);

notificator
    .on("initialize", methods.setupBounds)
    .on("setOptions", methods.setBoundsOptions)
    .on("requestParams", methods.constructBoundsParams);
