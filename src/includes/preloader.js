    (function(){
        /**
         * Methods related to PRELOADER component
         */

        var QUEUE_NAME = 'preloader',
            BEFORE_SHOW_PRELOADER = 50,
            BEFORE_RESTORE_PADDING = 1000;

        var optionsUsed = {
            usePreloader: true
        };

        var Preloader = function (owner) {
            var that = this,
                $el = $('<i class="suggestions-preloader"/>')
                    .appendTo(owner.$wrapper);

            that.owner = owner;
            that.ownerEdge = 'right';
            that.ownerEdgeId = 'preloader';
            that.$el = $el;
            that.visibleCount = 0;
            that.height = $el.height();
            that.width = $el.width();
            that.initialPadding = null;
        };

        Preloader.prototype = {

            isEnabled: function () {
                var that = this,
                    enabled = that.owner.options.usePreloader;

                // disable if other components are shown at the sae edge
                if (enabled) {
                    $.each(that.owner.visibleComponents[that.ownerEdge], function (id, visible) {
                        if (visible && id != that.ownerEdgeId) {
                            return enabled = false;
                        }
                    });
                }

                return enabled;
            },

            show: function () {
                var that = this;

                if (that.isEnabled()) {
                    if (!that.visibleCount++) {
                        that.$el
                            .stop(true, true)
                            .delay(BEFORE_SHOW_PRELOADER)
                            .queue(function () {
                                that.showPreloaderBackground();
                                that.$el.css('display','inline-block');
                                that.$el.dequeue();
                            })
                            .animate({'opacity': 1}, 'fast');
                    }
                }
            },

            hide: function () {
                var that = this;

                if (that.isEnabled()) {
                    if (!--that.visibleCount) {
                        that.$el
                            .stop(true)
                            .animate({'opacity': 0}, {
                                duration: 'fast',
                                complete: function () {
                                    that.$el.css('display','none');
                                    that.hidePreloaderBackground();
                                }
                            });
                    }
                }
            },

            fixPosition: function(origin, elLayout){
                var that = this;

                that.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.width - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.height) / 2) + 'px'
                });

                that.initialPadding = elLayout.paddingRight;
            },

            showPreloaderBackground: function () {
                var that = this,
                    preloaderLeftSpacing = 4;

                that.stopPreloaderBackground();
                that.owner.el
                    .animate({'padding-right': that.initialPadding + that.width + preloaderLeftSpacing}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    })
                    .dequeue(QUEUE_NAME);
            },

            hidePreloaderBackground: function () {
                var that = this;

                that.stopPreloaderBackground(true);
                that.owner.el
                    .delay(BEFORE_RESTORE_PADDING, QUEUE_NAME)
                    .animate({'padding-right': that.initialPadding}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    }).dequeue(QUEUE_NAME);
            },

            stopPreloaderBackground: function (gotoEnd) {
                this.owner.el.stop(QUEUE_NAME, true, gotoEnd);
            }

        };

        var methods = {

            createPreloader: function () {
                var that = this;

                that.preloader = new Preloader(that);
            },

            setPreloaderOptions: function () {
                var that = this;

                that.preloader.enabled = that.options.usePreloader;
            },

            setPreloaderPosition: function (origin, elLayout) {
                this.preloader.fixPosition(origin, elLayout);
            },

            stopPreloaderBackground: function () {
                this.preloader.stopPreloaderBackground();
            },

            showPreloader: function () {
                this.preloader.show();
            },

            hidePreloader: function () {
                this.preloader.hide();
            }

        };

        $.extend(defaultOptions, optionsUsed);

        notificator
            .on('initialize', methods.createPreloader)
            .on('setOptions', methods.setPreloaderOptions)
            .on('fixPosition', methods.setPreloaderPosition)
            .on('resetPosition', methods.stopPreloaderBackground)
            .on('requestStart', methods.showPreloader)
            .on('requestEnd', methods.hidePreloader);

    }());