/**
 * Suggestions-jquery plugin, version 4.1.2
 *
 * Suggestions-jquery plugin is freely distributable under the terms of MIT-style license
 * Depends on Ajax Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)
 * For details, see https://github.com/hflabs/suggestions-jquery
 */
!function(factory) {
    "use strict";
    "function" == typeof define && define.amd ? define([ "jquery" ], factory) : factory(jQuery);
}(function($) {
    "use strict";
    function Suggestions(el, options) {
        var noop = function() {}, that = this, defaults = {
            autoSelectFirst: !1,
            appendTo: "body",
            serviceUrl: null,
            lookup: null,
            onSelect: null,
            width: "auto",
            minChars: 1,
            maxHeight: 300,
            deferRequestBy: 0,
            params: {},
            formatResult: Suggestions.formatResult,
            delimiter: null,
            zIndex: 9999,
            type: "POST",
            noCache: !1,
            onSearchStart: noop,
            onSearchComplete: noop,
            onSearchError: noop,
            containerClass: "autocomplete-suggestions",
            tabDisabled: !1,
            dataType: "json",
            contentType: "application/json",
            currentRequest: null,
            triggerSelectOnValidInput: !0,
            preventBadQueries: !0,
            lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
                return -1 !== suggestion.value.toLowerCase().indexOf(queryLowerCase);
            },
            paramName: "query",
            transformResult: function(response) {
                return "string" == typeof response ? $.parseJSON(response) : response;
            },
            selectOnSpace: !1
        };
        that.element = el, that.el = $(el), that.suggestions = [], that.badQueries = [], 
        that.selectedIndex = -1, that.currentValue = that.element.value, that.intervalId = 0, 
        that.cachedResponse = {}, that.onChangeInterval = null, that.onChange = null, that.isLocal = !1, 
        that.suggestionsContainer = null, that.options = $.extend({}, defaults, options), 
        that.classes = {
            selected: "autocomplete-selected",
            suggestion: "autocomplete-suggestion"
        }, that.hint = null, that.hintValue = "", that.selection = null, that.initialize(), 
        that.setOptions(options);
    }
    var utils = function() {
            return {
                escapeRegExChars: function(value) {
                    return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                },
                createNode: function(containerClass) {
                    var div = document.createElement("div");
                    return div.className = containerClass, div.style.position = "absolute", div.style.display = "none", 
                    div;
                }
            };
        }(), keys = {
            ESC: 27,
            TAB: 9,
            RETURN: 13,
            SPACE: 32,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40
        },
        eventNS = '.suggestions',
        dataAttrKey = "suggestions";
        
    Suggestions.utils = utils, $.Suggestions = Suggestions, Suggestions.formatResult = function(suggestion, currentValue) {
        var pattern = "(" + utils.escapeRegExChars(currentValue) + ")";
        return suggestion.value.replace(new RegExp(pattern, "gi"), "<strong>$1</strong>");
    }, Suggestions.prototype = {
        killerFn: null,
        initialize: function() {
            var container, that = this, suggestionSelector = "." + that.classes.suggestion, selected = that.classes.selected, options = that.options;
            that.element.setAttribute("suggestions", "off"), that.killerFn = function(e) {
                0 === $(e.target).closest("." + that.options.containerClass).length && (that.killSuggestions(), 
                that.disableKillerFn());
            }, that.suggestionsContainer = Suggestions.utils.createNode(options.containerClass), 
            container = $(that.suggestionsContainer), container.appendTo(options.appendTo), 
            "auto" !== options.width && container.width(options.width), container.on("mouseover" + eventNS, suggestionSelector, function() {
                that.activate($(this).data("index"));
            }), container.on("mouseout" + eventNS, function() {
                that.selectedIndex = -1, container.children("." + selected).removeClass(selected);
            }), container.on("click" + eventNS, suggestionSelector, function() {
                that.select($(this).data("index"));
            }), that.fixPosition(), that.fixPositionCapture = function() {
                that.visible && that.fixPosition();
            }, $(window).on("resize" + eventNS, that.fixPositionCapture), that.el.on("keydown" + eventNS, function(e) {
                that.onKeyPress(e);
            }), that.el.on("keyup" + eventNS, function(e) {
                that.onKeyUp(e);
            }), that.el.on("blur" + eventNS, function() {
                that.onBlur();
            }), that.el.on("focus" + eventNS, function() {
                that.onFocus();
            }), that.el.on("change" + eventNS, function(e) {
                that.onKeyUp(e);
            });
        },
        onFocus: function() {
            var that = this;
            that.fixPosition(), that.options.minChars <= that.el.val().length && that.onValueChange();
        },
        onBlur: function() {
            this.enableKillerFn();
        },
        setOptions: function(suppliedOptions) {
            var that = this, options = that.options;
            $.extend(options, suppliedOptions), that.isLocal = $.isArray(options.lookup), that.isLocal && (options.lookup = that.verifySuggestionsFormat(options.lookup)), 
            $(that.suggestionsContainer).css({
                "max-height": options.maxHeight + "px",
                width: options.width + "px",
                "z-index": options.zIndex
            });
        },
        clearCache: function() {
            this.cachedResponse = {}, this.badQueries = [];
        },
        clear: function() {
            this.clearCache(), this.currentValue = "", this.suggestions = [];
        },
        disable: function() {
            var that = this;
            that.disabled = !0, that.currentRequest && that.currentRequest.abort();
        },
        enable: function() {
            this.disabled = !1;
        },
        fixPosition: function() {
            var offset, styles, that = this;
            "body" === that.options.appendTo && (offset = that.el.offset(), styles = {
                top: offset.top + that.el.outerHeight() + "px",
                left: offset.left + "px"
            }, "auto" === that.options.width && (styles.width = that.el.outerWidth() - 2 + "px"), 
            $(that.suggestionsContainer).css(styles));
        },
        enableKillerFn: function() {
            var that = this;
            $(document).on("click" + eventNS, that.killerFn);
        },
        disableKillerFn: function() {
            var that = this;
            $(document).off("click" + eventNS, that.killerFn);
        },
        killSuggestions: function() {
            var that = this;
            that.stopKillSuggestions(), that.intervalId = window.setInterval(function() {
                that.hide(), that.stopKillSuggestions();
            }, 50);
        },
        stopKillSuggestions: function() {
            window.clearInterval(this.intervalId);
        },
        isCursorAtEnd: function() {
            var range, that = this, valLength = that.el.val().length, selectionStart = that.element.selectionStart;
            return "number" == typeof selectionStart ? selectionStart === valLength : document.selection ? (range = document.selection.createRange(), 
            range.moveStart("character", -valLength), valLength === range.text.length) : !0;
        },
        onKeyPress: function(e) {
            var that = this;
            if (!that.disabled && !that.visible && e.which === keys.DOWN && that.currentValue) return void that.suggest();
            if (!that.disabled && that.visible) {
                switch (e.which) {
                  case keys.ESC:
                    that.el.val(that.currentValue), that.hide();
                    break;

                  case keys.RIGHT:
                    if (that.hint && that.options.onHint && that.isCursorAtEnd()) {
                        that.selectHint();
                        break;
                    }
                    return;

                  case keys.TAB:
                    if (that.hint && that.options.onHint) return void that.selectHint();

                  case keys.RETURN:
                    if (-1 === that.selectedIndex) return void that.hide();
                    if (that.select(that.selectedIndex), e.which === keys.TAB && that.options.tabDisabled === !1) return;
                    break;

                  case keys.SPACE:
                    return void (options.selectOnSpace && -1 !== that.selectedIndex && that.onSelect(that.selectedIndex));

                  case keys.UP:
                    that.moveUp();
                    break;

                  case keys.DOWN:
                    that.moveDown();
                    break;

                  default:
                    return;
                }
                e.stopImmediatePropagation(), e.preventDefault();
            }
        },
        onKeyUp: function(e) {
            var that = this;
            if (!that.disabled) {
                switch (e.which) {
                  case keys.UP:
                  case keys.DOWN:
                    return;
                }
                clearInterval(that.onChangeInterval), that.currentValue !== that.el.val() && (that.findBestHint(), 
                that.options.deferRequestBy > 0 ? that.onChangeInterval = setInterval(function() {
                    that.onValueChange();
                }, that.options.deferRequestBy) : that.onValueChange());
            }
        },
        onValueChange: function() {
            var index, that = this, options = that.options, value = that.el.val(), query = that.getQuery(value);
            return that.selection && (that.selection = null, (options.onInvalidateSelection || $.noop).call(that.element)), 
            clearInterval(that.onChangeInterval), that.currentValue = value, that.selectedIndex = -1, 
            options.triggerSelectOnValidInput && (index = that.findSuggestionIndex(query), -1 !== index) ? void that.select(index) : void (query.length < options.minChars ? that.hide() : that.getSuggestions(query));
        },
        findSuggestionIndex: function(query) {
            var that = this, index = -1, queryLowerCase = query.toLowerCase();
            return $.each(that.suggestions, function(i, suggestion) {
                return suggestion.value.toLowerCase() === queryLowerCase ? (index = i, !1) : void 0;
            }), index;
        },
        getQuery: function(value) {
            var parts, delimiter = this.options.delimiter;
            return delimiter ? (parts = value.split(delimiter), $.trim(parts[parts.length - 1])) : value;
        },
        getSuggestionsLocal: function(query) {
            var data, that = this, options = that.options, queryLowerCase = query.toLowerCase(), filter = options.lookupFilter, limit = parseInt(options.lookupLimit, 10);
            return data = {
                suggestions: $.grep(options.lookup, function(suggestion) {
                    return filter(suggestion, query, queryLowerCase);
                })
            }, limit && data.suggestions.length > limit && (data.suggestions = data.suggestions.slice(0, limit)), 
            data;
        },
        getSuggestions: function(q) {
            var response, params, cacheKey, that = this, options = that.options, serviceUrl = options.serviceUrl;
            if (options.params[options.paramName] = q, params = options.ignoreParams ? null : options.params, 
            that.isLocal ? response = that.getSuggestionsLocal(q) : ($.isFunction(serviceUrl) && (serviceUrl = serviceUrl.call(that.element, q)), 
            cacheKey = serviceUrl + "?" + $.param(params || {}), response = that.cachedResponse[cacheKey]), 
            response && $.isArray(response.suggestions)) that.suggestions = response.suggestions, 
            that.suggest(); else if (!that.isBadQuery(q)) {
                if (options.onSearchStart.call(that.element, options.params) === !1) return;
                that.currentRequest && that.currentRequest.abort(), that.currentRequest = $.ajax({
                    url: serviceUrl,
                    data: JSON.stringify(params),
                    type: options.type,
                    dataType: options.dataType,
                    contentType: options.contentType
                }).done(function(data) {
                    var result;
                    that.currentRequest = null, result = options.transformResult(data), that.processResponse(result, q, cacheKey), 
                    options.onSearchComplete.call(that.element, q, result.suggestions);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    options.onSearchError.call(that.element, q, jqXHR, textStatus, errorThrown);
                });
            }
        },
        isBadQuery: function() {
            return !1;
        },
        hide: function() {
            var that = this;
            that.visible = !1, that.selectedIndex = -1, $(that.suggestionsContainer).hide(), 
            that.signalHint(null);
        },
        suggest: function() {
            if (0 === this.suggestions.length) return void this.hide();
            var index, width, that = this, options = that.options, formatResult = options.formatResult, value = that.getQuery(that.currentValue), className = that.classes.suggestion, classSelected = that.classes.selected, container = $(that.suggestionsContainer), beforeRender = options.beforeRender, html = "";
            return options.triggerSelectOnValidInput && (index = that.findSuggestionIndex(value), 
            -1 !== index) ? void that.select(index) : ($.each(that.suggestions, function(i, suggestion) {
                html += '<div class="' + className + '" data-index="' + i + '">' + formatResult(suggestion, value) + "</div>";
            }), "auto" === options.width && (width = that.el.outerWidth() - 2, container.width(width > 0 ? width : 300)), 
            container.html(html), options.autoSelectFirst && (that.selectedIndex = 0, container.children().first().addClass(classSelected)), 
            $.isFunction(beforeRender) && beforeRender.call(that.element, container), container.show(), 
            that.visible = !0, void that.findBestHint());
        },
        findBestHint: function() {
            var that = this, value = that.el.val().toLowerCase(), bestMatch = null;
            value && ($.each(that.suggestions, function(i, suggestion) {
                var foundMatch = 0 === suggestion.value.toLowerCase().indexOf(value);
                return foundMatch && (bestMatch = suggestion), !foundMatch;
            }), that.signalHint(bestMatch));
        },
        signalHint: function(suggestion) {
            var hintValue = "", that = this;
            suggestion && (hintValue = that.currentValue + suggestion.value.substr(that.currentValue.length)), 
            that.hintValue !== hintValue && (that.hintValue = hintValue, that.hint = suggestion, 
            (this.options.onHint || $.noop)(hintValue));
        },
        verifySuggestionsFormat: function(suggestions) {
            return suggestions.length && "string" == typeof suggestions[0] ? $.map(suggestions, function(value) {
                return {
                    value: value,
                    data: null
                };
            }) : suggestions;
        },
        processResponse: function(result, originalQuery, cacheKey) {
            var that = this, options = that.options;
            result.suggestions = that.verifySuggestionsFormat(result.suggestions), options.noCache || (that.cachedResponse[cacheKey] = result, 
            options.preventBadQueries && 0 === result.suggestions.length && that.badQueries.push(originalQuery)), 
            originalQuery === that.getQuery(that.currentValue) && (that.suggestions = result.suggestions, 
            that.suggest());
        },
        activate: function(index) {
            var activeItem, that = this, selected = that.classes.selected, container = $(that.suggestionsContainer), children = container.children();
            return container.children("." + selected).removeClass(selected), that.selectedIndex = index, 
            -1 !== that.selectedIndex && children.length > that.selectedIndex ? (activeItem = children.get(that.selectedIndex), 
            $(activeItem).addClass(selected), activeItem) : null;
        },
        selectHint: function() {
            var that = this, i = $.inArray(that.hint, that.suggestions);
            that.select(i);
        },
        select: function(i) {
            var that = this;
            that.hide(), that.onSelect(i);
        },
        moveUp: function() {
            var that = this;
            if (-1 !== that.selectedIndex) return 0 === that.selectedIndex ? ($(that.suggestionsContainer).children().first().removeClass(that.classes.selected), 
            that.selectedIndex = -1, that.el.val(that.currentValue), void that.findBestHint()) : void that.adjustScroll(that.selectedIndex - 1);
        },
        moveDown: function() {
            var that = this;
            that.selectedIndex !== that.suggestions.length - 1 && that.adjustScroll(that.selectedIndex + 1);
        },
        adjustScroll: function(index) {
            var offsetTop, upperBound, lowerBound, that = this, activeItem = that.activate(index), heightDelta = 25;
            activeItem && (offsetTop = activeItem.offsetTop, upperBound = $(that.suggestionsContainer).scrollTop(), 
            lowerBound = upperBound + that.options.maxHeight - heightDelta, upperBound > offsetTop ? $(that.suggestionsContainer).scrollTop(offsetTop) : offsetTop > lowerBound && $(that.suggestionsContainer).scrollTop(offsetTop - that.options.maxHeight + heightDelta), 
            that.el.val(that.getValue(that.suggestions[index].value)), that.signalHint(null));
        },
        onSelect: function(index) {
            var that = this, onSelectCallback = that.options.onSelect, suggestion = that.suggestions[index];
            that.currentValue = that.getValue(suggestion.value), that.el.val(that.currentValue), 
            that.signalHint(null), that.suggestions = [], that.selection = suggestion, $.isFunction(onSelectCallback) && onSelectCallback.call(that.element, suggestion);
        },
        getValue: function(value) {
            var currentValue, parts, that = this, delimiter = that.options.delimiter;
            return delimiter ? (currentValue = that.currentValue, parts = currentValue.split(delimiter), 
            1 === parts.length ? value : currentValue.substr(0, currentValue.length - parts[parts.length - 1].length) + value) : value;
        },
        dispose: function() {
            var that = this;
            that.el.off(eventNS).removeData(dataAttrKey), that.disableKillerFn(), 
            $(window).off("resize" + eventNS, that.fixPositionCapture), $(that.suggestionsContainer).remove();
        }
    }, $.fn.suggestions = function(options, args) {
        return 0 === arguments.length ? this.first().data(dataAttrKey) : this.each(function() {
            var inputElement = $(this), instance = inputElement.data(dataAttrKey);
            "string" == typeof options ? instance && "function" == typeof instance[options] && instance[options](args) : (instance && instance.dispose && instance.dispose(), 
            instance = new Suggestions(this, options), inputElement.data(dataAttrKey, instance));
        });
    };
});