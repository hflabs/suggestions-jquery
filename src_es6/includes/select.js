import $ from 'jquery';

import { utils } from './utils';
import { Suggestions } from './suggestions';
import { notificator } from './notificator';

/**
 * Methods for selecting a suggestion
 */

var methods = {

    proceedQuery: function (query) {
        var that = this;

        if (query.length >= that.options.minChars) {
            that.updateSuggestions(query);
        } else {
            that.hide();
        }
    },

    /**
     * Selects current or first matched suggestion, but firstly waits for data ready
     * @param selectionOptions
     * @returns {$.Deferred} promise, resolved with index of selected suggestion or rejected if nothing matched
     */
    selectCurrentValue: function (selectionOptions) {
        var that = this,
            result = $.Deferred();

        // force onValueChange to be executed if it has been deferred
        that.inputPhase.resolve();

        that.fetchPhase
            .done(function () {
                var index;

                // When suggestion has already been selected and not modified
                if (that.selection && !that.visible) {
                    result.reject();
                } else {
                    index = that.findSuggestionIndex();

                    that.select(index, selectionOptions);

                    if (index === -1) {
                        result.reject();
                    } else {
                        result.resolve(index);
                    }
                }
            })
            .fail(function () {
                result.reject();
            });

        return result;
    },

    /**
     * Selects first when user interaction is not supposed
     */
    selectFoundSuggestion: function () {
        var that = this;

        if (!that.requestMode.userSelect) {
            that.select(0);
        }
    },

    /**
     * Selects current or first matched suggestion
     * @returns {number} index of found suggestion
     */
    findSuggestionIndex: function() {
        var that = this,
            index = that.selectedIndex,
            value;

        if (index === -1) {
            // matchers always operate with trimmed strings
            value = $.trim(that.el.val());
            if (value) {
                $.each(that.type.matchers, function (i, matcher) {
                    index = matcher(value, that.suggestions);
                    return index === -1;
                });
            }
        }

        return index;
    },

    /**
     * Selects a suggestion at specified index
     * @param index index of suggestion to select. Can be -1
     * @param {Object} selectionOptions
     * @param {boolean} [selectionOptions.continueSelecting]  prevents hiding after selection
     * @param {boolean} [selectionOptions.noSpace]  prevents adding space at the end of current value
     */
    select: function (index, selectionOptions) {
        var that = this,
            suggestion = that.suggestions[index],
            continueSelecting = selectionOptions && selectionOptions.continueSelecting,
            currentValue = that.currentValue,
            hasSameValues;

        // Prevent recursive execution
        if (that.triggering['Select'])
            return;

        // if no suggestion to select
        if (!suggestion) {
            if (!continueSelecting && !that.selection) {
                that.triggerOnSelectNothing();
            }
            that.onSelectComplete(continueSelecting);
            return;
        }

        hasSameValues = that.hasSameValues(suggestion);

        that.enrichSuggestion(suggestion, selectionOptions)
            .done(function (enrichedSuggestion, hasBeenEnriched) {
                that.selectSuggestion(enrichedSuggestion, index, currentValue, $.extend({
                    hasBeenEnriched: hasBeenEnriched,
                    hasSameValues: hasSameValues
                }, selectionOptions));
            });

    },

    /**
     * Formats and selects final (enriched) suggestion
     * @param suggestion
     * @param index
     * @param lastValue
     * @param {Object} selectionOptions
     * @param {boolean} [selectionOptions.continueSelecting]  prevents hiding after selection
     * @param {boolean} [selectionOptions.noSpace]  prevents adding space at the end of current value
     * @param {boolean} selectionOptions.hasBeenEnriched
     * @param {boolean} selectionOptions.hasSameValues
     */
    selectSuggestion: function (suggestion, index, lastValue, selectionOptions) {
        var that = this,
            continueSelecting = selectionOptions.continueSelecting,
            assumeDataComplete = !that.type.isDataComplete || that.type.isDataComplete.call(that, suggestion),
            currentSelection = that.selection;

        // Prevent recursive execution
        if (that.triggering['Select'])
            return;

        if (that.type.alwaysContinueSelecting) {
            continueSelecting = true;
        }

        if (assumeDataComplete) {
            continueSelecting = false;
        }

        // `suggestions` cat be empty, e.g. during `fixData`
        if (selectionOptions.hasBeenEnriched && that.suggestions[index]) {
            that.suggestions[index].data = suggestion.data;
        }

        if (that.requestMode.updateValue) {
            that.checkValueBounds(suggestion);
            that.currentValue = that.getSuggestionValue(suggestion, selectionOptions);

            if (that.currentValue && !selectionOptions.noSpace && !assumeDataComplete) {
                that.currentValue += ' ';
            }
            that.el.val(that.currentValue);
        }

        if (that.currentValue) {
            that.selection = suggestion;
            if (!that.areSuggestionsSame(suggestion, currentSelection)) {
                that.trigger('Select', suggestion, that.currentValue != lastValue);
            }
            if (that.requestMode.userSelect) {
                that.onSelectComplete(continueSelecting);
            }
        } else {
            that.selection = null;
            that.triggerOnSelectNothing();
        }

        that.shareWithParent(suggestion);
    },

    onSelectComplete: function (continueSelecting) {
        var that = this;

        if (continueSelecting) {
            that.selectedIndex = -1;
            that.updateSuggestions(that.currentValue);
        } else {
            that.hide();
        }
    },

    triggerOnSelectNothing: function () {
        var that = this;

        if (!that.triggering['SelectNothing']) {
            that.trigger('SelectNothing', that.currentValue);
        }
    },

    trigger: function (event) {
        var that = this,
            args = utils.slice(arguments, 1),
            callback = that.options['on' + event];

        that.triggering[event] = true;
        if ($.isFunction(callback)) {
            callback.apply(that.element, args);
        }
        that.el.trigger.call(that.el, 'suggestions-' + event.toLowerCase(), args);
        that.triggering[event] = false;
    }

};

$.extend(Suggestions.prototype, methods);

notificator
    .on('assignSuggestions', methods.selectFoundSuggestion);