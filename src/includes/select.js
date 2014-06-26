    (function(){
        /**
         * Methods for selecting a suggestion
         */

        var methods = {

            proceedQuery: function (query) {
                var that = this;

                if (query.length >= that.options.minChars) {
                    that.getSuggestions(query);
                } else {
                    that.hide();
                }
            },

            /**
             * Selects current or first matched suggestion
             * @param selectionOptions
             * @returns {number} index of found suggestion
             */
            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    index = that.selectedIndex,
                    trim = selectionOptions && selectionOptions.trim;

                if (index === -1) {
                    var value = that.getQuery(that.el.val());
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
                    continueSelecting = selectionOptions && selectionOptions.continueSelecting,
                    noSpace = selectionOptions && selectionOptions.noSpace;

                // if no suggestion to select
                if (!suggestion) {
                    if (!continueSelecting && !that.selection) {
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

                        if (assumeDataComplete) {
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
                    rLastSpace.test(value)
                    ) {
                    index = that.findSuggestionIndex($.trim(value));
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
