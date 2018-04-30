import { DEFAULT_OPTIONS } from './default-options';
import { lang_util } from './utils/lang';
import { collection_util } from './utils/collection';
import { text_util } from './utils/text';
import { object_util } from './utils/object';
import { generateId } from './utils';
import { ajax } from './ajax';
import { jqapi } from './jqapi';
import { Suggestions } from './suggestions';
import { notificator } from './notificator';

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
        collection_util.each(instance.bounds.all, function (bound, i) {
            return (result = parentSuggestion.data[bound] === suggestion.data[bound]);
        });
    }
    return result;
}

/**
 * Возвращает КЛАДР-код, обрезанный до последнего непустого уровня
 * 50 000 040 000 00 → 50 000 040
 * @param kladr_id
 * @returns {string}
 */
function getSignificantKladrId(kladr_id) {
    var significantKladrId = kladr_id.replace(/^(\d{2})(\d*?)(0+)$/g, '$1$2');
    var length = significantKladrId.length;
    var significantLength = -1;
    if (length <= 2) {
        significantLength = 2;
    } else if (length > 2 && length <= 5) {
        significantLength = 5;
    } else if (length > 5 && length <= 8) {
        significantLength = 8;
    } else if (length > 8 && length <= 11) {
        significantLength = 11;
    } else if (length > 11 && length <= 15) {
        significantLength = 15;
    } else if (length > 15) {
        significantLength = 19;
    }
    return text_util.padEnd(significantKladrId, significantLength, "0");
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

    if (lang_util.isPlainObject(data) && instance.type.dataComponents) {
        collection_util.each(instance.type.dataComponents, function (component, i) {
            var fieldName = component.id;

            if (component.forLocations && data[fieldName]) {
                that.fields[fieldName] = data[fieldName];
                that.specificity = i;
            }
        });
    }

    fieldNames = Object.keys(that.fields);
    fiasFieldNames = collection_util.intersect(fieldNames, fiasParamNames);
    if (fiasFieldNames.length) {
        collection_util.each(fiasFieldNames, function(fieldName, index) {
            fiasFields[fieldName] = that.fields[fieldName];
        });
        that.fields = fiasFields;
        that.specificity = that.getFiasSpecificity(fiasFieldNames);
    } else if (that.fields.kladr_id) {
        that.fields = { kladr_id: that.fields.kladr_id };
        that.significantKladr = getSignificantKladrId(that.fields.kladr_id);
        that.specificity = that.getKladrSpecificity(that.significantKladr);
    }
};

