    (function(){
        /**
         * Methods related to suggestions dropdown list
         */

        var wordDelimeters = '\\s"\'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>',
            wordSplitter = new RegExp('[' + wordDelimeters + ']+', 'g'),
            wordPartsDelimeters = '\\-\\+\\/\\\\\\?!@#$%^&',
            wordPartsSplitter = new RegExp('[' + wordPartsDelimeters + ']+', 'g'),
            nonWordSymbols = wordDelimeters + wordPartsDelimeters;

        function formatToken(token) {
            return token.toLowerCase().replace(/[ёЁ]/g, 'е');
        }

        function withSubTokens(tokens) {
            var result = [];

            $.each(tokens, function (i, token) {
                var subtokens = token.split(wordPartsSplitter);

                if (subtokens.length > 1) {
                    result = result.concat(subtokens);
                }
                result.push(token);
            });

            return result;
        }

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

                $container.on('click' + eventNS, suggestionSelector, $.proxy(that.onSuggestionClick, that));
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

            /**
             * Listen for click event on suggestions list:
             */
            onSuggestionClick: function (e) {
                var that = this,
                    $el = $(e.target),
                    index;

                if (!that.dropdownDisabled) {
                    while ($el.length && !(index = $el.attr('data-index'))) {
                        $el = $el.closest('.' + that.classes.suggestion);
                    }
                    if (index && !isNaN(index)) {
                        that.select(+index);
                    }
                }
                that.cancelFocus = true;
                that.el.focus();
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
                    formatResult = options.formatResult || that.type.formatResult || that.formatResult,
                    unformattableTokens = that.type.STOPWORDS,
                    trimmedValue = $.trim(that.getQuery(that.currentValue)),
                    beforeRender = options.beforeRender,
                    html = [],
                    index;

                // Build hint html
                if (options.hint && that.suggestions.length) {
                    html.push('<div class="' + that.classes.hint + '">' + options.hint + '</div>');
                }
                that.selectedIndex = -1;
                // Build suggestions inner HTML:
                $.each(that.suggestions, function (i, suggestion) {
                    if (suggestion == that.selection) {
                        that.selectedIndex = i;
                    }
                    html.push(
                        '<div class="' + that.classes.suggestion + '" data-index="' + i + '">' +
                            formatResult.call(that, suggestion.value, trimmedValue, suggestion, unformattableTokens) +
                        '</div>'
                    );
                });

                that.$container.html(html.join(''));

                // Select first value by default:
                if (options.autoSelectFirst && that.selectedIndex === -1) {
                    that.selectedIndex = 0;
                }
                if (that.selectedIndex !== -1) {
                    that.getSuggestionsItems().eq(that.selectedIndex).addClass(that.classes.selected);
                }

                if ($.isFunction(beforeRender)) {
                    beforeRender.call(that.element, that.$container);
                }

                that.$container.show();
                that.visible = true;
            },

            formatResult: function (value, currentValue, suggestion, unformattableTokens) {

                var chunks = [],
                    tokens = formatToken(currentValue).split(wordSplitter),
                    partialTokens = withSubTokens([tokens[tokens.length -1]]),
                    partialMatchers = {},
                    rWords = new RegExp('([^' + nonWordSymbols + ']*)([' + nonWordSymbols + ']*)', 'g'),
                    match, word;

                tokens = withSubTokens(tokens);

                // check for matching words
                while ((match = rWords.exec(value)) && match[0]) {
                    word = match[1] && formatToken(match[1]);
                    if (word) {
                        chunks.push({
                            wordFormatted: word,
                            wordOriginal: match[1],
                            matched: $.inArray(word, unformattableTokens) === -1 && $.inArray(word, tokens) >= 0,
                            rest: match[2]
                        });
                    } else {
                        chunks.push({
                            rest: match[0]
                        });
                    }
                }

                // check for partial match
                $.each(partialTokens, function (i, token) {
                    partialMatchers[token] = new RegExp('^' + utils.escapeRegExChars(token) + '[^' + nonWordSymbols + ']+', 'i');
                });
                $.each(chunks, function (i, chunk) {
                    if (!chunk.matched && chunk.wordFormatted && $.inArray(chunk.wordFormatted, unformattableTokens) === -1) {
                        $.each(partialMatchers, function (token, matcher) {
                            if (matcher.test(chunk.wordFormatted)) {
                                chunk.matched = true;
                                chunk.rest = chunk.wordOriginal.substr(token.length) + chunk.rest;
                                chunk.wordOriginal = chunk.wordOriginal.substr(0, token.length);
                                return false;
                            }
                        });
                    }
                });

                // format chunks
                return $.map(chunks, function (chunk) {
                    var text = utils.escapeHtml(chunk.wordOriginal);

                    if (text && chunk.matched) {
                        text = '<strong>' + text + '</strong>';
                    }
                    if (chunk.rest) {
                        text += utils.escapeHtml(chunk.rest);
                    }

                    return text;
                }).join('');
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
                    $activeItem,
                    selected = that.classes.selected,
                    $children;

                if (!that.dropdownDisabled) {
                    $children = that.getSuggestionsItems();

                    $children.removeClass(selected);

                    that.selectedIndex = index;

                    if (that.selectedIndex !== -1 && $children.length > that.selectedIndex) {
                        $activeItem = $children.eq(that.selectedIndex);
                        $activeItem.addClass(selected);
                        return $activeItem;
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
                    $activeItem = that.activate(index),
                    itemTop,
                    itemBottom,
                    scrollTop = that.$container.scrollTop(),
                    containerHeight;

                if (!$activeItem || !$activeItem.length) {
                    return;
                }

                itemTop = $activeItem.position().top;
                if (itemTop < 0 ) {
                    that.$container.scrollTop(scrollTop + itemTop);
                } else {
                    itemBottom = itemTop + $activeItem.outerHeight();
                    containerHeight = that.$container.innerHeight();
                    if (itemBottom > containerHeight) {
                        that.$container.scrollTop(scrollTop - containerHeight + itemBottom);
                    }
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