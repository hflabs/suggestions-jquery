import $ from 'jquery';

import { utils } from './utils';
import { Suggestions } from './suggestions';
import { notificator } from './notificator';
import { DEFAULT_OPTIONS } from './default-options';

/**
 * Methods related to CONSTRAINTS component
 */
var optionsUsed = {
    constraints: null,
    restrict_value: false
};

var fiasParamNames = [
  'region_fias_id',
  'area_fias_id',
  'city_fias_id',
  'city_district_fias_id',
  'settlement_fias_id',
  'street_fias_id'
];

/**
 * Compares two suggestion objects
 * @param suggestion
 * @param instance other Suggestions instance
 */
function belongsToArea(suggestion, instance){
    var parentSuggestion = instance.selection,
        result = parentSuggestion && parentSuggestion.data && instance.bounds;

    if (result) {
        $.each(instance.bounds.all, function (i, bound) {
            return (result = parentSuggestion.data[bound] === suggestion.data[bound]);
        });
    }
    return result;
}

/**
 * @param {Object} data  fields
 * @param {Suggestions} instance
 * @constructor
 */
var ConstraintLocation = function(data, instance){
    var that = this,
        fieldNames,
        fiasFieldNames,
        fiasFields = {};

    that.instance = instance;
    that.fields = {};
    that.specificity = -1;

    if ($.isPlainObject(data) && instance.type.dataComponents) {
        $.each(instance.type.dataComponents, function (i, component) {
            var fieldName = component.id;

            if (component.forLocations && data[fieldName]) {
                that.fields[fieldName] = data[fieldName];
                that.specificity = i;
            }
        });
    }

    fieldNames = utils.objectKeys(that.fields);
    fiasFieldNames = utils.arraysIntersection(fieldNames, fiasParamNames);
    if (fiasFieldNames.length) {
        $.each(fiasFieldNames, function(index, fieldName) {
            fiasFields[fieldName] = that.fields[fieldName];
        });
        that.fields = fiasFields;
        that.specificity = that.getFiasSpecificity(fiasFieldNames);
    } else if (that.fields.kladr_id) {
        that.fields = { kladr_id: that.fields.kladr_id };
        that.specificity = that.getKladrSpecificity(that.fields.kladr_id);
    }
};

$.extend(ConstraintLocation.prototype, {
    getLabel: function(){
        return this.instance.type.composeValue(this.fields, { saveCityDistrict: true });
    },

    getFields: function () {
        return this.fields;
    },

    isValid: function(){
        return !$.isEmptyObject(this.fields);
    },

    /**
     * Возвращает specificity для КЛАДР
     * Описание ниже, в getFiasSpecificity
     * @param kladr_id
     * @returns {number}
     */
    getKladrSpecificity: function (kladr_id) {
        var specificity = -1,
            significantLength;

        this.significantKladr = kladr_id.replace(/^(\d{2})(\d*?)(0+)$/g, '$1$2');
        significantLength = this.significantKladr.length;

        $.each(this.instance.type.dataComponents, function (i, component) {
            if (component.kladrFormat && significantLength === component.kladrFormat.digits) {
                specificity = i;
            }
        });

        return specificity;
    },

    /**
     * Возвращает особую величину specificity для ФИАС
     * Specificity это индекс для массива this.instance.type.dataComponents
     * до которого (включительно) обрежется этот массив при формировании строки адреса.
     * Этот параметр нужен для случаев, когда в настройках плагина restrict_value = true
     * Например, установлено ограничение (locations) по region_fias_id (Краснодарский край)
     * В выпадашке нажимаем на "г. Сочи"
     * Если restrict_value отключен, то выведется значение "Краснодарский край, г Сочи"
     * Если включен, то просто "г Сочи"
     *
     * @param fiasFieldNames
     * @returns {number}
     */
    getFiasSpecificity: function (fiasFieldNames) {
        var specificity = -1;

        $.each(this.instance.type.dataComponents, function (i, component) {
            if (component.fiasType && ($.inArray(component.fiasType, fiasFieldNames) > -1) && specificity < i) {
                specificity = i;
            }
        });

        return specificity;
    },

    containsData: function (data){
        var result = true;

        if (this.fields.kladr_id) {
            return !!data.kladr_id && data.kladr_id.indexOf(this.significantKladr) === 0;
        } else {
            $.each(this.fields, function(fieldName, value){
                return result = !!data[fieldName] && data[fieldName].toLowerCase() === value.toLowerCase();
            });

            return result;
        }
    }
});

