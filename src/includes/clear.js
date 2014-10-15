    (function(){
        /**
         * Methods related to Clear button
         */

        var optionsUsed = {
            // if not set as boolean, determined by `isMobile`
            showClear: null
        };

        var ClearButton = function (owner) {
            var that = this,
                $el = $('<span class="suggestions-clear"/>')
                    .appendTo(owner.$wrapper);

            that.owner = owner;
            that.ownerEdge = 'right';
            that.ownerEdgeId = 'clear';
            that.$el = $el;
            that.height = $el.height();
            that.width = $el.width();
            that.checkActivity();

            $el.on('click', $.proxy(that, 'onClick'));
        };

        ClearButton.prototype = {

            onClick: function (e) {
                var owner = this.owner;

                owner.clear();
            },

            fixPosition: function (origin, elLayout) {
                var that = this;

                that.checkActivity();
                that.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.width - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.height) / 2) + 'px'
                });
                if (that.active) {
                    elLayout.componentsRight += that.width;
                }
            },

            checkActivity: function () {
                var that = this,
                    enabled = that.owner.options.showClear,
                    active = enabled == null ? that.owner.isMobile : !!enabled;

                if (active != that.active) {
                    that.$el.toggle(active);
                    that.active = active;

                    that.owner.visibleComponents[that.ownerEdge][that.ownerEdgeId] = active;
                }
            }

        };

        var methods = {

            createClearButton: function () {
                this.clearButton = new ClearButton(this);
            },

            setClearButtonOptions: function () {
                this.clearButton.checkActivity();
            },

            setClearButtonPosition: function (origin, elLayout) {
                this.clearButton.fixPosition(origin, elLayout);
            }

        };

        $.extend(defaultOptions, optionsUsed);

        notificator
            .on('initialize', methods.createClearButton)
            .on('setOptions', methods.setClearButtonOptions)
            .on('fixPosition', methods.setClearButtonPosition);

    }());