jqapi.extend(ConstraintLocation.prototype, {
    getLabel: function(){
        return this.instance.type.composeValue(this.fields, { saveCityDistrict: true });
    },

    getFields: function () {
        return this.fields;
    },

    isValid: function(){
        return !lang_util.isEmptyObject(this.fields);
    },

    /**
     * Возвращает specificity для КЛАДР
     * Описание ниже, в getFiasSpecificity
     * @param kladr_id
     * @returns {number}
     */
    getKladrSpecificity: function(kladr_id) {
        var specificity = -1;
        var kladrLength = kladr_id.length;

        collection_util.each(this.instance.type.dataComponents, function (component, i) {
            if (component.kladrFormat && kladrLength === component.kladrFormat.digits) {
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

        collection_util.each(this.instance.type.dataComponents, function (component, i) {
            if (component.fiasType && (fiasFieldNames.indexOf(component.fiasType) > -1) && specificity < i) {
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
            collection_util.each(this.fields, function(value, fieldName){
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
    this.id = generateId('c');
    this.deletable = !!data.deletable;
    this.instance = instance;

    var locationsArray = collection_util.makeArray(data && (data.locations || data.restrictions));
    this.locations = locationsArray.map(function (data) {
        return new ConstraintLocation(data, instance);
    });

    this.locations = this.locations.filter(function(location) {
        return location.isValid();
    });

    this.label = data.label;
    if (this.label == null && instance.type.composeValue) {
        this.label = this.locations.map(function (location) {
            return location.getLabel();
        }).join(', ');
    }

    if (this.label && this.isValid()) {
        this.$el = jqapi.select(document.createElement('li'))
            .append(jqapi.select(document.createElement('span')).text(this.label))
            .attr('data-constraint-id', this.id);

        if (this.deletable) {
            this.$el.append(
                jqapi.select(document.createElement('span'))
                    .addClass(instance.classes.removeConstraint)
            );
        }
    }
};

jqapi.extend(Constraint.prototype, {
    isValid: function () {
        return this.locations.length > 0;
    },
    getFields: function(){
        return this.locations.map(function(location){
            return location.getFields();
        });
    }
});

var methods = {

    createConstraints: function () {
        var that = this;

        that.constraints = {};

        that.$constraints = jqapi.select('<ul class="suggestions-constraints"/>');
        that.$wrapper.append(that.$constraints);
        that.$constraints.on('click', '.' + that.classes.removeConstraint, 
            jqapi.proxy(that.onConstraintRemoveClick, that));
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
            $item = jqapi.select(e.target).closest('li'),
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

        if (jqapi.isJqObject(constraints) || typeof constraints === 'string' || typeof constraints.nodeType === 'number') {
            $parent = jqapi.select(constraints);
            if (!$parent.is(that.constraints)) {
                that.unbindFromParent();
                if (!$parent.is(that.el)) {
                    that.constraints = $parent;
                    that.bindToParent();
                }
            }
        } else {
            that._constraintsUpdating = true;
            collection_util.each(that.constraints, function(_, id) {
                that.removeConstraint(id);
            });
            collection_util.each(collection_util.makeArray(constraints), function (constraint, i) {
                that.addConstraint(constraint);
            });
            that._constraintsUpdating = false;
            that.fixPosition();
        }
    },

    filteredLocation: function (data) {
        var locationComponents = [],
            location = {};

        collection_util.each(this.type.dataComponents, function () {
            if (this.forLocations) locationComponents.push(this.id);
        });

        if (lang_util.isPlainObject(data)) {
            // Copy to location only allowed fields
            collection_util.each(data, function (value, key) {
                if (value && locationComponents.indexOf(key) >= 0) {
                    location[key] = value;
                }
            });
        }

        if (!lang_util.isEmptyObject(location)) {
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

        while (jqapi.isJqObject(constraints) && (parentInstance = constraints.suggestions()) &&
            !(parentData = object_util.getDeepValue(parentInstance, 'selection.data'))
        ) {
            constraints = parentInstance.constraints;
        }

        if (jqapi.isJqObject(constraints)) {
            parentData = (new ConstraintLocation(parentData, parentInstance))
                .getFields();

            if (parentData) {
                // if send city_fias_id for city request
                // then no cities will responded
                if (that.bounds.own.indexOf('city') > -1) {
                    delete parentData.city_fias_id;
                }
                params.locations = [ parentData ];
                params.restrict_value = true;
            }
        } else {
            if (constraints) {
                collection_util.each(constraints, function (constraint, id) {
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
            constraints_id = lang_util.isPlainObject(that.constraints) && Object.keys(that.constraints)[0];

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
                jqapi.proxy(that.onParentSelectionChanged, that)
            )
            .on('suggestions-dispose.' + that.uniqueId, jqapi.proxy(that.onParentDispose, that));
    },

    unbindFromParent: function  () {
        var that = this,
            $parent = that.constraints;

        if (jqapi.isJqObject($parent)) {
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
        return jqapi.isJqObject(this.constraints) && this.constraints.suggestions();
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
        collection_util.each(that.constraints, function (constraint, id) {
            collection_util.each(constraint.locations, function (location, i) {
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
            collection_util.each(that.type.dataComponents.slice(0, maxSpecificity + 1), function (component, i) {
                restrictedKeys.push.apply(restrictedKeys, component.fields);
            });

            // Copy skipping restricted fields
            collection_util.each(data, function (value, key) {
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

jqapi.extend(DEFAULT_OPTIONS, optionsUsed);

jqapi.extend(Suggestions.prototype, methods);

// Disable this feature when GET method used. See SUG-202
if (ajax.getDefaultType() != 'GET') {
    notificator
        .on('initialize', methods.createConstraints)
        .on('setOptions', methods.setupConstraints)
        .on('fixPosition', methods.setConstraintsPosition)
        .on('requestParams', methods.constructConstraintsParams)
        .on('dispose', methods.unbindFromParent);
}