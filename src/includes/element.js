    (function(){
        /**
         * Methods related to INPUT's behavior
         */

        var methods = {

            bindElementEvents: function () {
                var that = this;

                that.el.on('keydown' + eventNS, $.proxy(that.onElementKeyDown, that));
                // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
                that.el.on(['keyup' + eventNS, 'cut' + eventNS, 'paste' + eventNS, 'input' + eventNS].join(' '), $.proxy(that.onElementKeyUp, that));
                that.el.on('blur' + eventNS, $.proxy(that.onElementBlur, that));
                that.el.on('focus' + eventNS, $.proxy(that.onElementFocus, that));
            },

            unbindElementEvents: function () {
                this.el.off(eventNS);
            },

            onElementBlur: function () {
                var that = this;
                // suggestion was clicked, blur should be ignored
                // see container mousedown handler
                if (that.cancelBlur) {
                    delete that.cancelBlur;
                    return;
                }
                that.selectCurrentValue({ trim: true, noSpace: true })
                    .done(function (index) {
                        // For NAMEs selecting keeps suggestions list visible, so hide it
                        that.hide();
                    });
                if (!that.currentRequestIsEnrich) {
                    that.abortRequest();
                }
            },

            onElementFocus: function () {
                var that = this;

                if (!that.cancelFocus) {
                    // defer methods to allow browser update input's style before
                    utils.delay($.proxy(that.completeOnFocus, that));
                }
                that.cancelFocus = false;
            },

            onElementKeyDown: function (e) {
                var that = this;

                if (that.disabled) {
                    return;
                }

                if (!that.visible) {
                    switch (e.which) {
                        // If suggestions are hidden and user presses arrow down, display suggestions
                        case keys.DOWN:
                            that.suggest();
                            break;
                        // if no suggestions available and user pressed Enter
                        case keys.RETURN:
                            that.triggerOnSelectNothing();
                            break;
                    }
                    return;
                }

                switch (e.which) {
                    case keys.ESC:
                        that.el.val(that.currentValue);
                        that.hide();
                        that.abortRequest();
                        break;

                    case keys.TAB:
                        if (that.options.tabDisabled === false) {
                            return;
                        }
                        break;

                    case keys.RETURN:
                        that.selectCurrentValue({ trim: true });
                        break;

                    case keys.SPACE:
                        if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                            e.preventDefault();
                            that.selectCurrentValue({
                                continueSelecting: true,
                                dontEnrich: true
                            })
                                .done(function (index) {
                                    // If all data fetched but nothing selected
                                    if (index === -1) {
                                        that.currentValue += ' ';
                                        that.el.val(that.currentValue);
                                        that.update();
                                    }
                                });
                        }
                        return;
                    case keys.UP:
                        that.moveUp();
                        break;
                    case keys.DOWN:
                        that.moveDown();
                        break;
                    default:
                        return;
                }

                // Cancel event if function did not return:
                e.stopImmediatePropagation();
                e.preventDefault();
            },

            onElementKeyUp: function (e) {
                var that = this;

                if (that.disabled) {
                    return;
                }

                switch (e.which) {
                    case keys.UP:
                    case keys.DOWN:
                    case keys.ENTER:
                        return;
                }

                // Cancel pending change
                clearTimeout(that.onChangeTimeout);
                that.inputPhase.reject();

                if (that.currentValue !== that.el.val()) {

                    that.inputPhase = $.Deferred()
                        .done($.proxy(that.onValueChange, that));

                    if (that.options.deferRequestBy > 0) {
                        // Defer lookup in case when value changes very quickly:
                        that.onChangeTimeout = utils.delay(function () {
                            that.inputPhase.resolve();
                        }, that.options.deferRequestBy);
                    } else {
                        that.inputPhase.resolve();
                    }
                }
            },

            onValueChange: function () {
                var that = this,
                    value = that.el.val();

                if (that.selection) {
                    that.trigger('InvalidateSelection', that.selection);
                    that.selection = null;
                }

                that.currentValue = value;
                that.selectedIndex = -1;

                that.update();
                that.notify('valueChange');
            },

            completeOnFocus: function () {
                var that = this;

                if (document.activeElement === that.element) {
                    that.fixPosition();
                    that.update();
                    if (that.isMobile) {
                        that.setCursorAtEnd();
                        that.scrollToTop();
                    }
                }
            },

            isCursorAtEnd: function () {
                var that = this,
                    valLength = that.el.val().length,
                    selectionStart = that.element.selectionStart,
                    range;

                if (typeof selectionStart === 'number') {
                    return selectionStart === valLength;
                }
                if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart('character', -valLength);
                    return valLength === range.text.length;
                }
                return true;
            },

            setCursorAtEnd: function () {
                var element = this.element;

                element.selectionEnd = element.selectionStart = element.value.length;
                element.scrollLeft = element.scrollWidth;
            }


    };

        $.extend(Suggestions.prototype, methods);

        notificator
            .on('initialize', methods.bindElementEvents)
            .on('dispose', methods.unbindElementEvents);

    }());
