    (function(){
        /**
         * Methods related to PRELOADER component
         */

        var methods = {

            createPreloader: function () {
                var that = this,
                    $preloader = $('<i class="suggestions-preloader"/>')
                        .appendTo(that.$wrapper);

                that.preloader = {
                    $el: $preloader,
                    visibleCount: 0,
                    height: $preloader.height(),
                    width: $preloader.width()
                };
            },

            setPreloaderPosition: function(origin, elLayout){
                var that = this,
                    preloaderLeftSpacing = 4;

                that.preloader.$el.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.preloader.width - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.preloader.height) / 2) + 'px'
                });

                elLayout.paddingRight += that.preloader.width + preloaderLeftSpacing;
            },

            showPreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    if (!that.preloader.visibleCount++) {
                        that.preloader.$el
                            .stop(true)
                            .delay(50)
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
                            .animate({'opacity': 0}, 'fast');
                    }
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createPreloader);

        fixPositionHooks.push(methods.setPreloaderPosition);

    }());