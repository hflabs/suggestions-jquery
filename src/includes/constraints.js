    (function(){
        /**
         * Methods related to CONSTRAINTS component
         */

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
                $item.fadeOut('fast', function () {
                    that.removeConstraint(id);
                });
            },

            setupConstraints: function () {
                var that = this,
                    constraints = that.options.constraints;

                if (!constraints) {
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
                if (constraint && constraint.restrictions) {
                    constraint.restrictions = $.makeArray(constraint.restrictions);
                    if (!constraint.label) {
                        var labels = [];
                        $.each(constraint.restrictions, function(i, restriction){
                            $.each(['kladr_id', 'okato', 'postal_code', 'region', 'area', 'city', 'settlement'], function (i, field) {
                                if (restriction[field]) {
                                    labels.push(restriction[field]);
                                }
                            });
                        });
                        constraint.label = labels.join(', ');
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
                }
                return params;
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createConstraints);

        setOptionsHooks.push(methods.setupConstraints);

        fixPositionHooks.push(methods.setConstraintsPosition);

        requestParamsHooks.push(methods.constructConstraintsParams);

    }());