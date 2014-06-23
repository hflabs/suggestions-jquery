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
                    visible: false,
                    height: $preloader.height(),
                    width: $preloader.width()
                };
            },

            setPreloaderPosition: function(origin, elLayout){
                var that = this,
                    left = origin.left + elLayout.borderLeft + elLayout.innerWidth - that.preloader.width - elLayout.paddingRight;

                if (that.preloader.visible) {
                    left -= that.preloader.width;
                }

                that.preloader.$el.css({
                    left: left + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.preloader.height) / 2) + 'px'
                });
            },

            showPreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    that.preloader.visible = true;
                    that.el.css('padding-right', parseFloat(that.el.css('padding-right')) + that.preloader.width + 'px');
                    that.preloader.$el
                        .stop(true)
                        .delay(50)
                        .animate({'opacity': 1}, 'fast');
                }
            },

            hidePreloader: function () {
                var that = this;

                if (that.options.usePreloader) {
                    that.preloader.visible = false;
                    that.el.css('padding-right', parseFloat(that.el.css('padding-right')) - that.preloader.width + 'px');
                    that.preloader.$el
                        .stop(true)
                        .animate({'opacity': 0}, 'fast');
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createPreloader);

        fixPositionHooks.push(methods.setPreloaderPosition);

    }());