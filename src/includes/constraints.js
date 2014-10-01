    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */
        var optionsUsed = {
            constraints: null,
            restrict_value: false
        };

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

                elLayout.paddingLeft += that.$constraints.outerWidth(true);
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
                            $parent.on([
                                    'suggestions-select.' + that.uniqueId,
                                    'suggestions-selectnothing.' + that.uniqueId,
                                    'suggestions-invalidateselection.' + that.uniqueId,
                                    'suggestions-clear.' + that.uniqueId
                            ].join(' '), $.proxy(that.onParentSelectionChanged, that));
                            $parent.on('suggestions-dispose.' + that.uniqueId, $.proxy(that.onParentDispose, that));
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

            formatConstraint: function (constraint) {
                var that = this;

                if (constraint && (constraint.locations || constraint.restrictions)) {
                    constraint.locations = $.makeArray(constraint.locations || constraint.restrictions);
                    if (!constraint.label && that.type.composeValue) {
                        constraint.label = $.map(constraint.locations, function(location){
                            return that.type.composeValue(location);
                        }).join(', ');
                    }
                    return constraint;
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
                    parentKladrId,
                    params = {};

                while (constraints instanceof $ && (parentInstance = constraints.suggestions()) &&
                    !(parentKladrId = utils.getDeepValue(parentInstance, 'selection.data.kladr_id'))
                ) {
                    constraints = parentInstance.constraints;
                }

                if (constraints instanceof $) {
                    if (parentKladrId) {
                        params.locations = [
                            { 'kladr_id': parentKladrId }
                        ];
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

            unbindFromParent: function  () {
                var $parent = this.constraints;

                if ($parent instanceof $) {
                    $parent.off('.' + this.uniqueId);
                }
            },

            onParentSelectionChanged: function (e, suggestion) {
                this.clear();
            },

            onParentDispose: function (e) {
                this.unbindFromParent();
            },

            shareWithParent: function (suggestion, otherSuggestions) {
                // that is the parent control's instance
                var that = this.constraints instanceof $ && this.constraints.suggestions(),
                    parts = ['region', 'area', 'city', 'settlement', 'street', 'house', 'block', 'flat'],
                    values = [],
                    locations = {},
                    resolver = $.Deferred();

                if (!that || that.selection || !that.bounds.from && !that.bounds.to) {
                    return resolver.resolve();
                }

                $.each(parts, function (i, part) {
                    var value = suggestion.data[part];

                    if (value) {
                        values.push({ part: part, value: value });
                    }

                    if (part == that.bounds.to) {
                        return false;
                    }
                });

                if (values.length) {
                    that.currentValue = values.pop().value;
                    $.each(values, function (i, value) {
                        locations[value.part] = value.value;
                    });
                    that.getSuggestions(that.currentValue, !$.isEmptyObject(locations) && {
                        locations: [locations],
                        restrict_value: false
                    })
                        .done(function (suggestions) {
                            var parentSuggestion = suggestions[0];
                            if (parentSuggestion) {
                                otherSuggestions.push(parentSuggestion);
                                that.shareWithParent(suggestion, otherSuggestions)
                                    .done(function () {
                                        var rParentReplaces = new RegExp('([' + wordDelimeters + ']*)' + utils.escapeRegExChars(parentSuggestion.value) + '[' + wordDelimeters + ']*', 'i');
                                        that.setSuggestion(parentSuggestion);
                                        $.each(otherSuggestions, function (i, suggestion) {
                                            suggestion.value = suggestion.value.replace(rParentReplaces, '$1');
                                        });
                                        resolver.resolve();
                                    });
                            }
                        })
                        .fail(function () {
                            resolver.resolve();
                        })
                }

                return resolver;
            }

        };

        $.extend(defaultOptions, optionsUsed);

        $.extend(Suggestions.prototype, methods);

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
        }

        initializeHooks.push(methods.createConstraints);

        setOptionsHooks.push(methods.setupConstraints);

        fixPositionHooks.push(methods.setConstraintsPosition);

        requestParamsHooks.push(methods.constructConstraintsParams);

        disposeHooks.push(methods.unbindFromParent);

    }());