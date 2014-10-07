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
                    noSpace = selectionOptions && selectionOptions.noSpace,
                    addSpace = selectionOptions && selectionOptions.addSpace;

                // if no suggestion to select
                if (!suggestion) {
                    if (!continueSelecting && !that.selection) {
                        that.triggerOnSelectNothing();
                    }
                    onSelectionCompleted();
                    return;
                }

                that.enrichService.enrichSuggestion.call(that, suggestion)
                    .done(function (enrichedSuggestion) {
                        var assumeDataComplete = that.type.isDataComplete.call(that, enrichedSuggestion.data);

                        if (assumeDataComplete) {
                            continueSelecting = false;
                        }

                        that.currentValue = enrichedSuggestion.bounded_value || enrichedSuggestion.value;
                        if (!noSpace && !assumeDataComplete || addSpace) {
                            that.currentValue += ' ';
                        }
                        that.el.val(that.currentValue);
                        that.selection = enrichedSuggestion;

                        that.trigger('Select', enrichedSuggestion);
                        onSelectionCompleted();
                        that.shareWithParent(enrichedSuggestion);
                    });

                function onSelectionCompleted() {
                    if (continueSelecting) {
                        that.selectedIndex = -1;
                        that.updateSuggestions(that.currentValue);
                    } else {
                        that.hide();
                    }
                }

            },

            triggerOnSelectNothing: function() {
                this.trigger('SelectNothing', this.currentValue);
            },

            trigger: function(event) {
                var that = this,
                    args = utils.slice(arguments, 1),
                    callback = that.options['on' + event];

                if ($.isFunction(callback)) {
                    callback.apply(that.element, args);
                }
                that.el.trigger.apply(that.el, ['suggestions-' + event.toLowerCase()].concat(args));
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
                        that.select(index, {continueSelecting: true, addSpace: true});
                    }
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        assignSuggestionsHooks.push(methods.trySelectOnSpace)

    }());
