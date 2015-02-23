    (function(){
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
             * @returns {$.Deferred} promise, resolved with index of selected suggestion
             */
            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    result = $.Deferred();

                // force onValueChange to be executed if it has been deferred
                that.inputPhase.resolve();

                that.dataPhase
                    .done(function () {
                        result.resolve(that.doSelectCurrentValue(selectionOptions));
                    });

                return result;
            },

            /**
             * Selects current or first matched suggestion
             * @param selectionOptions
             * @returns {number} index of found suggestion
             */
            doSelectCurrentValue: function(selectionOptions) {
                var that = this,
                    index = that.selectedIndex,
                    trim = selectionOptions && selectionOptions.trim,
                    value;

                if (index === -1) {
                    value = that.el.val();
                    if (trim) {
                        value = $.trim(value);
                    }
                    index = that.findSuggestionIndex(value);
                }
                that.select(index, selectionOptions);

                return index;
            },

            /**
             * Selects a suggestion at specified index
             * @param index index of suggestion to select. Can be -1
             * @param selectionOptions  Contains flags:
             *          `continueSelecting` prevents hiding after selection,
             *          `noSpace` - prevents adding space at the end of current value
             */
            select: function (index, selectionOptions) {
                var that = this,
                    suggestion = that.suggestions[index],
                    continueSelecting = selectionOptions && selectionOptions.continueSelecting;

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

                that.enrichSuggestion(suggestion, selectionOptions)
                    .done(function (enrichedSuggestion, hasBeenEnriched) {
                        that.selectSuggestion(enrichedSuggestion, index, $.extend({
                            hasBeenEnriched: hasBeenEnriched
                        }, selectionOptions));
                    });

            },

            /**
             * Formats and selects final (enriched) suggestion
             * @param suggestion
             * @param index
             * @param selectionOptions
             */
            selectSuggestion: function (suggestion, index, selectionOptions) {
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

                if (selectionOptions.hasBeenEnriched) {
                    that.suggestions[index] = suggestion;
                }

                that.checkValueBounds(suggestion);
                that.currentValue = that.getSuggestionValue(suggestion);

                if (that.currentValue && !selectionOptions.noSpace && !assumeDataComplete) {
                    that.currentValue += ' ';
                }
                that.el.val(that.currentValue);

                if (that.currentValue) {
                    that.selection = suggestion;
                    if (!that.areSuggestionsSame(suggestion, currentSelection)) {
                        that.trigger('Select', suggestion);
                    }
                    that.onSelectComplete(continueSelecting);
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
                that.el.trigger.apply(that.el, ['suggestions-' + event.toLowerCase()].concat(args));
                that.triggering[event] = false;
            }

        };

        $.extend(Suggestions.prototype, methods);

    }());
