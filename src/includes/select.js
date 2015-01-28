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
                    continueSelecting = selectionOptions && selectionOptions.continueSelecting,
                    noSpace = selectionOptions && selectionOptions.noSpace;

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
                        var assumeDataComplete = that.type.isDataComplete.call(that, enrichedSuggestion),
                            formattedValue,
                            currentSelection = that.selection;

                        if (that.type.alwaysContinueSelecting) {
                            continueSelecting = true;
                        }

                        if (assumeDataComplete) {
                            continueSelecting = false;
                        }

                        if (hasBeenEnriched) {
                            that.suggestions[index] = enrichedSuggestion;
                        }
                        that.checkValueBounds(enrichedSuggestion);
                        if ($.isFunction(that.options.formatSelected)) {
                            formattedValue = that.options.formatSelected.call(that, enrichedSuggestion);
                        }

                        that.currentValue = (typeof formattedValue === 'string' && formattedValue.length)
                            ? formattedValue
                            : enrichedSuggestion.value;

                        if (!noSpace && !assumeDataComplete) {
                            that.currentValue += ' ';
                        }
                        that.el.val(that.currentValue);
                        that.selection = enrichedSuggestion;

                        if (!that.areSuggestionsSame(enrichedSuggestion, currentSelection)) {
                            that.trigger('Select', enrichedSuggestion);
                        }
                        that.onSelectComplete(continueSelecting);
                        that.shareWithParent(enrichedSuggestion);
                    });

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
            }

        };

        $.extend(Suggestions.prototype, methods);

    }());
