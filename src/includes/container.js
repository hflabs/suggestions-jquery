    (function(){
        /**
         * Methods related to suggestions dropdown list
         */

        var methods = {

            createContainer: function () {
                var that = this,
                    suggestionSelector = '.' + that.classes.suggestion,
                    options = that.options,
                    $container = $('<div/>')
                        .addClass(options.containerClass)
                        .css({
                            position: 'absolute',
                            display: 'none'
                        });

                that.$container = $container;
                that.$wrapper.append($container);

                // Only set width if it was provided:
                if (options.width !== 'auto') {
                    $container.width(options.width);
                }

                $container.on('mousedown' + eventNS, suggestionSelector, $.proxy(that.onSuggestionMousedown, that));
                $container.on('mouseover' + eventNS, suggestionSelector, $.proxy(that.onSuggestionMouseover, that));
                $container.on('click' + eventNS, suggestionSelector, $.proxy(that.onSuggestionClick, that));
                $container.on('mouseout' + eventNS, $.proxy(that.onSuggestionsMouseout, that));
            },

            applyContainerOptions: function () {
                var that = this,
                    options = that.options;

                // Adjust height, width and z-index:
                that.$container.css({
                    'max-height': options.maxHeight + 'px',
                    'z-index': options.zIndex,
                    'width': options.width
                });
            },

            // Dropdown event handlers

            /** This whole handler is needed to prevent blur event on textbox
             * when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
             * See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
             */
            onSuggestionMousedown: function (event) {
                var that = this;

                // prevent moving focus out of the text field
                event.preventDefault();

                // IE doesn't prevent moving focus even with event.preventDefault()
                // so we set a flag to know when we should ignore the blur event
                that.cancelBlur = true;
                utils.delay(function () {
                    delete that.cancelBlur;
                });

                // clicking on the scrollbar causes focus to shift to the body
                // but we can't detect a mouseup or a click immediately afterward
                // so we have to track the next mousedown and close the menu if
                // the user clicks somewhere outside of the autocomplete
                if (!$(event.target).closest(".ui-menu-item").length) {
                    utils.delay(function () {
                        $(document).one("mousedown", function (event) {
                            if (event.target !== that.element && !$.contains(that.$wrapper[0], event.target)) {
                                that.hide();
                            }
                        });
                    });
                }
            },

            /**
             * Listen for mouse over event on suggestions list:
             */
            onSuggestionMouseover: function (e) {
                this.activate(this.getClosestSuggestionIndex(e.target));
            },

            /**
             * Listen for click event on suggestions list:
             */
            onSuggestionClick: function (e) {
                var that = this;
                if (!that.dropdownDisabled) {
                    that.select(that.getClosestSuggestionIndex(e.target));
                }
                that.cancelFocus = true;
                that.el.focus();
            },

            /**
             * Deselect active element when mouse leaves suggestions container:
             */
            onSuggestionsMouseout: function () {
                this.deactivate(false);
            },

            // Dropdown UI methods

            setDropdownPosition: function (origin, elLayout) {
                var that = this;

                that.$container.css({
                    left: origin.left + 'px',
                    top: origin.top + elLayout.borderTop + elLayout.innerHeight + 'px',
                    width: (that.options.width === 'auto' ? that.el.outerWidth() : that.options.width) + 'px'
                });
            },

            getClosestSuggestionIndex: function (el) {
                var that = this,
                    $item = $(el),
                    selector = '.' + that.classes.suggestion + '[data-index]';
                if (!$item.is(selector)) {
                    $item = $item.closest(selector);
                }
                return $item.data('index');
            },

            getSuggestionsItems: function () {
                return this.$container.children('.' + this.classes.suggestion);
            },

            toggleDropdownEnabling: function (enable) {
                this.dropdownDisabled = !enable;
                this.$container.attr('disabled', !enable);
            },

            disableDropdown: function () {
                this.toggleDropdownEnabling(false);
            },

            enableDropdown: function () {
                this.toggleDropdownEnabling(true);
            },

            /**
             * Shows if there are any suggestions besides currently selected
             * @returns {boolean}
             */
            hasSuggestionsToChoose: function () {
                var that = this;
                return that.suggestions.length > 1 ||
                    (that.suggestions.length === 1 &&
                        (!that.selection || $.trim(that.suggestions[0].value) != $.trim(that.selection.value))
                    );
            },

            suggest: function () {
                if (!this.hasSuggestionsToChoose()) {
                    this.hide();
                    return;
                }

                var that = this,
                    options = that.options,
                    formatResult = options.formatResult,
                    trimmedValue = $.trim(that.getQuery(that.currentValue)),
                    beforeRender = options.beforeRender,
                    html = [],
                    index;

                // Build hint html
                if (options.hint && that.suggestions.length) {
                    html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
                }
                // Build suggestions inner HTML:
                $.each(that.suggestions, function (i, suggestion) {
                    html.push('<div class="' + that.classes.suggestion + '" data-index="' + i + '">' + formatResult(suggestion, trimmedValue) + '</div>');
                });

                that.$container.html(html.join(''));

                // Select first value by default:
                if (options.autoSelectFirst) {
                    that.selectedIndex = 0;
                    that.getSuggestionsItems().first().addClass(that.classes.selected);
                }

                if ($.isFunction(beforeRender)) {
                    beforeRender.call(that.element, that.$container);
                }

                that.$container.show();
                that.visible = true;
            },

            hide: function () {
                var that = this;
                that.visible = false;
                that.selectedIndex = -1;
                that.$container.hide()
                    .empty();
            },

            activate: function (index) {
                var that = this,
                    activeItem,
                    selected = that.classes.selected,
                    $children;

                if (!that.dropdownDisabled) {
                    $children = that.getSuggestionsItems();

                    $children.removeClass(selected);

                    that.selectedIndex = index;

                    if (that.selectedIndex !== -1 && $children.length > that.selectedIndex) {
                        activeItem = $children.get(that.selectedIndex);
                        $(activeItem).addClass(selected);
                        return activeItem;
                    }
                }

                return null;
            },

            deactivate: function (restoreValue) {
                var that = this;

                if (!that.dropdownDisabled) {
                    that.selectedIndex = -1;
                    that.getSuggestionsItems().removeClass(that.classes.selected);
                    if (restoreValue) {
                        that.el.val(that.currentValue);
                    }
                }
            },

            moveUp: function () {
                var that = this;

                if (that.dropdownDisabled) {
                    return;
                }
                if (that.selectedIndex === -1) {
                    if (that.suggestions.length) {
                        that.adjustScroll(that.suggestions.length - 1);
                    }
                    return;
                }

                if (that.selectedIndex === 0) {
                    that.deactivate(true);
                    return;
                }

                that.adjustScroll(that.selectedIndex - 1);
            },

            moveDown: function () {
                var that = this;

                if (that.dropdownDisabled) {
                    return;
                }
                if (that.selectedIndex === (that.suggestions.length - 1)) {
                    that.deactivate(true);
                    return;
                }

                that.adjustScroll(that.selectedIndex + 1);
            },

            adjustScroll: function (index) {
                var that = this,
                    activeItem = that.activate(index),
                    offsetTop,
                    upperBound,
                    lowerBound,
                    heightDelta = 25;

                if (!activeItem) {
                    return;
                }

                offsetTop = activeItem.offsetTop;
                upperBound = that.$container.scrollTop();
                lowerBound = upperBound + that.options.maxHeight - heightDelta;

                if (offsetTop < upperBound) {
                    that.$container.scrollTop(offsetTop);
                } else if (offsetTop > lowerBound) {
                    that.$container.scrollTop(offsetTop - that.options.maxHeight + heightDelta);
                }

                that.el.val(that.getValue(that.suggestions[index].value));
            }

        };

        $.extend(Suggestions.prototype, methods);

        initializeHooks.push(methods.createContainer);

        setOptionsHooks.push(methods.applyContainerOptions);

        fixPositionHooks.push(methods.setDropdownPosition);

        assignSuggestionsHooks.push(methods.suggest);

    }());