    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */

        // Disable this feature when GET method used. See SUG-202
        if (utils.getDefaultType() == 'GET') {
            return;
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

                elLayout.paddingLeft += that.$constraints.outerWidth(true);
            },

            onConstraintRemoveClick: function (e) {
                var that = this,
                    $item = $(e.target).closest('li'),
                    id = $item.attr('data-constraint-id');

                // Delete constraint data before animation to let correct requests to be sent while fading
                delete that.constraints[id];
                // Request for new suggestions
                that.proceedQuery(that.getQuery(that.el.val()));

                $item.fadeOut('fast', function () {
                    that.removeConstraint(id);
                });
            },

            setupConstraints: function (defaultConstraint) {
                var that = this,
                    constraints = that.options.constraints;

                if (constraints === false) {
                    return;
                }

                if (!constraints && !(constraints = defaultConstraint)) {
                    return;
                }

                that._constraintsUpdating = true;
                $.each(that.constraints, $.proxy(that.removeConstraint, that));
                $.each($.makeArray(constraints), function (i, constraint) {
                    that.addConstraint(constraint);
                });
                that._constraintsUpdating = false;
                that.fixPosition();
            },

            formatConstraint: function (constraint) {
                var that = this;

                if (constraint && constraint.restrictions) {
                    constraint.restrictions = $.makeArray(constraint.restrictions);
                    if (!constraint.label) {
                        constraint.label = $.map(constraint.restrictions, function(restriction){
                            return that.type.composeValue(restriction);
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
                    restrictions = [],
                    params = {};

                $.each(that.constraints, function(id, constraint){
                    restrictions = restrictions.concat(constraint.restrictions);
                });
                if (restrictions.length) {
                    params.restrictions = restrictions;
                    params.restrict_value = that.options.restrict_value;
                }
                return params;
            },

            /**
             * Returns label of the first constraint (if any), empty string otherwise
             * @returns {String}
             */
            getConstraintLabel: function() {
                var that = this,
                    constraints_id = that.constraints && Object.keys(that.constraints)[0];

                return constraints_id ? that.constraints[constraints_id].label : '';
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createConstraints);

        setOptionsHooks.push(methods.setupConstraints);

        fixPositionHooks.push(methods.setConstraintsPosition);

        requestParamsHooks.push(methods.constructConstraintsParams);

    }());