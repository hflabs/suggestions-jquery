    (function(){
        /**
         * Methods for selecting a suggestion
         */

        var methods = {

            selectExpectedComponents: function () {
                var that = this,
                    type = that.options.type,
                    params = that.options.params;

                switch (type) {
                    case 'NAME':
                        that.expectedComponents = $.map(params && params.parts || ['surname', 'name', 'patronymic'], function (part) {
                            return part.toLowerCase();
                        });
                        break;
                    case 'ADDRESS':
                        that.expectedComponents = ['house'];
                        break;
                    default:
                        that.expectedComponents = [];
                }
            },

            hasAllExpectedComponents: function (suggestion) {
                var result = true;
                $.each(this.expectedComponents, function (i, part) {
                    return result = !!suggestion.data[part];
                });
                return result;
            },

            selectCurrentValue: function (selectionOptions) {
                var that = this,
                    index = that.selectedIndex,
                    noHide = selectionOptions && selectionOptions.noHide;

                if (index === -1) {
                    var value = that.getQuery(that.el.val());
                    index = that.findSuggestionIndex(value);
                }
                if (index !== -1) {
                    that.select(index, selectionOptions);
                } else {
                    if (!noHide) {
                        that.hide();
                    }
                }
            },

            /**
             * Selects a suggestion at specified index
             * @param index
             * @param selectionOptions  Contains flags:
             *          `noHide` prevents hiding after selection,
             *          `noSpace` - prevents adding space at the end of current value
             */
            select: function (index, selectionOptions) {
                var that = this,
                    suggestion = that.suggestions[index],
                    onSelectCallback = that.options.onSelect,
                    noHide = selectionOptions && selectionOptions.noHide,
                    noSpace = selectionOptions && selectionOptions.noSpace,
                    assumeDataComplete;

                function onSelectionCompleted() {
                    if (noHide) {
                        that.selectedIndex = -1;
                        that.getSuggestions(that.currentValue);
                    } else {
                        that.hide();
                        that.suggestions = [];
                    }
                }

                if (!suggestion) {
                    return;
                }

                assumeDataComplete = that.hasAllExpectedComponents(suggestion);
                if (that.options.type && assumeDataComplete) {
                    noHide = false;
                }
                that.currentValue = that.getValue(suggestion.value);
                if (!noSpace && !assumeDataComplete) {
                    that.currentValue += ' ';
                }
                that.el.val(that.currentValue);
                that.selection = suggestion;

                // if onSelect exists, trigger it with enriched suggestion
                if ($.isFunction(onSelectCallback)) {
                    that.enrichService.enrichSuggestion.call(that, suggestion)
                        .done(function (enrichedSuggestion) {
                            onSelectCallback.call(that.element, enrichedSuggestion);
                            onSelectionCompleted();
                        });
                } else {
                    onSelectionCompleted();
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
                        that.select(index, {noHide: true});
                    }
                }
            }

        };

        $.extend(Suggestions.prototype, methods);

        setOptionsHooks.push(methods.selectExpectedComponents);

        assignSuggestionsHooks.push(methods.trySelectOnSpace)

    }());