Suggestions.ConstraintLocation = ConstraintLocation;

/**
 * @param {Object} data
 * @param {Object|Array} data.locations
 * @param {string} [data.label]
 * @param {boolean} [data.deletable]
 * @param {Suggestions} [instance]
 * @constructor
 */
var Constraint = function(data, instance) {
    this.id = utils.uniqueId('c');
    this.deletable = !!data.deletable;
    this.instance = instance;

    this.locations = $.map($.makeArray(data && (data.locations || data.restrictions)), function (data) {
        return new ConstraintLocation(data, instance);
    });

    this.locations = $.grep(this.locations, function(location) {
        return location.isValid();
    });

    this.label = data.label;
    if (this.label == null && instance.type.composeValue) {
        this.label = $.map(this.locations, function (location) {
            return location.getLabel();
        }).join(', ');
    }

    if (this.label && this.isValid()) {
        this.$el = $(document.createElement('li'))
            .append($(document.createElement('span')).text(this.label))
            .attr('data-constraint-id', this.id);

        if (this.deletable) {
            this.$el.append(
                $(document.createElement('span'))
                    .addClass(instance.classes.removeConstraint)
            );
        }
    }
};

$.extend(Constraint.prototype, {
    isValid: function () {
        return this.locations.length > 0;
    },
    getFields: function(){
        return $.map(this.locations, function(location){
            return location.getFields();
        });
    }
});

