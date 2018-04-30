import { DEFAULT_OPTIONS } from './default-options';
import { collection_util } from './utils/collection';
import { jqapi } from './jqapi';
import { notificator } from './notificator';

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
    var $el = jqapi.select('<span class="suggestions-addon"/>');

    this.owner = owner;
    this.$el = $el;
    this.type = ADDON_TYPES.NONE;
    this.visible = false;
    this.initialPadding = null;

    $el.on('click', jqapi.proxy(this, 'onClick'));
};

Addon.prototype = {

    checkType: function() {
        var type = this.owner.options.addon;
        var isTypeCorrect = false;

        collection_util.each(ADDON_TYPES, function (value, key) {
            isTypeCorrect = value == type;
            if (isTypeCorrect) {
                return false;
            }
        });

        if (!isTypeCorrect) {
            type = this.owner.isMobile ? ADDON_TYPES.CLEAR : ADDON_TYPES.SPINNER;
        }

        if (type != this.type) {
            this.type = type;
            this.$el.attr('data-addon-type', type);
            this.toggle(true);
        }
    },

    isEnabled: function() {
        return !this.owner.isElementDisabled();
    },

    toggle: function(immediate) {
        var visible;

        switch (this.type) {
            case ADDON_TYPES.CLEAR:
                visible = !!this.owner.currentValue;
                break;
            case ADDON_TYPES.SPINNER:
                visible = !!this.owner.currentRequest;
                break;
            default:
                visible = false;
        }

        if (!this.isEnabled()) {
            visible = false;
        }

        if (visible != this.visible) {
            this.visible = visible;
            if (visible) {
                this.show(immediate);
            } else {
                this.hide(immediate);
            }
        }
    },

    show: function(immediate) {
        var that = this;
        var style = {'opacity': 1};

        if (immediate) {
            this.$el
                .show()
                .css(style);
                this.showBackground(true);
        } else {
            this.$el
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

    hide: function(immediate) {
        var that = this;
        var style = {'opacity': 0};

        if (immediate) {
            this.$el
                .hide()
                .css(style);
        }
        this.$el
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
        var addonSize = elLayout.innerHeight;

        this.checkType();
        this.$el.css({
            left: origin.left + elLayout.borderLeft + elLayout.innerWidth - addonSize + 'px',
            top: origin.top + elLayout.borderTop + 'px',
            height: addonSize,
            width: addonSize
        });

        this.initialPadding = elLayout.paddingRight;
        this.width = addonSize;
        if (this.visible) {
            elLayout.componentsRight += addonSize;
        }
    },

    showBackground: function(immediate) {
        var $el = this.owner.el;
        var style = {'paddingRight': this.width};

        if (this.width > this.initialPadding) {
            this.stopBackground();
            if (immediate) {
                $el.css(style);
            } else {
                $el
                    .animate(style, { duration: 'fast', queue: QUEUE_NAME })
                    .dequeue(QUEUE_NAME);
            }
        }
    },

    hideBackground: function(immediate) {
        var $el = this.owner.el;
        var style = {'paddingRight': this.initialPadding};

        if (this.width > this.initialPadding) {
            this.stopBackground(true);
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

    stopBackground: function(gotoEnd) {
        this.owner.el.stop(QUEUE_NAME, true, gotoEnd);
    },

    onClick: function(e) {
        if (this.isEnabled() && this.type == ADDON_TYPES.CLEAR) {
            this.owner.clear();
        }
    }
};

var methods = {
    createAddon: function() {
        var addon = new Addon(this);
        this.$wrapper.append(addon.$el);
        this.addon = addon;
    },

    fixAddonPosition: function(origin, elLayout) {
        this.addon.fixPosition(origin, elLayout);
    },

    checkAddonType: function() {
        this.addon.checkType();
    },

    checkAddonVisibility: function() {
        this.addon.toggle();
    },

    stopBackground: function() {
        this.addon.stopBackground();
    }
};

jqapi.extend(DEFAULT_OPTIONS, optionsUsed);

notificator
    .on('initialize', methods.createAddon)
    .on('setOptions', methods.checkAddonType)
    .on('fixPosition', methods.fixAddonPosition)
    .on('clear', methods.checkAddonVisibility)
    .on('valueChange', methods.checkAddonVisibility)
    .on('request', methods.checkAddonVisibility)
    .on('resetPosition', methods.stopBackground);