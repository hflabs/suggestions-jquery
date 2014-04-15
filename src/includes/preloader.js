    (function(){
        /**
         * Methods related to PRELOADER component
         */

        var methods = {

            createPreloader: function () {
                var that = this;

                that.$preloader = $('<i class="suggestions-preloader"/>');
                that.$wrapper.append(that.$preloader);
            },

            setPreloaderPosition: function(origin, elLayout){
                var that = this;

                that.$preloader.css({
                    left: origin.left + elLayout.borderLeft + elLayout.innerWidth - that.$preloader.width() - elLayout.paddingRight + 'px',
                    top: origin.top + elLayout.borderTop + Math.round((elLayout.innerHeight - that.$preloader.height()) / 2) + 'px'
                });
            },

            showPreloader: function () {
                if (this.options.usePreloader) {
                    this.$preloader
                        .stop(true)
                        .delay(50)
                        .animate({'opacity': 1}, 'fast');
                }
            },

            hidePreloader: function () {
                if (this.options.usePreloader) {
                    this.$preloader
                        .stop(true)
                        .animate({'opacity': 0}, 'fast');
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createPreloader);

        fixPositionHooks.push(methods.setPreloaderPosition);

    }());