var methods = {

    createConstraints: function () {
        var that = this;

        that.constraints = {};

        that.$constraints = $('<ul class="suggestions-constraints"/>');
        that.$wrapper.append(that.$constraints);
        that.$constraints.on('click', '.' + that.classes.removeConstraint, $.proxy(that.onConstraintRemoveClick, that));
    },

    setConstraintsPosition: function(origin, elLayout){
        var that = this;

        that.$constraints.css({
            left: origin.left + elLayout.borderLeft + elLayout.paddingLeft + 'px',
            top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.$constraints.height()) / 2) + 'px'
        });

        elLayout.componentsLeft += that.$constraints.outerWidth(true) + elLayout.paddingLeft;
    },

    onConstraintRemoveClick: function (e) {
        var that = this,
            $item = $(e.target).closest('li'),
            id = $item.attr('data-constraint-id');

        // Delete constraint data before animation to let correct requests to be sent while fading
        delete that.constraints[id];
        // Request for new suggestions
        that.update();

        $item.fadeOut('fast', function () {
            that.removeConstraint(id);
        });
    },

    setupConstraints: function () {
        var that = this,
            constraints = that.options.constraints,
            $parent;

        if (!constraints) {
            that.unbindFromParent();
            return;
        }

        if (constraints instanceof $ || typeof constraints === 'string' || typeof constraints.nodeType === 'number') {
            $parent = $(constraints);
            if (!$parent.is(that.constraints)) {
                that.unbindFromParent();
                if (!$parent.is(that.el)) {
                    that.constraints = $parent;
                    that.bindToParent();
                }
            }
        } else {
            that._constraintsUpdating = true;
            $.each(that.constraints, $.proxy(that.removeConstraint, that));
            $.each($.makeArray(constraints), function (i, constraint) {
                that.addConstraint(constraint);
            });
            that._constraintsUpdating = false;
            that.fixPosition();
        }
    },

    filteredLocation: function (data) {
        var locationComponents = [],
            location = {};

        $.each(this.type.dataComponents, function () {
            if (this.forLocations) locationComponents.push(this.id);
        });

        if ($.isPlainObject(data)) {
            // Copy to location only allowed fields
            $.each(data, function (key, value) {
                if (value && locationComponents.indexOf(key) >= 0) {
                    location[key] = value;
                }
            });
        }

        if (!$.isEmptyObject(location)) {
            return location.kladr_id ? { kladr_id: location.kladr_id } : location;
        }
    },

    addConstraint: function (constraint) {
        var that = this;

        constraint = new Constraint(constraint, that);

        if (constraint.isValid()) {
            that.constraints[constraint.id] = constraint;

            if (constraint.$el) {
                that.$constraints.append(constraint.$el);
                if (!that._constraintsUpdating) {
                    that.fixPosition();
                }
            }
        }
    },

    removeConstraint: function (id) {
        var that = this;
        delete that.constraints[id];
        that.$constraints.children('[data-constraint-id="' + id + '"]').remove();
        if (!that._constraintsUpdating) {
            that.fixPosition();
        }
    },

    constructConstraintsParams: function () {
        var that = this,
            locations = [],
            constraints = that.constraints,
            parentInstance,
            parentData,
            params = {};

        while (constraints instanceof $ && (parentInstance = constraints.suggestions()) &&
            !(parentData = utils.getDeepValue(parentInstance, 'selection.data'))
        ) {
            constraints = parentInstance.constraints;
        }

        if (constraints instanceof $) {
            parentData = (new ConstraintLocation(parentData, parentInstance))
                .getFields();

            if (parentData) {
                params.locations = [ parentData ];
                params.restrict_value = true;
            }
        } else {
            if (constraints) {
                $.each(constraints, function (id, constraint) {
                    locations = locations.concat(constraint.getFields());
                });

                if (locations.length) {
                    params.locations = locations;
                    params.restrict_value = that.options.restrict_value;
                }
            }
        }

        return params;
    },

    /**
     * Returns label of the first constraint (if any), empty string otherwise
     * @returns {String}
     */
    getFirstConstraintLabel: function() {
        var that = this,
            constraints_id = $.isPlainObject(that.constraints) && Object.keys(that.constraints)[0];

        return constraints_id ? that.constraints[constraints_id].label : '';
    },

    bindToParent: function () {
        var that = this;

        that.constraints
            .on([
                    'suggestions-select.' + that.uniqueId,
                    'suggestions-invalidateselection.' + that.uniqueId,
                    'suggestions-clear.' + that.uniqueId
                ].join(' '),
                $.proxy(that.onParentSelectionChanged, that)
            )
            .on('suggestions-dispose.' + that.uniqueId, $.proxy(that.onParentDispose, that));
    },

    unbindFromParent: function  () {
        var that = this,
            $parent = that.constraints;

        if ($parent instanceof $) {
            $parent.off('.' + that.uniqueId);
        }
    },

    onParentSelectionChanged: function (e, suggestion, valueChanged) {
        // Don't clear if parent has been just enriched
        if (e.type !== 'suggestions-select' || valueChanged) {
            this.clear();
        }
    },

    onParentDispose: function (e) {
        this.unbindFromParent();
    },

    getParentInstance: function () {
        return this.constraints instanceof $ && this.constraints.suggestions();
    },

    shareWithParent: function (suggestion) {
        // that is the parent control's instance
        var that = this.getParentInstance();

        if (!that || that.type !== this.type || belongsToArea(suggestion, that)) {
            return;
        }

        that.shareWithParent(suggestion);
        that.setSuggestion(suggestion);
    },

    /**
     * Pick only fields that absent in restriction
     */
    getUnrestrictedData: function (data) {
        var that = this,
            restrictedKeys = [],
            unrestrictedData = {},
            maxSpecificity = -1;

        // Find most specific location that could restrict current data
        $.each(that.constraints, function (id, constraint) {
            $.each(constraint.locations, function (i, location) {
                if (location.containsData(data) && location.specificity > maxSpecificity) {
                    maxSpecificity = location.specificity;
                }
            });
        });

        if (maxSpecificity >= 0) {

            // Для городов-регионов нужно также отсечь и город
            if (data.region_kladr_id && data.region_kladr_id === data.city_kladr_id) {
                restrictedKeys.push.apply(restrictedKeys, that.type.dataComponentsById['city'].fields);
            }

            // Collect all fieldnames from all restricted components
            $.each(that.type.dataComponents.slice(0, maxSpecificity + 1), function (i, component) {
                restrictedKeys.push.apply(restrictedKeys, component.fields);
            });

            // Copy skipping restricted fields
            $.each(data, function (key, value) {
                if (restrictedKeys.indexOf(key) === -1) {
                    unrestrictedData[key] = value;
                }
            });
        } else {
            unrestrictedData = data;
        }

        return unrestrictedData;
    }

};

$.extend(DEFAULT_OPTIONS, optionsUsed);

$.extend(Suggestions.prototype, methods);

// Disable this feature when GET method used. See SUG-202
if (utils.getDefaultType() != 'GET') {
    notificator
        .on('initialize', methods.createConstraints)
        .on('setOptions', methods.setupConstraints)
        .on('fixPosition', methods.setConstraintsPosition)
        .on('requestParams', methods.constructConstraintsParams)
        .on('dispose', methods.unbindFromParent);
}