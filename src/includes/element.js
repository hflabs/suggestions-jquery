import $ from 'jquery';

import { utils } from './utils';
import { notificator } from './notificator';
import { Suggestions } from './suggestions';

import { KEYS, EVENT_NS } from './constants';

/**
 * Methods related to INPUT's behavior
 */

var methods = {

    setupElement: function () {
        // Remove autocomplete attribute to prevent native suggestions:
        this.el
            .attr('autocomplete', 'off')
            .attr('autocorrect', 'off')
            .attr('autocapitalize', 'off')
            .attr('spellcheck', 'false')
            .addClass('suggestions-input')
            .css('box-sizing', 'border-box');
    },

    bindElementEvents: function () {
        var that = this;

        that.el.on('keydown' + EVENT_NS, $.proxy(that.onElementKeyDown, that));
        // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
        that.el.on(['keyup' + EVENT_NS, 'cut' + EVENT_NS, 'paste' + EVENT_NS, 'input' + EVENT_NS].join(' '), $.proxy(that.onElementKeyUp, that));
        that.el.on('blur' + EVENT_NS, $.proxy(that.onElementBlur, that));
        that.el.on('focus' + EVENT_NS, $.proxy(that.onElementFocus, that));
    },

    unbindElementEvents: function () {
        this.el.off(EVENT_NS);
    },

    onElementBlur: function () {
        var that = this;

        // suggestion was clicked, blur should be ignored
        // see container mousedown handler
        if (that.cancelBlur) {
            that.cancelBlur = false;
            return;
        }

        if (that.options.triggerSelectOnBlur) {
            if (!that.isUnavailable()) {
                that.selectCurrentValue({ noSpace: true })
                    .always(function () {
                        // For NAMEs selecting keeps suggestions list visible, so hide it
                        that.hide();
                    });
            }
        } else {
            that.hide();
        }

        if (that.fetchPhase.abort) {
            that.fetchPhase.abort();
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

        if (that.isUnavailable()) {
            return;
        }

        if (!that.visible) {
            switch (e.which) {
                // If suggestions are hidden and user presses arrow down, display suggestions
                case KEYS.DOWN:
                    that.suggest();
                    break;
                // if no suggestions available and user pressed Enter
                case KEYS.ENTER:
                    if (that.options.triggerSelectOnEnter) {
                        that.triggerOnSelectNothing();
                    }
                    break;
            }
            return;
        }

        switch (e.which) {
            case KEYS.ESC:
                that.el.val(that.currentValue);
                that.hide();
                that.abortRequest();
                break;

            case KEYS.TAB:
                if (that.options.tabDisabled === false) {
                    return;
                }
                break;

            case KEYS.ENTER:
                if (that.options.triggerSelectOnEnter) {
                    that.selectCurrentValue();
                }
                break;

            case KEYS.SPACE:
                if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                    e.preventDefault();
                    that.selectCurrentValue({ continueSelecting: true, dontEnrich: true })
                        .fail(function () {
                            // If all data fetched but nothing selected
                            that.currentValue += ' ';
                            that.el.val(that.currentValue);
                            that.proceedChangedValue();
                        });
                }
                return;
            case KEYS.UP:
                that.moveUp();
                break;
            case KEYS.DOWN:
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

        if (that.isUnavailable()) {
            return;
        }

        switch (e.which) {
            case KEYS.UP:
            case KEYS.DOWN:
            case KEYS.ENTER:
                return;
        }

        // Cancel pending change
        clearTimeout(that.onChangeTimeout);
        that.inputPhase.reject();

        if (that.currentValue !== that.el.val()) {
            that.proceedChangedValue();
        }
    },

    proceedChangedValue: function () {
        var that = this;

        // Cancel fetching, because it became obsolete
        that.abortRequest();

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
    },

    onValueChange: function () {
        var that = this,
            currentSelection;

        if (that.selection) {
            currentSelection = that.selection;
            that.selection = null;
            that.trigger('InvalidateSelection', currentSelection);
        }

        that.selectedIndex = -1;

        that.update();
        that.notify('valueChange');
    },

    completeOnFocus: function () {
        var that = this;

        if (that.isUnavailable()) {
            return;
        }

        if (that.isElementFocused()) {
            that.fixPosition();
            that.update();
            if (that.isMobile) {
                that.setCursorAtEnd();
                that.scrollToTop();
            }
        }
    },

    isElementFocused: function () {
        return document.activeElement === this.element;
    },

    isElementDisabled: function() {
        return Boolean(this.element.getAttribute('disabled') || this.element.getAttribute('readonly'));
    },

    isCursorAtEnd: function () {
        var that = this,
            valLength = that.el.val().length,
            selectionStart,
            range;

        // `selectionStart` and `selectionEnd` are not supported by some input types
        try {
            selectionStart = that.element.selectionStart;
            if (typeof selectionStart === 'number') {
                return selectionStart === valLength;
            }
        } catch (ex) {
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

        // `selectionStart` and `selectionEnd` are not supported by some input types
        try {
            element.selectionEnd = element.selectionStart = element.value.length;
            element.scrollLeft = element.scrollWidth;
        } catch (ex) {
            element.value = element.value;
        }
    }

};

$.extend(Suggestions.prototype, methods);

notificator
    .on('initialize', methods.bindElementEvents)
    .on('dispose', methods.unbindElementEvents);
