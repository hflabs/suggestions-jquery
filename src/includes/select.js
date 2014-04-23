    (function(){
        /**
         * Methods for selecting a suggestion
         */

        var methods = {

            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    index = that.selectedIndex;

                if (index === -1) {
                    var value = that.getQuery(that.el.val());
                    index = that.findSuggestionIndex(value);
                }
                that.select(index, selectionOptions);
            },

            /**
             * Selects a suggestion at specified index
             * @param index
             * @param selectionOptions  Contains flags:
             *          `continueSelecting` prevents hiding after selection,
             *          `noSpace` - prevents adding space at the end of current value
             */
            select: function (index, selectionOptions) {
                var that = this,
                    suggestion = that.suggestions[index],
                    continueSelecting = selectionOptions && selectionOptions.continueSelecting,
                    noSpace = selectionOptions && selectionOptions.noSpace;

                // if no suggestion to select
                if (!suggestion) {
                    if (!continueSelecting) {
                        that.triggerOnSelectNothing();
                    }
                    onSelectionCompleted();
                    return;
                }

                // Set input's value to prevent onValueChange handler
                that.currentValue = that.getValue(suggestion.value);
                that.el.val(that.currentValue);

                that.enrichService.enrichSuggestion.call(that, suggestion)
                    .done(function (enrichedSuggestion) {
                        var assumeDataComplete = that.type.isDataComplete.call(that, enrichedSuggestion.data);

                        if (that.options.type && assumeDataComplete) {
                            continueSelecting = false;
                        }

                        if (!noSpace && !assumeDataComplete) {
                            that.currentValue += ' ';
                            that.el.val(that.currentValue);
                        }
                        that.selection = enrichedSuggestion;

                        that.triggerOnSelect(enrichedSuggestion);
                        onSelectionCompleted();
                    });

                function onSelectionCompleted() {
                    if (continueSelecting) {
                        that.selectedIndex = -1;
                        that.getSuggestions(that.currentValue);
                    } else {
                        that.hide();
                        that.suggestions = [];
                    }
                }

            },

            triggerOnSelect: function(suggestion) {
                var that = this,
                    callback = that.options.onSelect;

                if ($.isFunction(callback)) {
                    callback.call(that.element, suggestion);
                }
            },

            triggerOnSelectNothing: function() {
                var that = this,
                    callback = that.options.onSelectNothing;

                if ($.isFunction(callback)) {
                    callback.call(that.element, that.currentValue);
                }
            },

            trySelectOnSpace: function (value) {
                var that = this,
                    rLastSpace = /\s$/,
                    index;

                if (that.options.triggerSelectOnSpace &&
                    that._waitingForTriggerSelectOnSpace &&
                    that._lastPressedKeyCode == keys.SPACE &&
                    rLastSpace.test(value)
                    ) {
                    index = that.findSuggestionIndex(value.replace(rLastSpace, ''));
                    if (index !== -1) {
                        that._waitingForTriggerSelectOnSpace = false;
                        that.select(index, {continueSelecting: true});
                    }
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        assignSuggestionsHooks.push(methods.trySelectOnSpace)

    }());