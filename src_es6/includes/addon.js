import $ from 'jquery';

import { notificator } from './notificator';
import { DEFAULT_OPTIONS } from './default-options';

/**
 * Methods related to right-sided component
 */

var QUEUE_NAME = 'addon',
    BEFORE_SHOW_ADDON = 50,
    BEFORE_RESTORE_PADDING = 1000;

var optionsUsed = {
    addon: null
};

var ADDON_TYPES = {
    'NONE': 'none',
    'SPINNER': 'spinner',
    'CLEAR': 'clear'
};

var Addon = function (owner) {
    var that = this,
        $el = $('<span class="suggestions-addon"/>');

    that.owner = owner;
    that.$el = $el;
    that.type = ADDON_TYPES.NONE;
    that.visible = false;
    that.initialPadding = null;

    $el.on('click', $.proxy(that, 'onClick'));
};

Addon.prototype = {

    checkType: function () {
        var that = this,
            type = that.owner.options.addon,
            isTypeCorrect = false;

        $.each(ADDON_TYPES, function (key, value) {
            isTypeCorrect = value == type;
            if (isTypeCorrect) {
                return false;
            }
        });

        if (!isTypeCorrect) {
            type = that.owner.isMobile ? ADDON_TYPES.CLEAR : ADDON_TYPES.SPINNER;
        }

        if (type != that.type) {
            that.type = type;
            that.$el.attr('data-addon-type', type);
            that.toggle(true);
        }
    },

    toggle: function (immediate) {
        var that = this,
            visible;

        switch (that.type) {
            case ADDON_TYPES.CLEAR:
                visible = !!that.owner.currentValue;
                break;
            case ADDON_TYPES.SPINNER:
                visible = !!that.owner.currentRequest;
                break;
            default:
                visible = false;
        }

        if (visible != that.visible) {
            that.visible = visible;
            if (visible) {
                that.show(immediate);
            } else {
                that.hide(immediate);
            }
        }
    },

    show: function (immediate) {
        var that = this,
            style = {'opacity': 1};

        if (immediate) {
            that.$el
                .show()
                .css(style);
            that.showBackground(true);
        } else {
            that.$el
                .stop(true, true)
                .delay(BEFORE_SHOW_ADDON)
                .queue(function () {
                    that.$el.show();
                    that.showBackground();
                    that.$el.dequeue();
                })
                .animate(style, 'fast');
        }
    },

    hide: function (immediate) {
        var that = this,
            style = {'opacity': 0};

        if (immediate) {
            that.$el
                .hide()
                .css(style);
        }
        that.$el
            .stop(true)
            .animate(style, {
                duration: 'fast',
                complete: function () {
                    that.$el.hide();
                    that.hideBackground();
                }
            });
    },

    fixPosition: function(origin, elLayout){
        var that = this,
            addonSize = elLayout.innerHeight;

        that.checkType();
        that.$el.css({
            left: origin.left + elLayout.borderLeft + elLayout.innerWidth - addonSize + 'px',
            top: origin.top + elLayout.borderTop + 'px',
            height: addonSize,
            width: addonSize
        });

        that.initialPadding = elLayout.paddingRight;
        that.width = addonSize;
        if (that.visible) {
            elLayout.componentsRight += addonSize;
        }
    },

    showBackground: function (immediate) {
        var that = this,
            $el = that.owner.el,
            style = {'paddingRight': that.width};

        if (that.width > that.initialPadding) {
            that.stopBackground();
            if (immediate) {
                $el.css(style);
            } else {
                $el
                    .animate(style, { duration: 'fast', queue: QUEUE_NAME })
                    .dequeue(QUEUE_NAME);
            }
        }
    },

    hideBackground: function (immediate) {
        var that = this,
            $el = that.owner.el,
            style = {'paddingRight': that.initialPadding};

        if (that.width > that.initialPadding) {
            that.stopBackground(true);
            if (immediate) {
                $el.css(style);
            } else {
                $el
                    .delay(BEFORE_RESTORE_PADDING, QUEUE_NAME)
                    .animate(style, { duration: 'fast', queue: QUEUE_NAME })
                    .dequeue(QUEUE_NAME);
            }
        }
    },

    stopBackground: function (gotoEnd) {
        this.owner.el.stop(QUEUE_NAME, true, gotoEnd);
    },

    onClick: function (e) {
        var that = this;

        if (that.type == ADDON_TYPES.CLEAR) {
            that.owner.clear();
        }
    }

};

var methods = {

    createAddon: function () {
        var that = this,
            addon = new Addon(that);

        that.$wrapper.append(addon.$el);
        that.addon = addon;
    },

    fixAddonPosition: function (origin, elLayout) {
        this.addon.fixPosition(origin, elLayout);
    },

    checkAddonType: function () {
        this.addon.checkType();
    },

    checkAddonVisibility: function () {
        this.addon.toggle();
    },

    stopBackground: function () {
        this.addon.stopBackground();
    }

};

$.extend(DEFAULT_OPTIONS, optionsUsed);

notificator
    .on('initialize', methods.createAddon)
    .on('setOptions', methods.checkAddonType)
    .on('fixPosition', methods.fixAddonPosition)
    .on('clear', methods.checkAddonVisibility)
    .on('valueChange', methods.checkAddonVisibility)
    .on('request', methods.checkAddonVisibility)
    .on('resetPosition', methods.stopBackground);