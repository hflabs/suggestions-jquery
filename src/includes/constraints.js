    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */
        var optionsUsed = {
            constraints: null,
            restrict_value: false
        };

        var LOCATION_FIELDS = ['kladr_id', 'postal_code', 'region', 'area', 'city', 'settlement', 'street'];

        function filteredLocation (data) {
            var location = {};

            if ($.isPlainObject(data)) {
                $.each(data, function(key, value) {
                    if (value && LOCATION_FIELDS.indexOf(key) >= 0) {
                        location[key] = value;
                    }
                });
            }

            if (!$.isEmptyObject(location)) {
                return location.kladr_id ? { kladr_id: location.kladr_id } : location;
            }
        }

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

            /**
             * Checks for required fields
             * Also checks `locations` objects for having acceptable fields
             * @param constraint
             * @returns {*}
             */
            formatConstraint: function (constraint) {
                var that = this,
                    locations;

                if (constraint && (constraint.locations || constraint.restrictions)) {
                    locations = $.makeArray(constraint.locations || constraint.restrictions);
                    if (constraint.label == null && that.type.composeValue) {
                        constraint.label = $.map(locations, function(location){
                            return that.type.composeValue(location);
                        }).join(', ');
                    }

                    constraint.locations = [];
                    $.each(locations, function (i, location) {
                        var filtered = filteredLocation(location);

                        if (filtered) {
                            constraint.locations.push(filtered);
                        }
                    });

                    return constraint.locations.length ? constraint : null;
                }
            },

            addConstraint: function (constraint) {
                var that = this,
                    $item,
                    id;

                constraint = that.formatConstraint(constraint);
                if (!constraint) {
                    return;
                }

                id = utils.uniqueId('c');
                that.constraints[id] = constraint;

                if (constraint.label) {
                    $item = $('<li/>')
                        .append($('<span/>').text(constraint.label))
                        .attr('data-constraint-id', id);
                    if (constraint.deletable) {
                        $item.append($('<span class="suggestions-remove"/>'));
                    }
                    that.$constraints.append($item);
                    if (!that._constraintsUpdating) {
                        that.fixPosition();
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
                    parentData = filteredLocation(parentData);
                    if (parentData) {
                        params.locations = [ parentData ];
                        params.restrict_value = true;
                    }
                } else {
                    $.each(constraints, function (id, constraint) {
                        locations = locations.concat(constraint.locations);
                    });
                    if (locations.length) {
                        params.locations = locations;
                        params.restrict_value = that.options.restrict_value;
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
            }

        };

        $.extend(defaultOptions, optionsUsed);

        $.extend(Suggestions.prototype, methods);

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
        }

        notificator
            .on('initialize', methods.createConstraints)
            .on('setOptions', methods.setupConstraints)
            .on('fixPosition', methods.setConstraintsPosition)
            .on('requestParams', methods.constructConstraintsParams)
            .on('dispose', methods.unbindFromParent);

    }());