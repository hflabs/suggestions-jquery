    (function(){
        /**
         * Methods related to PRELOADER component
         */

        var QUEUE_NAME = 'preloader',
            BEFORE_SHOW_PRELOADER = 50,
            BEFORE_RESTORE_PADDING = 1000;

        var methods = {

            createPreloader: function () {
                var that = this,
                    $preloader = $('<i class="suggestions-preloader"/>')
                        .appendTo(that.$wrapper);

                that.preloader = {
                    $el: $preloader,
                    visibleCount: 0,
                    height: $preloader.height(),
                    width: $preloader.width(),
                    initialPadding: null
                };
            },

            setPreloaderPosition: function(origin, elLayout){
                var that = this;

                that.preloader.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.preloader.width - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.preloader.height) / 2) + 'px'
                });

                that.preloader.initialPadding = elLayout.paddingRight;
            },

            showPreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    if (!that.preloader.visibleCount++) {
                        that.preloader.$el
                            .stop(true, true)
                            .delay(BEFORE_SHOW_PRELOADER)
                            .queue(function () {
                                that.showPreloaderBackground();
                                $(this).dequeue();
                            })
                            .animate({'opacity': 1}, 'fast');
                    }
                }
            },

            hidePreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    if (! --that.preloader.visibleCount) {
                        that.preloader.$el
                            .stop(true)
                            .animate({'opacity': 0}, {
                                duration: 'fast',
                                complete: function () {
                                    that.hidePreloaderBackground();
                                }
                            });
                    }
                }
            },

            showPreloaderBackground: function () {
                var that = this,
                    preloaderLeftSpacing = 4;

                that.el.stop(QUEUE_NAME, true)
                    .animate({'padding-right': that.preloader.initialPadding + that.preloader.width + preloaderLeftSpacing}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    }).dequeue(QUEUE_NAME);
            },

            hidePreloaderBackground: function () {
                var that = this;

                that.el.stop(QUEUE_NAME, true, true)
                    .delay(BEFORE_RESTORE_PADDING, QUEUE_NAME)
                    .animate({'padding-right': that.preloader.initialPadding}, {
                        duration: 'fast',
                        queue: QUEUE_NAME
                    }).dequeue(QUEUE_NAME);
            },

            stopPreloaderBackground: function () {
                this.el.stop(QUEUE_NAME, true);
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createPreloader);

        fixPositionHooks.push(methods.setPreloaderPosition);

        resetPositionHooks.push(methods.stopPreloaderBackground);
    }());