/**
 * DaData.ru Suggestions jQuery plugin, version 21.12.0
 *
 * DaData.ru Suggestions jQuery plugin is freely distributable under the terms of MIT-style license
 * Built on DevBridge Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)
 * For details, see https://github.com/hflabs/suggestions-jquery
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery')) :
	typeof define === 'function' && define.amd ? define(['jquery'], factory) :
	(factory(global.jQuery));
}(this, (function ($) { 'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

/**
 * Утилиты для работы с типами.
 */
var lang_util = {
    /**
     * Проверяет, является ли аргумент массивом.
     */
    isArray: function(array) {
        return Array.isArray(array);
    },

    /**
     * Проверяет, является ли аргумент функцией.
     */
    isFunction: function(it) {
        return Object.prototype.toString.call(it) === "[object Function]";
    },

    /**
     * Проверяет, является ли аргумент пустым объектом ({}).
     */
    isEmptyObject: function(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    },

    /**
     * Проверяет, является ли аргумент «обычным» объектом
     * (не undefiend, не null, не DOM-элемент)
     */
    isPlainObject: function(obj) {
        if (
            obj === undefined ||
            typeof obj !== "object" ||
            obj === null ||
            obj.nodeType ||
            obj === obj.window
        ) {
            return false;
        }
        if (
            obj.constructor &&
            !Object.prototype.hasOwnProperty.call(
                obj.constructor.prototype,
                "isPrototypeOf"
            )
        ) {
            return false;
        }
        return true;
    }
};

/**
 * Утилиты для работы с коллекциями.
 */
var collection_util = {
    /**
     * Возвращает массив без пустых элементов
     */
    compact: function(array) {
        return array.filter(function(el) {
            return !!el;
        });
    },

    /**
     * Итерирует по элементам массива или полям объекта.
     * Ведёт себя как $.each() - прерывает выполнение, если функция-обработчик возвращает false.
     * @param {Object|Array} obj - массив или объект
     * @param {eachCallback} callback - функция-обработчик
     */
    each: function(obj, callback) {
        if (Array.isArray(obj)) {
            obj.some(function(el, idx) {
                return callback(el, idx) === false;
            });
            return;
        }
        Object.keys(obj).some(function(key) {
            var value = obj[key];
            return callback(value, key) === false;
        });
    },

    /**
     * Пересечение массивов: ([1,2,3,4], [2,4,5,6]) => [2,4]
     * Исходные массивы не меняются.
     */
    intersect: function(array1, array2) {
        var result = [];
        if (!Array.isArray(array1) || !Array.isArray(array2)) {
            return result;
        }
        return array1.filter(function(el) {
            return array2.indexOf(el) !== -1;
        });
    },

    /**
     * Разность массивов: ([1,2,3,4], [2,4,5,6]) => [1,3]
     * Исходные массивы не меняются.
     */
    minus: function(array1, array2) {
        if (!array2 || array2.length === 0) {
            return array1;
        }
        return array1.filter(function(el) {
            return array2.indexOf(el) === -1;
        });
    },

    /**
     * Обрачивает переданный объект в массив.
     * Если передан массив, возвращает его копию.
     */
    makeArray: function(arrayLike) {
        if (lang_util.isArray(arrayLike)) {
            return Array.prototype.slice.call(arrayLike);
        } else {
            return [arrayLike];
        }
    },

    /**
     * Разность массивов с частичным совпадением элементов.
     * Если элемент второго массива включает в себя элемент первого,
     * элементы считаются равными.
     */
    minusWithPartialMatching: function(array1, array2) {
        if (!array2 || array2.length === 0) {
            return array1;
        }
        return array1.filter(function(el) {
            return !array2.some(function(el2) {
                return el2.indexOf(el) === 0;
            });
        });
    },

    /**
     * Копирует массив, начиная с указанного элемента.
     * @param obj - массив
     * @param start - индекс, начиная с которого надо скопировать
     */
    slice: function(obj, start) {
        return Array.prototype.slice.call(obj, start);
    }
};

/**
 * Утилиты для работы с функциями.
 */
var func_util = {
    /**
     * Выполняет функцию с указанной задержкой.
     * @param {Function} handler - функция
     * @param {number} delay - задержка в миллисекундах
     */
    delay: function(handler, delay) {
        return setTimeout(handler, delay || 0);
    }
};

/**
 * Утилиты для работы с объектами.
 */
var object_util = {
    /**
     * Сравнивает два объекта по полям, которые присутствуют в обоих
     * @returns {boolean} true, если поля совпадают, false в противном случае
     */
    areSame: function self(a, b) {
        var same = true;

        if (typeof a != typeof b) {
            return false;
        }

        if (typeof a == "object" && a != null && b != null) {
            collection_util.each(a, function(value, i) {
                return (same = self(value, b[i]));
            });
            return same;
        }

        return a === b;
    },

    /**
     * Копирует свойства и их значения из исходных объектов в целевой
     */
    assign: function(target, varArgs) {
        if (typeof Object.assign === "function") {
            return Object.assign.apply(null, arguments);
        }
        if (target == null) {
            // TypeError if undefined or null
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) {
                // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (
                        Object.prototype.hasOwnProperty.call(
                            nextSource,
                            nextKey
                        )
                    ) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    },

    /**
     * Клонирует объект глубоким копированием
     */
    clone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Возвращает копию объекта без пустых полей
     * (без undefined, null и '')
     * @param obj
     */
    compact: function(obj) {
        var copy = object_util.clone(obj);

        collection_util.each(copy, function(val, key) {
            if (val === null || val === undefined || val === "") {
                delete copy[key];
            }
        });

        return copy;
    },

    /**
     * Проверяет, что указанные поля в объекте заполнены.
     * @param {Object} obj - проверяемый объект
     * @param {Array} fields - список названий полей, которые надо проверить
     * @returns {boolean}
     */
    fieldsAreNotEmpty: function(obj, fields) {
        if (!lang_util.isPlainObject(obj)) {
            return false;
        }
        var result = true;
        collection_util.each(fields, function(field, i) {
            result = !!obj[field];
            return result;
        });
        return result;
    },

    /**
     * Возвращает вложенное значение по указанному пути
     * например, 'data.address.value'
     */
    getDeepValue: function self(obj, name) {
        var path = name.split("."),
            step = path.shift();

        return (
            obj && (path.length ? self(obj[step], path.join(".")) : obj[step])
        );
    },

    /**
     * Возвращает карту объектов по их идентификаторам.
     * Принимает на вход массив объектов и идентифицирующее поле.
     * Возвращает карты, ключом в которой является значение идентифицирующего поля,
     *   а значением — исходный объект.
     * Заодно добавляет объектам поле с порядковым номером.
     * @param {Array} objectsArray - массив объектов
     * @param {string} idField - название идентифицирующего поля
     * @param {string} indexField - название поля с порядковым номером
     * @return {Object} карта объектов по их идентификаторам
     */
    indexObjectsById: function(objectsArray, idField, indexField) {
        var result = {};

        collection_util.each(objectsArray, function(obj, idx) {
            var key = obj[idField];
            var val = {};

            if (indexField) {
                val[indexField] = idx;
            }

            result[key] = object_util.assign(val, obj);
        });

        return result;
    }
};

var KEYS = {
    ENTER: 13,
    ESC: 27,
    TAB: 9,
    SPACE: 32,
    UP: 38,
    DOWN: 40
};

var CLASSES = {
    hint: "suggestions-hint",
    mobile: "suggestions-mobile",
    nowrap: "suggestions-nowrap",
    promo: "suggestions-promo",
    selected: "suggestions-selected",
    suggestion: "suggestions-suggestion",
    subtext: "suggestions-subtext",
    subtext_inline: "suggestions-subtext suggestions-subtext_inline",
    subtext_delimiter: "suggestions-subtext-delimiter",
    subtext_label: "suggestions-subtext suggestions-subtext_label",
    removeConstraint: "suggestions-remove",
    value: "suggestions-value"
};

var EVENT_NS = ".suggestions";
var DATA_ATTR_KEY = "suggestions";
var WORD_DELIMITERS = "\\s\"'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№";
var WORD_PARTS_DELIMITERS = "\\-\\+\\\\\\?!@#$%^&";

/**
 * Утилиты для работы с текстом.
 */

var WORD_SPLITTER = new RegExp("[" + WORD_DELIMITERS + "]+", "g");
var WORD_PARTS_SPLITTER = new RegExp("[" + WORD_PARTS_DELIMITERS + "]+", "g");

var text_util = {
    /**
     * Заменяет амперсанд, угловые скобки и другие подобные символы
     * на HTML-коды
     */
    escapeHtml: function(str) {
        var map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;"
        };

        if (str) {
            collection_util.each(map, function(html, ch) {
                str = str.replace(new RegExp(ch, "g"), html);
            });
        }
        return str;
    },

    /**
     * Эскейпирует символы RegExp-шаблона обратным слешем
     * (для передачи в конструктор регулярных выражений)
     */
    escapeRegExChars: function(value) {
        return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    /**
     * Приводит слово к нижнему регистру и заменяет ё → е
     */
    formatToken: function(token) {
        return token && token.toLowerCase().replace(/[ёЁ]/g, "е");
    },

    /**
     * Возвращает регулярное выражение для разбивки строки на слова
     */
    getWordExtractorRegExp: function() {
        return new RegExp(
            "([^" + WORD_DELIMITERS + "]*)([" + WORD_DELIMITERS + "]*)",
            "g"
        );
    },

    /**
     * Вырезает из строки стоп-слова
     */
    normalize: function(str, stopwords) {
        return text_util.split(str, stopwords).join(" ");
    },

    /**
     * Добивает строку указанным символов справа до указанной длины
     * @param sourceString  исходная строка
     * @param targetLength  до какой длины добивать
     * @param padString  каким символом добивать
     * @returns строка указанной длины
     */
    padEnd: function(sourceString, targetLength, padString) {
        if (String.prototype.padEnd) {
            return sourceString.padEnd(targetLength, padString);
        }
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String(typeof padString !== "undefined" ? padString : " ");
        if (sourceString.length > targetLength) {
            return String(sourceString);
        } else {
            targetLength = targetLength - sourceString.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(sourceString) + padString.slice(0, targetLength);
        }
    },

    /**
     * Нормализует строку, разбивает на слова,
     * отсеивает стоп-слова из списка.
     * Расклеивает буквы и цифры, написанные слитно.
     */
    split: function(str, stopwords) {
        var cleanStr = str
            .toLowerCase()
            .replace("ё", "е")
            .replace(/(\d+)([а-я]{2,})/g, "$1 $2")
            .replace(/([а-я]+)(\d+)/g, "$1 $2");

        var words = collection_util.compact(cleanStr.split(WORD_SPLITTER));
        if (!words.length) {
            return [];
        }
        var lastWord = words.pop();
        var goodWords = collection_util.minus(words, stopwords);
        goodWords.push(lastWord);
        return goodWords;
    },

    /**
     * Заменяет слова на составные части.
     * В отличие от withSubTokens, не сохраняет исходные слова.
     */
    splitTokens: function(tokens) {
        var result = [];
        collection_util.each(tokens, function(token, i) {
            var subtokens = token.split(WORD_PARTS_SPLITTER);
            result = result.concat(collection_util.compact(subtokens));
        });
        return result;
    },

    /**
     * Проверяет, включает ли строка 1 строку 2.
     * Если строки равны, возвращает false.
     */
    stringEncloses: function(str1, str2) {
        return (
            str1.length > str2.length &&
            str1.toLowerCase().indexOf(str2.toLowerCase()) !== -1
        );
    },

    /**
     * Возвращает список слов из строки.
     * При этом первыми по порядку идут «предпочтительные» слова
     * (те, что не входят в список «нежелательных»).
     * Составные слова тоже разбивает на части.
     * @param {string} value - строка
     * @param {Array} unformattableTokens - «нежелательные» слова
     * @return {Array} Массив атомарных слов
     */
    tokenize: function(value, unformattableTokens) {
        var tokens = collection_util.compact(
            text_util.formatToken(value).split(WORD_SPLITTER)
        );
        // Move unformattableTokens to the end.
        // This will help to apply them only if no other tokens match
        var preferredTokens = collection_util.minus(
            tokens,
            unformattableTokens
        );
        var otherTokens = collection_util.minus(tokens, preferredTokens);
        tokens = text_util.withSubTokens(preferredTokens.concat(otherTokens));
        return tokens;
    },

    /**
     * Разбивает составные слова на части
     * и дописывает их к исходному массиву.
     * @param {Array} tokens - слова
     * @return {Array} Массив атомарных слов
     */
    withSubTokens: function(tokens) {
        var result = [];
        collection_util.each(tokens, function(token, i) {
            var subtokens = token.split(WORD_PARTS_SPLITTER);
            result.push(token);
            if (subtokens.length > 1) {
                result = result.concat(collection_util.compact(subtokens));
            }
        });
        return result;
    }
};

/**
 * jQuery API.
 */
var jqapi = {
    Deferred: function() {
        return $.Deferred();
    },

    ajax: function(settings) {
        return $.ajax(settings);
    },

    extend: function() {
        return $.extend.apply(null, arguments);
    },

    isJqObject: function(obj) {
        return obj instanceof $;
    },

    param: function(obj) {
        return $.param(obj);
    },

    proxy: function(func, context) {
        return $.proxy(func, context);
    },

    select: function(selector) {
        return $(selector);
    },

    supportsCors: function() {
        return $.support.cors;
    }
};

/**
 * Утилиты для работы через AJAX
 */
var ajax = {
    /**
     * HTTP-метод, который поддерживает браузер
     */
    getDefaultType: function() {
        return jqapi.supportsCors() ? "POST" : "GET";
    },

    /**
     * Content-type, который поддерживает браузер
     */
    getDefaultContentType: function() {
        return jqapi.supportsCors()
            ? "application/json"
            : "application/x-www-form-urlencoded";
    },

    /**
     * Меняет HTTPS на протокол страницы, если браузер не поддерживает CORS
     */
    fixURLProtocol: function(url) {
        return jqapi.supportsCors()
            ? url
            : url.replace(/^https?:/, location.protocol);
    },

    /**
     * Записывает параметры в GET-строку
     */
    addUrlParams: function(url, params) {
        return url + (/\?/.test(url) ? "&" : "?") + jqapi.param(params);
    },

    /**
     * Сериализует объект для передачи по сети.
     * Либо в JSON-строку (если браузер поддерживает CORS),
     *   либо в GET-строку.
     */
    serialize: function(data) {
        if (jqapi.supportsCors()) {
            return JSON.stringify(data, function(key, value) {
                return value === null ? undefined : value;
            });
        } else {
            data = object_util.compact(data);
            return jqapi.param(data, true);
        }
    }
};

/**
 * Возвращает автоинкрементный идентификатор.
 * @param {string} prefix - префикс для идентификатора
 */
var generateId = (function() {
    var counter = 0;
    return function(prefix) {
        return (prefix || "") + ++counter;
    };
})();

/**
 * Утилиты на все случаи жизни.
 */
var utils = {
    escapeRegExChars: text_util.escapeRegExChars,
    escapeHtml: text_util.escapeHtml,
    formatToken: text_util.formatToken,
    normalize: text_util.normalize,
    reWordExtractor: text_util.getWordExtractorRegExp,
    stringEncloses: text_util.stringEncloses,

    addUrlParams: ajax.addUrlParams,
    getDefaultContentType: ajax.getDefaultContentType,
    getDefaultType: ajax.getDefaultType,
    fixURLProtocol: ajax.fixURLProtocol,
    serialize: ajax.serialize,

    arrayMinus: collection_util.minus,
    arrayMinusWithPartialMatching: collection_util.minusWithPartialMatching,
    arraysIntersection: collection_util.intersect,
    compact: collection_util.compact,
    each: collection_util.each,
    makeArray: collection_util.makeArray,
    slice: collection_util.slice,

    delay: func_util.delay,

    areSame: object_util.areSame,
    compactObject: object_util.compact,
    getDeepValue: object_util.getDeepValue,
    fieldsNotEmpty: object_util.fieldsAreNotEmpty,
    indexBy: object_util.indexObjectsById,

    isArray: lang_util.isArray,
    isEmptyObject: lang_util.isEmptyObject,
    isFunction: lang_util.isFunction,
    isPlainObject: lang_util.isPlainObject,

    uniqueId: generateId
};

var DEFAULT_OPTIONS = {
    $helpers: null,
    autoSelectFirst: false,
    containerClass: "suggestions-suggestions",
    count: 5,
    deferRequestBy: 100,
    enrichmentEnabled: true,
    formatResult: null,
    formatSelected: null,
    headers: null,
    hint: "Выберите вариант или продолжите ввод",
    initializeInterval: 100,
    language: null,
    minChars: 1,
    mobileWidth: 600,
    noCache: false,
    noSuggestionsHint: null,
    onInvalidateSelection: null,
    onSearchComplete: $.noop,
    onSearchError: $.noop,
    onSearchStart: $.noop,
    onSelect: null,
    onSelectNothing: null,
    onSuggestionsFetch: null,
    paramName: "query",
    params: {},
    preventBadQueries: false,
    requestMode: "suggest",
    scrollOnFocus: false,
    // основной url, может быть переопределен
    serviceUrl: "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
    tabDisabled: false,
    timeout: 3000,
    triggerSelectOnBlur: true,
    triggerSelectOnEnter: true,
    triggerSelectOnSpace: false,
    type: null,
    // url, который заменяет serviceUrl + method + type
    // то есть, если он задан, то для всех запросов будет использоваться именно он
    // если не поддерживается cors то к url будут добавлены параметры ?token=...&version=...
    // и заменен протокол на протокол текущей страницы
    url: null
};

/**
 * Factory to create same parent checker function
 * @param preprocessFn called on each value before comparison
 * @returns {Function} same parent checker function
 */
function sameParentChecker(preprocessFn) {
    return function(suggestions) {
        if (suggestions.length === 0) {
            return false;
        }
        if (suggestions.length === 1) {
            return true;
        }

        var parentValue = preprocessFn(suggestions[0].value),
            aliens = suggestions.filter(function(suggestion) {
                return (
                    preprocessFn(suggestion.value).indexOf(parentValue) !== 0
                );
            });

        return aliens.length === 0;
    };
}

/**
 * Default same parent checker. Compares raw values.
 * @type {Function}
 */
var haveSameParent = sameParentChecker(function(val) {
    return val;
});

/**
 * Сравнивает запрос c подсказками, по словам.
 * Срабатывает, только если у всех подсказок общий родитель
 * (функция сверки передаётся параметром).
 * Игнорирует стоп-слова.
 * Возвращает индекс единственной подходящей подсказки
 * или -1, если подходящих нет или несколько.
 */
function _matchByWords(stopwords, parentCheckerFn) {
    return function(query, suggestions) {
        var queryTokens;
        var matches = [];

        if (parentCheckerFn(suggestions)) {
            queryTokens = text_util.splitTokens(
                text_util.split(query, stopwords)
            );

            collection_util.each(suggestions, function(suggestion, i) {
                var suggestedValue = suggestion.value;

                if (text_util.stringEncloses(query, suggestedValue)) {
                    return false;
                }

                // check if query words are a subset of suggested words
                var suggestionWords = text_util.splitTokens(
                    text_util.split(suggestedValue, stopwords)
                );

                if (
                    collection_util.minus(queryTokens, suggestionWords)
                        .length === 0
                ) {
                    matches.push(i);
                }
            });
        }

        return matches.length === 1 ? matches[0] : -1;
    };
}

/**
 * Matchers return index of suitable suggestion
 * Context inside is optionally set in types.js
 */
var matchers = {
    /**
     * Matches query against suggestions, removing all the stopwords.
     */
    matchByNormalizedQuery: function(stopwords) {
        return function(query, suggestions) {
            var normalizedQuery = text_util.normalize(query, stopwords);
            var matches = [];

            collection_util.each(suggestions, function(suggestion, i) {
                var suggestedValue = suggestion.value.toLowerCase();
                // if query encloses suggestion, than it has already been selected
                // so we should not select it anymore
                if (text_util.stringEncloses(query, suggestedValue)) {
                    return false;
                }
                // if there is suggestion that contains query as its part
                // than we should ignore all other matches, even full ones
                if (suggestedValue.indexOf(normalizedQuery) > 0) {
                    return false;
                }
                if (
                    normalizedQuery ===
                    text_util.normalize(suggestedValue, stopwords)
                ) {
                    matches.push(i);
                }
            });

            return matches.length === 1 ? matches[0] : -1;
        };
    },

    matchByWords: function(stopwords) {
        return _matchByWords(stopwords, haveSameParent);
    },

    matchByWordsAddress: function(stopwords) {
        return _matchByWords(stopwords, haveSameParent);
    },

    /**
     * Matches query against values contained in suggestion fields
     * for cases, when there is only one suggestion
     * only considers fields specified in fields map
     * uses partial matching:
     *   "0445" vs { value: "ALFA-BANK", data: { "bic": "044525593" }} is a match
     */
    matchByFields: function(fields) {
        return function(query, suggestions) {
            var tokens = text_util.splitTokens(text_util.split(query));
            var suggestionWords = [];

            if (suggestions.length === 1) {
                if (fields) {
                    collection_util.each(fields, function(stopwords, field) {
                        var fieldValue = object_util.getDeepValue(
                            suggestions[0],
                            field
                        );
                        var fieldWords =
                            fieldValue &&
                            text_util.splitTokens(
                                text_util.split(fieldValue, stopwords)
                            );

                        if (fieldWords && fieldWords.length) {
                            suggestionWords = suggestionWords.concat(
                                fieldWords
                            );
                        }
                    });
                }

                if (
                    collection_util.minusWithPartialMatching(
                        tokens,
                        suggestionWords
                    ).length === 0
                ) {
                    return 0;
                }
            }

            return -1;
        };
    }
};

var ADDRESS_STOPWORDS = [
    "ао",
    "аобл",
    "дом",
    "респ",
    "а/я",
    "аал",
    "автодорога",
    "аллея",
    "арбан",
    "аул",
    "б-р",
    "берег",
    "бугор",
    "вал",
    "вл",
    "волость",
    "въезд",
    "высел",
    "г",
    "городок",
    "гск",
    "д",
    "двлд",
    "днп",
    "дор",
    "дп",
    "ж/д_будка",
    "ж/д_казарм",
    "ж/д_оп",
    "ж/д_платф",
    "ж/д_пост",
    "ж/д_рзд",
    "ж/д_ст",
    "жилзона",
    "жилрайон",
    "жт",
    "заезд",
    "заимка",
    "зона",
    "к",
    "казарма",
    "канал",
    "кв",
    "кв-л",
    "км",
    "кольцо",
    "комн",
    "кордон",
    "коса",
    "кп",
    "край",
    "линия",
    "лпх",
    "м",
    "массив",
    "местность",
    "мкр",
    "мост",
    "н/п",
    "наб",
    "нп",
    "обл",
    "округ",
    "остров",
    "оф",
    "п",
    "п/о",
    "п/р",
    "п/ст",
    "парк",
    "пгт",
    "пер",
    "переезд",
    "пл",
    "пл-ка",
    "платф",
    "погост",
    "полустанок",
    "починок",
    "пр-кт",
    "проезд",
    "промзона",
    "просек",
    "просека",
    "проселок",
    "проток",
    "протока",
    "проулок",
    "р-н",
    "рзд",
    "россия",
    "рп",
    "ряды",
    "с",
    "с/а",
    "с/мо",
    "с/о",
    "с/п",
    "с/с",
    "сад",
    "сквер",
    "сл",
    "снт",
    "спуск",
    "ст",
    "ст-ца",
    "стр",
    "тер",
    "тракт",
    "туп",
    "у",
    "ул",
    "уч-к",
    "ф/х",
    "ферма",
    "х",
    "ш",
    "бульвар",
    "владение",
    "выселки",
    "гаражно-строительный",
    "город",
    "деревня",
    "домовладение",
    "дорога",
    "квартал",
    "километр",
    "комната",
    "корпус",
    "литер",
    "леспромхоз",
    "местечко",
    "микрорайон",
    "набережная",
    "область",
    "переулок",
    "платформа",
    "площадка",
    "площадь",
    "поселение",
    "поселок",
    "проспект",
    "разъезд",
    "район",
    "республика",
    "село",
    "сельсовет",
    "слобода",
    "сооружение",
    "станица",
    "станция",
    "строение",
    "территория",
    "тупик",
    "улица",
    "улус",
    "участок",
    "хутор",
    "шоссе"
];

/**
 * Компоненты адреса
 * @type {*[]}
 * id {String} Наименование типа
 * fields {Array of Strings}
 * forBounds {Boolean} может использоваться в ограничениях
 * forLocations {Boolean}
 * kladrFormat {Object}
 * fiasType {String} Наименование соответствующего ФИАС типа
 */
var ADDRESS_COMPONENTS = [
    {
        id: "kladr_id",
        fields: ["kladr_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "postal_code",
        fields: ["postal_code"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "country_iso_code",
        fields: ["country_iso_code"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "country",
        fields: ["country"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 0, zeros: 13 },
        fiasType: "country_iso_code"
    },
    {
        id: "region_iso_code",
        fields: ["region_iso_code"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_fias_id",
        fields: ["region_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_type_full",
        fields: ["region_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "region",
        fields: [
            "region",
            "region_type",
            "region_type_full",
            "region_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "area_fias_id",
        fields: ["area_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "area_type_full",
        fields: ["area_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "area",
        fields: ["area", "area_type", "area_type_full", "area_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "city_fias_id",
        fields: ["city_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_type_full",
        fields: ["city_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city",
        fields: ["city", "city_type", "city_type_full", "city_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city_district_fias_id",
        fields: ["city_district_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_district_type_full",
        fields: ["city_district_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "city_district",
        fields: [
            "city_district",
            "city_district_type",
            "city_district_type_full",
            "city_district_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "settlement_fias_id",
        fields: ["settlement_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "settlement_type_full",
        fields: ["settlement_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "settlement",
        fields: [
            "settlement",
            "settlement_type",
            "settlement_type_full",
            "settlement_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "street_fias_id",
        fields: ["street_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "street_type_full",
        fields: ["street_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "street",
        fields: [
            "street",
            "street_type",
            "street_type_full",
            "street_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "house",
        fields: [
            "house",
            "house_type",
            "house_type_full",
            "block",
            "block_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 19 },
        fiasType: "house_fias_id"
    },
    {
        id: "flat",
        fields: ["flat", "flat_type", "flat_type_full"],
        forBounds: true,
        forLocations: false,
        kladrFormat: { digits: 19 },
        fiasType: "flat_fias_id"
    }
];

var ADDRESS_TYPE = {
    urlSuffix: "address",
    noSuggestionsHint: "Неизвестный адрес",
    matchers: [
        matchers.matchByNormalizedQuery(ADDRESS_STOPWORDS),
        matchers.matchByWordsAddress(ADDRESS_STOPWORDS)
    ],
    dataComponents: ADDRESS_COMPONENTS,
    dataComponentsById: object_util.indexObjectsById(
        ADDRESS_COMPONENTS,
        "id",
        "index"
    ),
    unformattableTokens: ADDRESS_STOPWORDS,
    enrichmentEnabled: true,
    enrichmentMethod: "suggest",
    enrichmentParams: {
        count: 1,
        locations: null,
        locations_boost: null,
        from_bound: null,
        to_bound: null
    },
    getEnrichmentQuery: function(suggestion) {
        return suggestion.unrestricted_value;
    },
    geoEnabled: true,
    isDataComplete: function(suggestion) {
        var fields = [this.bounds.to || "flat"],
            data = suggestion.data;

        return (
            !lang_util.isPlainObject(data) ||
            object_util.fieldsAreNotEmpty(data, fields)
        );
    },
    composeValue: function(data, options) {
        var country = data.country,
            region =
                data.region_with_type ||
                collection_util
                    .compact([data.region, data.region_type])
                    .join(" ") ||
                data.region_type_full,
            area =
                data.area_with_type ||
                collection_util
                    .compact([data.area_type, data.area])
                    .join(" ") ||
                data.area_type_full,
            city =
                data.city_with_type ||
                collection_util
                    .compact([data.city_type, data.city])
                    .join(" ") ||
                data.city_type_full,
            settelement =
                data.settlement_with_type ||
                collection_util
                    .compact([data.settlement_type, data.settlement])
                    .join(" ") ||
                data.settlement_type_full,
            cityDistrict =
                data.city_district_with_type ||
                collection_util
                    .compact([data.city_district_type, data.city_district])
                    .join(" ") ||
                data.city_district_type_full,
            street =
                data.street_with_type ||
                collection_util
                    .compact([data.street_type, data.street])
                    .join(" ") ||
                data.street_type_full,
            house = collection_util
                .compact([
                    data.house_type,
                    data.house,
                    data.block_type,
                    data.block
                ])
                .join(" "),
            flat = collection_util
                .compact([data.flat_type, data.flat])
                .join(" "),
            postal_box = data.postal_box && "а/я " + data.postal_box,
            result;

        // если регион совпадает с городом
        // например г Москва, г Москва
        // то не показываем регион
        if (region === city) {
            region = "";
        }

        // иногда не показываем район
        if (!(options && options.saveCityDistrict)) {
            if (options && options.excludeCityDistrict) {
                // если район явно запрещен
                cityDistrict = "";
            } else if (cityDistrict && !data.city_district_fias_id) {
                // если район взят из ОКАТО (у него пустой city_district_fias_id)
                cityDistrict = "";
            }
        }

        result = collection_util
            .compact([
                country,
                region,
                area,
                city,
                cityDistrict,
                settelement,
                street,
                house,
                flat,
                postal_box
            ])
            .join(", ");

        return result;
    },
    formatResult: (function() {
        var componentsUnderCityDistrict = [],
            _underCityDistrict = false;

        ADDRESS_COMPONENTS.forEach(function(component) {
            if (_underCityDistrict)
                componentsUnderCityDistrict.push(component.id);
            if (component.id === "city_district") _underCityDistrict = true;
        });

        return function(value, currentValue, suggestion, options) {
            var that = this,
                district =
                    suggestion.data && suggestion.data.city_district_with_type,
                unformattableTokens = options && options.unformattableTokens,
                historyValues =
                    suggestion.data && suggestion.data.history_values,
                tokens,
                unusedTokens,
                formattedHistoryValues;

            // добавляем исторические значения
            if (historyValues && historyValues.length > 0) {
                tokens = text_util.tokenize(currentValue, unformattableTokens);
                unusedTokens = this.type.findUnusedTokens(tokens, value);
                formattedHistoryValues = this.type.getFormattedHistoryValues(
                    unusedTokens,
                    historyValues
                );
                if (formattedHistoryValues) {
                    value += formattedHistoryValues;
                }
            }

            value = that.highlightMatches(
                value,
                currentValue,
                suggestion,
                options
            );
            value = that.wrapFormattedValue(value, suggestion);

            if (
                district &&
                (!that.bounds.own.length ||
                    that.bounds.own.indexOf("street") >= 0) &&
                !lang_util.isEmptyObject(
                    that.copyDataComponents(
                        suggestion.data,
                        componentsUnderCityDistrict
                    )
                )
            ) {
                value +=
                    '<div class="' +
                    that.classes.subtext +
                    '">' +
                    that.highlightMatches(district, currentValue, suggestion) +
                    "</div>";
            }

            return value;
        };
    })(),

    /**
     * Возвращает список слов в запросе,
     * которые не встречаются в подсказке
     */
    findUnusedTokens: function(tokens, value) {
        var tokenIndex,
            token,
            unused = [];

        unused = tokens.filter(function(token) {
            return value.indexOf(token) === -1;
        });

        return unused;
    },

    /**
     * Возвращает исторические названия для слов запроса,
     * для которых не найдено совпадения в основном значении подсказки
     */
    getFormattedHistoryValues: function(unusedTokens, historyValues) {
        var tokenIndex,
            token,
            historyValueIndex,
            historyValue,
            values = [],
            formatted = "";

        historyValues.forEach(function(historyValue) {
            collection_util.each(unusedTokens, function(token) {
                if (historyValue.toLowerCase().indexOf(token) >= 0) {
                    values.push(historyValue);
                    return false;
                }
            });
        });

        if (values.length > 0) {
            formatted = " (бывш. " + values.join(", ") + ")";
        }

        return formatted;
    },

    /**
     * @param instance
     * @param options
     * @param options.suggestion
     * @param options.hasSameValues
     * @param options.hasBeenEnreached
     */
    getSuggestionValue: function(instance, options) {
        var formattedValue = null;

        if (options.hasSameValues) {
            if (instance.options.restrict_value) {
                // Can not use unrestricted address,
                // because some components (from constraints) must be omitted
                formattedValue = this.getValueWithinConstraints(
                    instance,
                    options.suggestion
                );
            } else if (instance.bounds.own.length) {
                // Can not use unrestricted address,
                // because only components from bounds must be included
                formattedValue = this.getValueWithinBounds(
                    instance,
                    options.suggestion
                );
            } else {
                // Can use full unrestricted address
                formattedValue = options.suggestion.unrestricted_value;
            }
        } else if (options.hasBeenEnriched) {
            if (instance.options.restrict_value) {
                formattedValue = this.getValueWithinConstraints(
                    instance,
                    options.suggestion,
                    { excludeCityDistrict: true }
                );
            }
        }

        return formattedValue;
    },
    /*
     * Compose suggestion value with respect to constraints
     */
    getValueWithinConstraints: function(instance, suggestion, options) {
        return this.composeValue(
            instance.getUnrestrictedData(suggestion.data),
            options
        );
    },
    /*
     * Compose suggestion value with respect to bounds
     */
    getValueWithinBounds: function(instance, suggestion, options) {
        // для корректного составления адреса нужен city_district_fias_id
        var data = instance.copyDataComponents(
            suggestion.data,
            instance.bounds.own.concat(["city_district_fias_id"])
        );

        return this.composeValue(data, options);
    }
};

/**
 * Компоненты адреса
 * @type {*[]}
 * id {String} Наименование типа
 * fields {Array of Strings}
 * forBounds {Boolean} может использоваться в ограничениях
 * forLocations {Boolean}
 * kladrFormat {Object}
 * fiasType {String} Наименование соответствующего ФИАС типа
 */
var FIAS_COMPONENTS = [
    {
        id: "kladr_id",
        fields: ["kladr_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_fias_id",
        fields: ["region_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "region_type_full",
        fields: ["region_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "region",
        fields: [
            "region",
            "region_type",
            "region_type_full",
            "region_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 2, zeros: 11 },
        fiasType: "region_fias_id"
    },
    {
        id: "area_fias_id",
        fields: ["area_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "area_type_full",
        fields: ["area_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "area",
        fields: ["area", "area_type", "area_type_full", "area_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 5, zeros: 8 },
        fiasType: "area_fias_id"
    },
    {
        id: "city_fias_id",
        fields: ["city_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_type_full",
        fields: ["city_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city",
        fields: ["city", "city_type", "city_type_full", "city_with_type"],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 8, zeros: 5 },
        fiasType: "city_fias_id"
    },
    {
        id: "city_district_fias_id",
        fields: ["city_district_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "city_district_type_full",
        fields: ["city_district_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "city_district",
        fields: [
            "city_district",
            "city_district_type",
            "city_district_type_full",
            "city_district_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "city_district_fias_id"
    },
    {
        id: "settlement_fias_id",
        fields: ["settlement_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "settlement_type_full",
        fields: ["settlement_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "settlement",
        fields: [
            "settlement",
            "settlement_type",
            "settlement_type_full",
            "settlement_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 11, zeros: 2 },
        fiasType: "settlement_fias_id"
    },
    {
        id: "planning_structure_fias_id",
        fields: ["planning_structure_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "planning_structure_type_full",
        fields: ["planning_structure_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "planning_structure_fias_id"
    },
    {
        id: "planning_structure",
        fields: [
            "planning_structure",
            "planning_structure_type",
            "planning_structure_type_full",
            "planning_structure_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "planning_structure_fias_id"
    },
    {
        id: "street_fias_id",
        fields: ["street_fias_id"],
        forBounds: false,
        forLocations: true
    },
    {
        id: "street_type_full",
        fields: ["street_type_full"],
        forBounds: false,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "street",
        fields: [
            "street",
            "street_type",
            "street_type_full",
            "street_with_type"
        ],
        forBounds: true,
        forLocations: true,
        kladrFormat: { digits: 15, zeros: 2 },
        fiasType: "street_fias_id"
    },
    {
        id: "house",
        fields: ["house", "house_type", "block", "building_type", "building"],
        forBounds: true,
        forLocations: false,
        kladrFormat: { digits: 19 }
    }
];

var FIAS_TYPE = {
    urlSuffix: "fias",
    noSuggestionsHint: "Неизвестный адрес",
    matchers: [
        matchers.matchByNormalizedQuery(ADDRESS_STOPWORDS),
        matchers.matchByWordsAddress(ADDRESS_STOPWORDS)
    ],
    dataComponents: FIAS_COMPONENTS,
    dataComponentsById: object_util.indexObjectsById(
        FIAS_COMPONENTS,
        "id",
        "index"
    ),
    unformattableTokens: ADDRESS_STOPWORDS,
    isDataComplete: function(suggestion) {
        var fields = [this.bounds.to || "house"],
            data = suggestion.data;

        return (
            !lang_util.isPlainObject(data) ||
            object_util.fieldsAreNotEmpty(data, fields)
        );
    },
    composeValue: function(data, options) {
        var country = data.country,
            region =
                data.region_with_type ||
                collection_util
                    .compact([data.region, data.region_type])
                    .join(" ") ||
                data.region_type_full,
            area =
                data.area_with_type ||
                collection_util
                    .compact([data.area_type, data.area])
                    .join(" ") ||
                data.area_type_full,
            city =
                data.city_with_type ||
                collection_util
                    .compact([data.city_type, data.city])
                    .join(" ") ||
                data.city_type_full,
            settelement =
                data.settlement_with_type ||
                collection_util
                    .compact([data.settlement_type, data.settlement])
                    .join(" ") ||
                data.settlement_type_full,
            cityDistrict =
                data.city_district_with_type ||
                collection_util
                    .compact([data.city_district_type, data.city_district])
                    .join(" ") ||
                data.city_district_type_full,
            planning_structure =
                data.planning_structure_with_type ||
                collection_util
                    .compact([
                        data.planning_structure_type,
                        data.planning_structure
                    ])
                    .join(" ") ||
                data.planning_structure_type_full,
            street =
                data.street_with_type ||
                collection_util
                    .compact([data.street_type, data.street])
                    .join(" ") ||
                data.street_type_full,
            house = collection_util
                .compact([
                    data.house_type,
                    data.house,
                    data.block_type,
                    data.block
                ])
                .join(" "),
            flat = collection_util
                .compact([data.flat_type, data.flat])
                .join(" "),
            postal_box = data.postal_box && "а/я " + data.postal_box,
            result;

        // если регион совпадает с городом
        // например г Москва, г Москва
        // то не показываем регион
        if (region === city) {
            region = "";
        }

        // иногда не показываем район
        if (!(options && options.saveCityDistrict)) {
            if (options && options.excludeCityDistrict) {
                // если район явно запрещен
                cityDistrict = "";
            } else if (cityDistrict && !data.city_district_fias_id) {
                // если район взят из ОКАТО (у него пустой city_district_fias_id)
                cityDistrict = "";
            }
        }

        result = collection_util
            .compact([
                country,
                region,
                area,
                city,
                cityDistrict,
                settelement,
                planning_structure,
                street,
                house,
                flat,
                postal_box
            ])
            .join(", ");

        return result;
    },
    formatResult: (function() {
        return function(value, currentValue, suggestion, options) {
            var that = this;

            value = that.highlightMatches(
                value,
                currentValue,
                suggestion,
                options
            );
            value = that.wrapFormattedValue(value, suggestion);
            return value;
        };
    })(),

    getSuggestionValue: ADDRESS_TYPE.getSuggestionValue,
    getValueWithinConstraints: ADDRESS_TYPE.getValueWithinConstraints,
    getValueWithinBounds: ADDRESS_TYPE.getValueWithinBounds
};

function valueStartsWith(suggestion, field) {
    var fieldValue = suggestion.data && suggestion.data[field];

    return (
        fieldValue &&
        new RegExp(
            "^" +
                text_util.escapeRegExChars(fieldValue) +
                "([" +
                WORD_DELIMITERS +
                "]|$)",
            "i"
        ).test(suggestion.value)
    );
}

var NAME_TYPE = {
    urlSuffix: "fio",
    noSuggestionsHint: false,
    matchers: [matchers.matchByNormalizedQuery(), matchers.matchByWords()],
    // names for labels, describing which fields are displayed
    fieldNames: {
        surname: "фамилия",
        name: "имя",
        patronymic: "отчество"
    },
    isDataComplete: function(suggestion) {
        var that = this,
            params = that.options.params,
            data = suggestion.data,
            fields;

        if (lang_util.isFunction(params)) {
            params = params.call(that.element, suggestion.value);
        }
        if (params && params.parts) {
            fields = params.parts.map(function(part) {
                return part.toLowerCase();
            });
        } else {
            // when NAME is first, patronymic is mot mandatory
            fields = ["surname", "name"];
            // when SURNAME is first, it is
            if (valueStartsWith(suggestion, "surname")) {
                fields.push("patronymic");
            }
        }
        return object_util.fieldsAreNotEmpty(data, fields);
    },
    composeValue: function(data) {
        return collection_util
            .compact([data.surname, data.name, data.patronymic])
            .join(" ");
    }
};

var innPartsLengths = {
    LEGAL: [2, 2, 5, 1],
    INDIVIDUAL: [2, 2, 6, 2]
};

function chooseFormattedField(formattedMain, formattedAlt) {
    var rHasMatch = /<strong>/;
    return rHasMatch.test(formattedAlt) && !rHasMatch.test(formattedMain)
        ? formattedAlt
        : formattedMain;
}

function formattedField(main, alt, currentValue, suggestion, options) {
    var that = this,
        formattedMain = that.highlightMatches(
            main,
            currentValue,
            suggestion,
            options
        ),
        formattedAlt = that.highlightMatches(
            alt,
            currentValue,
            suggestion,
            options
        );

    return chooseFormattedField(formattedMain, formattedAlt);
}

var PARTY_TYPE = {
    urlSuffix: "party",
    noSuggestionsHint: "Неизвестная организация",
    matchers: [
        matchers.matchByFields(
            // These fields of suggestion's `data` used by by-words matcher
            {
                value: null,
                "data.address.value": ADDRESS_STOPWORDS,
                "data.inn": null,
                "data.ogrn": null
            }
        )
    ],
    dataComponents: ADDRESS_COMPONENTS,
    enrichmentEnabled: true,
    enrichmentMethod: "findById",
    enrichmentParams: {
        count: 1,
        locations_boost: null
    },
    getEnrichmentQuery: function(suggestion) {
        return suggestion.data.hid;
    },
    geoEnabled: true,
    formatResult: function(value, currentValue, suggestion, options) {
        var that = this,
            formattedInn = that.type.formatResultInn.call(
                that,
                suggestion,
                currentValue
            ),
            formatterOGRN = that.highlightMatches(
                object_util.getDeepValue(suggestion.data, "ogrn"),
                currentValue,
                suggestion
            ),
            formattedInnOGRN = chooseFormattedField(
                formattedInn,
                formatterOGRN
            ),
            formattedFIO = that.highlightMatches(
                object_util.getDeepValue(suggestion.data, "management.name"),
                currentValue,
                suggestion
            ),
            address =
                object_util.getDeepValue(suggestion.data, "address.value") ||
                "";

        if (that.isMobile) {
            (options || (options = {})).maxLength = 50;
        }

        value = formattedField.call(
            that,
            value,
            object_util.getDeepValue(suggestion.data, "name.latin"),
            currentValue,
            suggestion,
            options
        );
        value = that.wrapFormattedValue(value, suggestion);

        if (address) {
            address = address.replace(/^(\d{6}|Россия),\s+/i, "");
            if (that.isMobile) {
                // keep only two first words
                address = address.replace(
                    new RegExp(
                        "^([^" +
                            WORD_DELIMITERS +
                            "]+[" +
                            WORD_DELIMITERS +
                            "]+[^" +
                            WORD_DELIMITERS +
                            "]+).*"
                    ),
                    "$1"
                );
            } else {
                address = that.highlightMatches(
                    address,
                    currentValue,
                    suggestion,
                    {
                        unformattableTokens: ADDRESS_STOPWORDS
                    }
                );
            }
        }

        if (formattedInnOGRN || address || formattedFIO) {
            value +=
                '<div class="' +
                that.classes.subtext +
                '">' +
                '<span class="' +
                that.classes.subtext_inline +
                '">' +
                (formattedInnOGRN || "") +
                "</span>" +
                (chooseFormattedField(address, formattedFIO) || "") +
                "</div>";
        }
        return value;
    },
    formatResultInn: function(suggestion, currentValue) {
        var that = this,
            inn = suggestion.data && suggestion.data.inn,
            innPartsLength =
                innPartsLengths[suggestion.data && suggestion.data.type],
            innParts,
            formattedInn,
            rDigit = /\d/;

        if (inn) {
            formattedInn = that.highlightMatches(inn, currentValue, suggestion);
            if (innPartsLength) {
                formattedInn = formattedInn.split("");
                innParts = innPartsLength.map(function(partLength) {
                    var formattedPart = "",
                        ch;

                    while (partLength && (ch = formattedInn.shift())) {
                        formattedPart += ch;
                        if (rDigit.test(ch)) partLength--;
                    }

                    return formattedPart;
                });
                formattedInn =
                    innParts.join(
                        '<span class="' +
                            that.classes.subtext_delimiter +
                            '"></span>'
                    ) + formattedInn.join("");
            }

            return formattedInn;
        }
    }
};

var EMAIL_TYPE = {
    urlSuffix: "email",
    noSuggestionsHint: false,
    matchers: [matchers.matchByNormalizedQuery()],
    isQueryRequestable: function(query) {
        return this.options.suggest_local || query.indexOf("@") >= 0;
    }
};

var BANK_TYPE = {
    urlSuffix: "bank",
    noSuggestionsHint: "Неизвестный банк",
    matchers: [
        matchers.matchByFields(
            // These fields of suggestion's `data` used by by-words matcher
            {
                value: null,
                "data.bic": null,
                "data.swift": null,
            }
        ),
    ],
    dataComponents: ADDRESS_COMPONENTS,
    enrichmentEnabled: true,
    enrichmentMethod: "findById",
    enrichmentParams: {
        count: 1,
    },
    getEnrichmentQuery: function(suggestion) {
        return suggestion.data.bic;
    },
    geoEnabled: true,
    formatResult: function(value, currentValue, suggestion, options) {
        var that = this,
            formattedBIC = that.highlightMatches(
                object_util.getDeepValue(suggestion.data, "bic"),
                currentValue,
                suggestion
            ),
            address =
                object_util.getDeepValue(suggestion.data, "address.value") ||
                "";

        value = that.highlightMatches(value, currentValue, suggestion, options);
        value = that.wrapFormattedValue(value, suggestion);

        if (address) {
            address = address.replace(/^\d{6}( РОССИЯ)?, /i, "");
            if (that.isMobile) {
                // keep only two first words
                address = address.replace(
                    new RegExp(
                        "^([^" +
                            WORD_DELIMITERS +
                            "]+[" +
                            WORD_DELIMITERS +
                            "]+[^" +
                            WORD_DELIMITERS +
                            "]+).*"
                    ),
                    "$1"
                );
            } else {
                address = that.highlightMatches(
                    address,
                    currentValue,
                    suggestion,
                    {
                        unformattableTokens: ADDRESS_STOPWORDS,
                    }
                );
            }
        }

        if (formattedBIC || address) {
            value +=
                '<div class="' +
                that.classes.subtext +
                '">' +
                '<span class="' +
                that.classes.subtext_inline +
                '">' +
                formattedBIC +
                "</span>" +
                address +
                "</div>";
        }
        return value;
    },
    formatSelected: function(suggestion) {
        return (
            object_util.getDeepValue(suggestion, "data.name.payment") || null
        );
    },
};

function Outward(name) {
    this.urlSuffix = name.toLowerCase();
    this.noSuggestionsHint = "Неизвестное значение";
    this.matchers = [
        matchers.matchByNormalizedQuery(),
        matchers.matchByWords()
    ];
}

/**
 * Type is a bundle of properties:
 * - urlSuffix Mandatory. String
 * - matchers Mandatory. Array of functions (with optional data bound as a context) that find appropriate suggestion to select
 * - `fieldNames` Map fields of suggestion.data to their displayable names
 * - `unformattableTokens` Array of strings which should not be highlighted
 * - `dataComponents` Array of 'bound's can be set as `bounds` option. Order is important.
 *
 * flags:
 * - `alwaysContinueSelecting` Forbids to hide dropdown after selecting
 * - `geoEnabled` Makes to detect client's location for passing it to all requests
 * - `enrichmentEnabled` Makes to send additional request when a suggestion is selected
 *
 * and methods:
 * - `isDataComplete` Checks if suggestion.data can be operated as full data of it's type
 * - `composeValue` returns string value based on suggestion.data
 * - `formatResult` returns html of a suggestion. Overrides default method
 * - `formatResultInn` returns html of suggestion.data.inn
 * - `isQueryRequestable` checks if query is appropriated for requesting server
 * - `formatSelected` returns string to be inserted in textbox
 */

var types = {
    NAME: NAME_TYPE,
    ADDRESS: ADDRESS_TYPE,
    FIAS: FIAS_TYPE,
    PARTY: PARTY_TYPE,
    EMAIL: EMAIL_TYPE,
    BANK: BANK_TYPE
};

types.get = function(type) {
    if (types.hasOwnProperty(type)) {
        return types[type];
    } else {
        return new Outward(type);
    }
};

jqapi.extend(DEFAULT_OPTIONS, {
    suggest_local: true
});

var notificator = {
    chains: {},

    on: function(name, method) {
        this.get(name).push(method);
        return this;
    },

    get: function(name) {
        var chains = this.chains;
        return chains[name] || (chains[name] = []);
    }
};

var serviceMethods = {
    suggest: {
        defaultParams: {
            type: utils.getDefaultType(),
            dataType: "json",
            contentType: utils.getDefaultContentType()
        },
        addTypeInUrl: true
    },
    "iplocate/address": {
        defaultParams: {
            type: "GET",
            dataType: "json"
        },
        addTypeInUrl: false
    },
    status: {
        defaultParams: {
            type: "GET",
            dataType: "json"
        },
        addTypeInUrl: true
    },
    findById: {
        defaultParams: {
            type: utils.getDefaultType(),
            dataType: "json",
            contentType: utils.getDefaultContentType()
        },
        addTypeInUrl: true
    }
};

var requestModes = {
    suggest: {
        method: "suggest",
        userSelect: true,
        updateValue: true,
        enrichmentEnabled: true
    },
    findById: {
        method: "findById",
        userSelect: false,
        updateValue: false,
        enrichmentEnabled: false
    }
};

function Suggestions(el, options) {
    var that = this;

    // Shared variables:
    that.element = el;
    that.el = $(el);
    that.suggestions = [];
    that.badQueries = [];
    that.selectedIndex = -1;
    that.currentValue = that.element.value;
    that.intervalId = 0;
    that.cachedResponse = {};
    that.enrichmentCache = {};
    that.currentRequest = null;
    that.inputPhase = $.Deferred();
    that.fetchPhase = $.Deferred();
    that.enrichPhase = $.Deferred();
    that.onChangeTimeout = null;
    that.triggering = {};
    that.$wrapper = null;
    that.options = $.extend({}, DEFAULT_OPTIONS, options);
    that.classes = CLASSES;
    that.disabled = false;
    that.selection = null;
    that.$viewport = $(window);
    that.$body = $(document.body);
    that.type = null;
    that.status = {};

    that.setupElement();

    that.initializer = $.Deferred();

    if (that.el.is(":visible")) {
        that.initializer.resolve();
    } else {
        that.deferInitialization();
    }

    that.initializer.done($.proxy(that.initialize, that));
}

Suggestions.prototype = {
    // Creation and destruction

    initialize: function() {
        var that = this;
        that.uniqueId = utils.uniqueId("i");
        that.createWrapper();
        that.notify("initialize");
        that.bindWindowEvents();
        that.setOptions();
        that.inferIsMobile();
        that.notify("ready");
    },

    /**
     * Initialize when element is firstly interacted
     */
    deferInitialization: function() {
        var that = this,
            events = "mouseover focus keydown",
            timer,
            callback = function() {
                that.initializer.resolve();
                that.enable();
            };

        that.initializer.always(function() {
            that.el.off(events, callback);
            clearInterval(timer);
        });

        that.disabled = true;
        that.el.on(events, callback);
        timer = setInterval(function() {
            if (that.el.is(":visible")) {
                callback();
            }
        }, that.options.initializeInterval);
    },

    isInitialized: function() {
        return this.initializer.state() === "resolved";
    },

    dispose: function() {
        var that = this;
        that.initializer.reject();
        that.notify("dispose");
        that.el.removeData(DATA_ATTR_KEY).removeClass("suggestions-input");
        that.unbindWindowEvents();
        that.removeWrapper();
        that.el.trigger("suggestions-dispose");
    },

    notify: function(chainName) {
        var that = this,
            args = utils.slice(arguments, 1);

        return $.map(notificator.get(chainName), function(method) {
            return method.apply(that, args);
        });
    },

    createWrapper: function() {
        var that = this;

        that.$wrapper = $('<div class="suggestions-wrapper"/>');
        that.el.after(that.$wrapper);

        that.$wrapper.on(
            "mousedown" + EVENT_NS,
            $.proxy(that.onMousedown, that)
        );
    },

    removeWrapper: function() {
        var that = this;

        if (that.$wrapper) {
            that.$wrapper.remove();
        }
        $(that.options.$helpers).off(EVENT_NS);
    },

    /** This whole handler is needed to prevent blur event on textbox
     * when suggestion is clicked (blur leads to suggestions hide, so we need to prevent it).
     * See https://github.com/jquery/jquery-ui/blob/master/ui/autocomplete.js for details
     */
    onMousedown: function(e) {
        var that = this;

        // prevent moving focus out of the text field
        e.preventDefault();

        // IE doesn't prevent moving focus even with e.preventDefault()
        // so we set a flag to know when we should ignore the blur event
        that.cancelBlur = true;
        utils.delay(function() {
            delete that.cancelBlur;
        });

        // clicking on the scrollbar causes focus to shift to the body
        // but we can't detect a mouseup or a click immediately afterward
        // so we have to track the next mousedown and close the menu if
        // the user clicks somewhere outside of the autocomplete
        if ($(e.target).closest(".ui-menu-item").length == 0) {
            utils.delay(function() {
                $(document).one("mousedown", function(e) {
                    var $elements = that.el
                        .add(that.$wrapper)
                        .add(that.options.$helpers);

                    if (that.options.floating) {
                        $elements = $elements.add(that.$container);
                    }

                    $elements = $elements.filter(function() {
                        return this === e.target || $.contains(this, e.target);
                    });

                    if (!$elements.length) {
                        that.hide();
                    }
                });
            });
        }
    },

    bindWindowEvents: function() {
        var handler = $.proxy(this.inferIsMobile, this);
        this.$viewport.on("resize" + EVENT_NS + this.uniqueId, handler);
    },

    unbindWindowEvents: function() {
        this.$viewport.off("resize" + EVENT_NS + this.uniqueId);
    },

    scrollToTop: function() {
        var that = this,
            scrollTarget = that.options.scrollOnFocus;

        if (scrollTarget === true) {
            scrollTarget = that.el;
        }
        if (scrollTarget instanceof $ && scrollTarget.length > 0) {
            $("body,html").animate(
                {
                    scrollTop: scrollTarget.offset().top
                },
                "fast"
            );
        }
    },

    // Configuration methods

    setOptions: function(suppliedOptions) {
        var that = this;

        $.extend(that.options, suppliedOptions);

        that["type"] = types.get(that.options["type"]);

        // Check mandatory options
        $.each(
            {
                requestMode: requestModes
            },
            function(option, available) {
                that[option] = available[that.options[option]];
                if (!that[option]) {
                    that.disable();
                    throw "`" +
                        option +
                        "` option is incorrect! Must be one of: " +
                        $.map(available, function(value, name) {
                            return '"' + name + '"';
                        }).join(", ");
                }
            }
        );

        $(that.options.$helpers)
            .off(EVENT_NS)
            .on("mousedown" + EVENT_NS, $.proxy(that.onMousedown, that));

        if (that.isInitialized()) {
            that.notify("setOptions");
        }
    },

    // Common public methods

    inferIsMobile: function() {
        this.isMobile = this.$viewport.width() <= this.options.mobileWidth;
    },

    clearCache: function() {
        this.cachedResponse = {};
        this.enrichmentCache = {};
        this.badQueries = [];
    },

    clear: function() {
        var that = this,
            currentSelection = that.selection;

        if (that.isInitialized()) {
            that.clearCache();
            that.currentValue = "";
            that.selection = null;
            that.hide();
            that.suggestions = [];
            that.el.val("");
            that.el.trigger("suggestions-clear");
            that.notify("clear");
            that.trigger("InvalidateSelection", currentSelection);
        }
    },

    disable: function() {
        var that = this;

        that.disabled = true;
        that.abortRequest();
        if (that.visible) {
            that.hide();
        }
    },

    enable: function() {
        this.disabled = false;
    },

    isUnavailable: function() {
        return this.disabled;
    },

    update: function() {
        var that = this,
            query = that.el.val();

        if (that.isInitialized()) {
            that.currentValue = query;
            if (that.isQueryRequestable(query)) {
                that.updateSuggestions(query);
            } else {
                that.hide();
            }
        }
    },

    setSuggestion: function(suggestion) {
        var that = this,
            data,
            value;

        if ($.isPlainObject(suggestion) && $.isPlainObject(suggestion.data)) {
            suggestion = $.extend(true, {}, suggestion);

            if (
                that.isUnavailable() &&
                that.initializer &&
                that.initializer.state() === "pending"
            ) {
                that.initializer.resolve();
                that.enable();
            }

            if (that.bounds.own.length) {
                that.checkValueBounds(suggestion);
                data = that.copyDataComponents(
                    suggestion.data,
                    that.bounds.all
                );
                if (suggestion.data.kladr_id) {
                    data.kladr_id = that.getBoundedKladrId(
                        suggestion.data.kladr_id,
                        that.bounds.all
                    );
                }
                suggestion.data = data;
            }

            that.selection = suggestion;

            // `that.suggestions` required by `that.getSuggestionValue` and must be set before
            that.suggestions = [suggestion];
            value = that.getSuggestionValue(suggestion) || "";
            that.currentValue = value;
            that.el.val(value);
            that.abortRequest();
            that.el.trigger("suggestions-set");
        }
    },

    /**
     * Fetch full object for current INPUT's value
     * if no suitable object found, clean input element
     */
    fixData: function() {
        var that = this,
            fullQuery = that.extendedCurrentValue(),
            currentValue = that.el.val(),
            resolver = $.Deferred();

        resolver
            .done(function(suggestion) {
                that.selectSuggestion(suggestion, 0, currentValue, {
                    hasBeenEnriched: true
                });
                that.el.trigger("suggestions-fixdata", suggestion);
            })
            .fail(function() {
                that.selection = null;
                that.el.trigger("suggestions-fixdata");
            });

        if (that.isQueryRequestable(fullQuery)) {
            that.currentValue = fullQuery;
            that.getSuggestions(fullQuery, {
                count: 1,
                from_bound: null,
                to_bound: null
            })
                .done(function(suggestions) {
                    // data fetched
                    var suggestion = suggestions[0];
                    if (suggestion) {
                        resolver.resolve(suggestion);
                    } else {
                        resolver.reject();
                    }
                })
                .fail(function() {
                    // no data fetched
                    resolver.reject();
                });
        } else {
            resolver.reject();
        }
    },

    // Querying related methods

    /**
     * Looks up parent instances
     * @returns {String} current value prepended by parents' values
     */
    extendedCurrentValue: function() {
        var that = this,
            parentInstance = that.getParentInstance(),
            parentValue =
                parentInstance && parentInstance.extendedCurrentValue(),
            currentValue = $.trim(that.el.val());

        return utils.compact([parentValue, currentValue]).join(" ");
    },

    getAjaxParams: function(method, custom) {
        var that = this,
            token = $.trim(that.options.token),
            partner = $.trim(that.options.partner),
            serviceUrl = that.options.serviceUrl,
            url = that.options.url,
            serviceMethod = serviceMethods[method],
            params = $.extend(
                {
                    timeout: that.options.timeout
                },
                serviceMethod.defaultParams
            ),
            headers = {};

        if (url) {
            serviceUrl = url;
        } else {
            if (!/\/$/.test(serviceUrl)) {
                serviceUrl += "/";
            }
            serviceUrl += method;
            if (serviceMethod.addTypeInUrl) {
                serviceUrl += "/" + that.type.urlSuffix;
            }
        }

        serviceUrl = utils.fixURLProtocol(serviceUrl);

        if ($.support.cors) {
            // for XMLHttpRequest put token in header
            if (token) {
                headers["Authorization"] = "Token " + token;
            }
            if (partner) {
                headers["X-Partner"] = partner;
            }
            headers["X-Version"] = Suggestions.version;
            if (!params.headers) {
                params.headers = {};
            }
            if (!params.xhrFields) {
                params.xhrFields = {};
            }
            $.extend(params.headers, that.options.headers, headers);
            // server sets Access-Control-Allow-Origin: *
            // which requires no credentials
            params.xhrFields.withCredentials = false;
        } else {
            // for XDomainRequest put token into URL
            if (token) {
                headers["token"] = token;
            }
            if (partner) {
                headers["partner"] = partner;
            }
            headers["version"] = Suggestions.version;
            serviceUrl = utils.addUrlParams(serviceUrl, headers);
        }

        params.url = serviceUrl;

        return $.extend(params, custom);
    },

    isQueryRequestable: function(query) {
        var that = this,
            result;

        result = query.length >= that.options.minChars;

        if (result && that.type.isQueryRequestable) {
            result = that.type.isQueryRequestable.call(that, query);
        }

        return result;
    },

    constructRequestParams: function(query, customParams) {
        var that = this,
            options = that.options,
            params = $.isFunction(options.params)
                ? options.params.call(that.element, query)
                : $.extend({}, options.params);

        if (that.type.constructRequestParams) {
            $.extend(params, that.type.constructRequestParams.call(that));
        }
        $.each(that.notify("requestParams"), function(i, hookParams) {
            $.extend(params, hookParams);
        });
        params[options.paramName] = query;
        if ($.isNumeric(options.count) && options.count > 0) {
            params.count = options.count;
        }
        if (options.language) {
            params.language = options.language;
        }

        return $.extend(params, customParams);
    },

    updateSuggestions: function(query) {
        var that = this;

        that.fetchPhase = that
            .getSuggestions(query)
            .done(function(suggestions) {
                that.assignSuggestions(suggestions, query);
            });
    },

    /**
     * Get suggestions from cache or from server
     * @param {String} query
     * @param {Object} customParams parameters specified here will be passed to request body
     * @param {Object} requestOptions
     * @param {Boolean} [requestOptions.noCallbacks]  flag, request competence callbacks will not be invoked
     * @param {Boolean} [requestOptions.useEnrichmentCache]
     * @return {$.Deferred} waiter which is to be resolved with suggestions as argument
     */
    getSuggestions: function(query, customParams, requestOptions) {
        var response,
            that = this,
            options = that.options,
            noCallbacks = requestOptions && requestOptions.noCallbacks,
            useEnrichmentCache =
                requestOptions && requestOptions.useEnrichmentCache,
            method =
                (requestOptions && requestOptions.method) ||
                that.requestMode.method,
            params = that.constructRequestParams(query, customParams),
            cacheKey = $.param(params || {}),
            resolver = $.Deferred();

        response = that.cachedResponse[cacheKey];
        if (response && $.isArray(response.suggestions)) {
            resolver.resolve(response.suggestions);
        } else {
            if (that.isBadQuery(query)) {
                resolver.reject();
            } else {
                if (
                    !noCallbacks &&
                    options.onSearchStart.call(that.element, params) === false
                ) {
                    resolver.reject();
                } else {
                    that.doGetSuggestions(params, method)
                        .done(function(response) {
                            // if response is correct and current value has not been changed
                            if (
                                that.processResponse(response) &&
                                query == that.currentValue
                            ) {
                                // Cache results if cache is not disabled:
                                if (!options.noCache) {
                                    if (useEnrichmentCache) {
                                        that.enrichmentCache[query] =
                                            response.suggestions[0];
                                    } else {
                                        that.enrichResponse(response, query);
                                        that.cachedResponse[
                                            cacheKey
                                        ] = response;
                                        if (
                                            options.preventBadQueries &&
                                            response.suggestions.length === 0
                                        ) {
                                            that.badQueries.push(query);
                                        }
                                    }
                                }

                                resolver.resolve(response.suggestions);
                            } else {
                                resolver.reject();
                            }
                            if (!noCallbacks) {
                                options.onSearchComplete.call(
                                    that.element,
                                    query,
                                    response.suggestions
                                );
                            }
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            resolver.reject();
                            if (!noCallbacks && textStatus !== "abort") {
                                options.onSearchError.call(
                                    that.element,
                                    query,
                                    jqXHR,
                                    textStatus,
                                    errorThrown
                                );
                            }
                        });
                }
            }
        }
        return resolver;
    },

    /**
     * Sends an AJAX request to server suggest method.
     * @param {Object} params request params
     * @returns {$.Deferred} response promise
     */
    doGetSuggestions: function(params, method) {
        var that = this,
            request = $.ajax(
                that.getAjaxParams(method, { data: utils.serialize(params) })
            );

        that.abortRequest();
        that.currentRequest = request;
        that.notify("request");

        request.always(function() {
            that.currentRequest = null;
            that.notify("request");
        });

        return request;
    },

    isBadQuery: function(q) {
        if (!this.options.preventBadQueries) {
            return false;
        }

        var result = false;
        $.each(this.badQueries, function(i, query) {
            return !(result = q.indexOf(query) === 0);
        });
        return result;
    },

    abortRequest: function() {
        var that = this;

        if (that.currentRequest) {
            that.currentRequest.abort();
        }
    },

    /**
     * Checks response format and data
     * @return {Boolean} response contains acceptable data
     */
    processResponse: function(response) {
        var that = this,
            suggestions;

        if (!response || !$.isArray(response.suggestions)) {
            return false;
        }

        that.verifySuggestionsFormat(response.suggestions);
        that.setUnrestrictedValues(response.suggestions);

        if ($.isFunction(that.options.onSuggestionsFetch)) {
            suggestions = that.options.onSuggestionsFetch.call(
                that.element,
                response.suggestions
            );
            if ($.isArray(suggestions)) {
                response.suggestions = suggestions;
            }
        }

        return true;
    },

    verifySuggestionsFormat: function(suggestions) {
        if (typeof suggestions[0] === "string") {
            $.each(suggestions, function(i, value) {
                suggestions[i] = { value: value, data: null };
            });
        }
    },

    /**
     * Gets string to set as input value
     *
     * @param suggestion
     * @param {Object} [selectionOptions]
     * @param {boolean} selectionOptions.hasBeenEnriched
     * @param {boolean} selectionOptions.hasSameValues
     * @return {string}
     */
    getSuggestionValue: function(suggestion, selectionOptions) {
        var that = this,
            formatSelected =
                that.options.formatSelected || that.type.formatSelected,
            hasSameValues = selectionOptions && selectionOptions.hasSameValues,
            hasBeenEnriched =
                selectionOptions && selectionOptions.hasBeenEnriched,
            formattedValue,
            typeFormattedValue = null;

        if ($.isFunction(formatSelected)) {
            formattedValue = formatSelected.call(that, suggestion);
        }

        if (typeof formattedValue !== "string") {
            formattedValue = suggestion.value;

            if (that.type.getSuggestionValue) {
                typeFormattedValue = that.type.getSuggestionValue(that, {
                    suggestion: suggestion,
                    hasSameValues: hasSameValues,
                    hasBeenEnriched: hasBeenEnriched
                });

                if (typeFormattedValue !== null) {
                    formattedValue = typeFormattedValue;
                }
            }
        }

        return formattedValue;
    },

    hasSameValues: function(suggestion) {
        var hasSame = false;

        $.each(this.suggestions, function(i, anotherSuggestion) {
            if (
                anotherSuggestion.value === suggestion.value &&
                anotherSuggestion !== suggestion
            ) {
                hasSame = true;
                return false;
            }
        });

        return hasSame;
    },

    assignSuggestions: function(suggestions, query) {
        var that = this;
        that.suggestions = suggestions;
        that.notify("assignSuggestions", query);
    },

    shouldRestrictValues: function() {
        var that = this;
        // treat suggestions value as restricted only if there is one constraint
        // and restrict_value is true
        return (
            that.options.restrict_value &&
            that.constraints &&
            Object.keys(that.constraints).length == 1
        );
    },

    /**
     * Fills suggestion.unrestricted_value property
     */
    setUnrestrictedValues: function(suggestions) {
        var that = this,
            shouldRestrict = that.shouldRestrictValues(),
            label = that.getFirstConstraintLabel();

        $.each(suggestions, function(i, suggestion) {
            if (!suggestion.unrestricted_value) {
                suggestion.unrestricted_value = shouldRestrict
                    ? label + ", " + suggestion.value
                    : suggestion.value;
            }
        });
    },

    areSuggestionsSame: function(a, b) {
        return a && b && a.value === b.value && utils.areSame(a.data, b.data);
    },

    getNoSuggestionsHint: function() {
        var that = this;
        if (that.options.noSuggestionsHint === false) {
            return false;
        }
        return that.options.noSuggestionsHint || that.type.noSuggestionsHint;
    }
};

/**
 * Methods related to INPUT's behavior
 */

var methods = {
    setupElement: function() {
        // Remove autocomplete attribute to prevent native suggestions:
        this.el
            // if it stops working, see https://stackoverflow.com/q/15738259
            // chrome is constantly changing this logic
            .attr("autocomplete", "new-password")
            .attr("autocorrect", "off")
            .attr("autocapitalize", "off")
            .attr("spellcheck", "false")
            .addClass("suggestions-input")
            .css("box-sizing", "border-box");
    },

    bindElementEvents: function() {
        var that = this;

        that.el.on("keydown" + EVENT_NS, $.proxy(that.onElementKeyDown, that));
        // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
        that.el.on(
            [
                "keyup" + EVENT_NS,
                "cut" + EVENT_NS,
                "paste" + EVENT_NS,
                "input" + EVENT_NS
            ].join(" "),
            $.proxy(that.onElementKeyUp, that)
        );
        that.el.on("blur" + EVENT_NS, $.proxy(that.onElementBlur, that));
        that.el.on("focus" + EVENT_NS, $.proxy(that.onElementFocus, that));
    },

    unbindElementEvents: function() {
        this.el.off(EVENT_NS);
    },

    onElementBlur: function() {
        var that = this;

        // suggestion was clicked, blur should be ignored
        // see container mousedown handler
        if (that.cancelBlur) {
            that.cancelBlur = false;
            return;
        }

        if (that.options.triggerSelectOnBlur) {
            if (!that.isUnavailable()) {
                that.selectCurrentValue({ noSpace: true }).always(function() {
                    // For NAMEs selecting keeps suggestions list visible, so hide it
                    that.hide();
                });
            }
        } else {
            that.hide();
        }

        if (that.fetchPhase.abort) {
            that.fetchPhase.abort();
        }
    },

    onElementFocus: function() {
        var that = this;

        if (!that.cancelFocus) {
            // defer methods to allow browser update input's style before
            utils.delay($.proxy(that.completeOnFocus, that));
        }
        that.cancelFocus = false;
    },

    onElementKeyDown: function(e) {
        var that = this;

        if (that.isUnavailable()) {
            return;
        }

        if (!that.visible) {
            switch (e.which) {
                // If suggestions are hidden and user presses arrow down, display suggestions
                case KEYS.DOWN:
                    that.suggest();
                    break;
                // if no suggestions available and user pressed Enter
                case KEYS.ENTER:
                    if (that.options.triggerSelectOnEnter) {
                        that.triggerOnSelectNothing();
                    }
                    break;
            }
            return;
        }

        switch (e.which) {
            case KEYS.ESC:
                that.el.val(that.currentValue);
                that.hide();
                that.abortRequest();
                break;

            case KEYS.TAB:
                if (that.options.tabDisabled === false) {
                    return;
                }
                break;

            case KEYS.ENTER:
                if (that.options.triggerSelectOnEnter) {
                    that.selectCurrentValue();
                }
                break;

            case KEYS.SPACE:
                if (that.options.triggerSelectOnSpace && that.isCursorAtEnd()) {
                    e.preventDefault();
                    that.selectCurrentValue({
                        continueSelecting: true,
                        dontEnrich: true
                    }).fail(function() {
                        // If all data fetched but nothing selected
                        that.currentValue += " ";
                        that.el.val(that.currentValue);
                        that.proceedChangedValue();
                    });
                }
                return;
            case KEYS.UP:
                that.moveUp();
                break;
            case KEYS.DOWN:
                that.moveDown();
                break;
            default:
                return;
        }

        // Cancel event if function did not return:
        e.stopImmediatePropagation();
        e.preventDefault();
    },

    onElementKeyUp: function(e) {
        var that = this;

        if (that.isUnavailable()) {
            return;
        }

        switch (e.which) {
            case KEYS.UP:
            case KEYS.DOWN:
            case KEYS.ENTER:
                return;
        }

        // Cancel pending change
        clearTimeout(that.onChangeTimeout);
        that.inputPhase.reject();

        if (that.currentValue !== that.el.val()) {
            that.proceedChangedValue();
        }
    },

    proceedChangedValue: function() {
        var that = this;

        // Cancel fetching, because it became obsolete
        that.abortRequest();

        that.inputPhase = $.Deferred().done($.proxy(that.onValueChange, that));

        if (that.options.deferRequestBy > 0) {
            // Defer lookup in case when value changes very quickly:
            that.onChangeTimeout = utils.delay(function() {
                that.inputPhase.resolve();
            }, that.options.deferRequestBy);
        } else {
            that.inputPhase.resolve();
        }
    },

    onValueChange: function() {
        var that = this,
            currentSelection;

        if (that.selection) {
            currentSelection = that.selection;
            that.selection = null;
            that.trigger("InvalidateSelection", currentSelection);
        }

        that.selectedIndex = -1;

        that.update();
        that.notify("valueChange");
    },

    completeOnFocus: function() {
        var that = this;

        if (that.isUnavailable()) {
            return;
        }

        if (that.isElementFocused()) {
            that.update();
            if (that.isMobile) {
                that.setCursorAtEnd();
                that.scrollToTop();
            }
        }
    },

    isElementFocused: function() {
        return document.activeElement === this.element;
    },

    isElementDisabled: function() {
        return Boolean(
            this.element.getAttribute("disabled") ||
                this.element.getAttribute("readonly")
        );
    },

    isCursorAtEnd: function() {
        var that = this,
            valLength = that.el.val().length,
            selectionStart,
            range;

        // `selectionStart` and `selectionEnd` are not supported by some input types
        try {
            selectionStart = that.element.selectionStart;
            if (typeof selectionStart === "number") {
                return selectionStart === valLength;
            }
        } catch (ex) {}

        if (document.selection) {
            range = document.selection.createRange();
            range.moveStart("character", -valLength);
            return valLength === range.text.length;
        }
        return true;
    },

    setCursorAtEnd: function() {
        var element = this.element;

        // `selectionStart` and `selectionEnd` are not supported by some input types
        try {
            element.selectionEnd = element.selectionStart =
                element.value.length;
            element.scrollLeft = element.scrollWidth;
        } catch (ex) {
            element.value = element.value;
        }
    }
};

$.extend(Suggestions.prototype, methods);

notificator
    .on("initialize", methods.bindElementEvents)
    .on("dispose", methods.unbindElementEvents);

/**
 * Methods related to plugin's authorization on server
 */

// keys are "[type][token]"
var statusRequests = {};

function resetTokens() {
    utils.each(statusRequests, function(req) {
        req.abort();
    });
    statusRequests = {};
}

resetTokens();

var methods$1 = {
    checkStatus: function() {
        var that = this,
            token = (that.options.token && that.options.token.trim()) || "",
            requestKey = that.options.type + token,
            request = statusRequests[requestKey];

        if (!request) {
            request = statusRequests[requestKey] = jqapi.ajax(
                that.getAjaxParams("status")
            );
        }

        request
            .done(function(status, textStatus, request) {
                if (status.search) {
                    var plan = request.getResponseHeader("X-Plan");
                    status.plan = plan;
                    jqapi.extend(that.status, status);
                } else {
                    triggerError("Service Unavailable");
                }
            })
            .fail(function() {
                triggerError(request.statusText);
            });

        function triggerError(errorThrown) {
            // If unauthorized
            if (utils.isFunction(that.options.onSearchError)) {
                that.options.onSearchError.call(
                    that.element,
                    null,
                    request,
                    "error",
                    errorThrown
                );
            }
        }
    }
};

Suggestions.resetTokens = resetTokens;

jqapi.extend(Suggestions.prototype, methods$1);

notificator.on("setOptions", methods$1.checkStatus);

//export { methods, resetTokens };

var locationRequest;
var defaultGeoLocation = true;

function resetLocation() {
    locationRequest = null;
    DEFAULT_OPTIONS.geoLocation = defaultGeoLocation;
}

var methods$2 = {
    checkLocation: function() {
        var that = this,
            providedLocation = that.options.geoLocation;

        if (!that.type.geoEnabled || !providedLocation) {
            return;
        }

        that.geoLocation = $.Deferred();
        if ($.isPlainObject(providedLocation) || $.isArray(providedLocation)) {
            that.geoLocation.resolve(providedLocation);
        } else {
            if (!locationRequest) {
                locationRequest = $.ajax(
                    that.getAjaxParams("iplocate/address")
                );
            }

            locationRequest
                .done(function(resp) {
                    var locationData =
                        resp && resp.location && resp.location.data;
                    if (locationData && locationData.kladr_id) {
                        that.geoLocation.resolve({
                            kladr_id: locationData.kladr_id
                        });
                    } else {
                        that.geoLocation.reject();
                    }
                })
                .fail(function() {
                    that.geoLocation.reject();
                });
        }
    },

    /**
     * Public method to get `geoLocation` promise
     * @returns {$.Deferred}
     */
    getGeoLocation: function() {
        return this.geoLocation;
    },

    constructParams: function() {
        var that = this,
            params = {};

        if (
            that.geoLocation &&
            $.isFunction(that.geoLocation.promise) &&
            that.geoLocation.state() == "resolved"
        ) {
            that.geoLocation.done(function(locationData) {
                params["locations_boost"] = $.makeArray(locationData);
            });
        }

        return params;
    }
};

// Disable this feature when GET method used. See SUG-202
if (utils.getDefaultType() != "GET") {
    $.extend(DEFAULT_OPTIONS, {
        geoLocation: defaultGeoLocation
    });

    $.extend(Suggestions, {
        resetLocation: resetLocation
    });

    $.extend(Suggestions.prototype, {
        getGeoLocation: methods$2.getGeoLocation
    });

    notificator
        .on("setOptions", methods$2.checkLocation)
        .on("requestParams", methods$2.constructParams);
}

var methods$3 = {
    enrichSuggestion: function(suggestion, selectionOptions) {
        var that = this,
            resolver = $.Deferred();

        if (
            !that.options.enrichmentEnabled ||
            !that.type.enrichmentEnabled ||
            !that.requestMode.enrichmentEnabled ||
            (selectionOptions && selectionOptions.dontEnrich)
        ) {
            return resolver.resolve(suggestion);
        }

        // if current suggestion is already enriched, use it
        if (suggestion.data && suggestion.data.qc != null) {
            return resolver.resolve(suggestion);
        }

        that.disableDropdown();

        var query = that.type.getEnrichmentQuery(suggestion);
        var customParams = that.type.enrichmentParams;
        var requestOptions = {
            noCallbacks: true,
            useEnrichmentCache: true,
            method: that.type.enrichmentMethod
        };

        // Set `currentValue` to make `processResponse` to consider enrichment response valid
        that.currentValue = query;

        // prevent request abortion during onBlur
        that.enrichPhase = that
            .getSuggestions(query, customParams, requestOptions)
            .always(function() {
                that.enableDropdown();
            })
            .done(function(suggestions) {
                var enrichedSuggestion = suggestions && suggestions[0];

                resolver.resolve(
                    enrichedSuggestion || suggestion,
                    !!enrichedSuggestion
                );
            })
            .fail(function() {
                resolver.resolve(suggestion);
            });

        return resolver;
    },

    /**
     * Injects enriched suggestion into response
     * @param response
     * @param query
     */
    enrichResponse: function(response, query) {
        var that = this,
            enrichedSuggestion = that.enrichmentCache[query];

        if (enrichedSuggestion) {
            $.each(response.suggestions, function(i, suggestion) {
                if (suggestion.value === query) {
                    response.suggestions[i] = enrichedSuggestion;
                    return false;
                }
            });
        }
    }
};

$.extend(Suggestions.prototype, methods$3);

/**
 * Methods related to suggestions dropdown list
 */

function highlightMatches(chunks) {
    return $.map(chunks, function(chunk) {
        var text = utils.escapeHtml(chunk.text);

        if (text && chunk.matched) {
            text = "<strong>" + text + "</strong>";
        }
        return text;
    }).join("");
}

function nowrapLinkedParts(formattedStr, nowrapClass) {
    var delimitedParts = formattedStr.split(", ");
    // string has no delimiters, should not wrap
    if (delimitedParts.length === 1) {
        return formattedStr;
    }
    // disable word-wrap inside delimited parts
    return $.map(delimitedParts, function(part) {
        return '<span class="' + nowrapClass + '">' + part + "</span>";
    }).join(", ");
}

function hasAnotherSuggestion(suggestions, suggestion) {
    var result = false;

    $.each(suggestions, function(i, s) {
        result = s.value == suggestion.value && s != suggestion;
        if (result) {
            return false;
        }
    });

    return result;
}

var optionsUsed = {
    width: "auto",
    floating: false
};

var methods$4 = {
    createContainer: function() {
        var that = this,
            suggestionSelector = "." + that.classes.suggestion,
            options = that.options,
            $container = $("<div/>")
                .addClass(options.containerClass)
                .css({
                    display: "none"
                });

        that.$container = $container;

        $container.on(
            "click" + EVENT_NS,
            suggestionSelector,
            $.proxy(that.onSuggestionClick, that)
        );
    },

    showContainer: function() {
        this.$container.appendTo(
            this.options.floating ? this.$body : this.$wrapper
        );
    },

    getContainer: function() {
        return this.$container.get(0);
    },

    removeContainer: function() {
        var that = this;

        if (that.options.floating) {
            that.$container.remove();
        }
    },

    setContainerOptions: function() {
        var that = this,
            mousedownEvent = "mousedown" + EVENT_NS;

        that.$container.off(mousedownEvent);
        if (that.options.floating) {
            that.$container.on(mousedownEvent, $.proxy(that.onMousedown, that));
        }
    },

    /**
     * Listen for click event on suggestions list:
     */
    onSuggestionClick: function(e) {
        var that = this,
            $el = $(e.target),
            index;

        if (!that.dropdownDisabled) {
            that.cancelFocus = true;
            that.el.focus();

            while ($el.length && !(index = $el.attr("data-index"))) {
                $el = $el.closest("." + that.classes.suggestion);
            }

            if (index && !isNaN(index)) {
                that.select(+index);
            }
        }
    },

    // Dropdown UI methods

    getSuggestionsItems: function() {
        return this.$container.children("." + this.classes.suggestion);
    },

    toggleDropdownEnabling: function(enable) {
        this.dropdownDisabled = !enable;
        this.$container.attr("disabled", !enable);
    },

    disableDropdown: function() {
        this.toggleDropdownEnabling(false);
    },

    enableDropdown: function() {
        this.toggleDropdownEnabling(true);
    },

    /**
     * Shows if there are any suggestions besides currently selected
     * @returns {boolean}
     */
    hasSuggestionsToChoose: function() {
        var that = this;

        return (
            that.suggestions.length > 1 ||
            (that.suggestions.length === 1 &&
                (!that.selection ||
                    $.trim(that.suggestions[0].value) !==
                        $.trim(that.selection.value)))
        );
    },

    suggest: function() {
        var that = this,
            options = that.options,
            formatResult,
            html = [];

        if (!that.requestMode.userSelect) {
            return;
        }

        // если нечего показывать, то сообщаем об этом
        if (!that.hasSuggestionsToChoose()) {
            if (that.suggestions.length) {
                that.hide();
                return;
            } else {
                var noSuggestionsHint = that.getNoSuggestionsHint();
                if (noSuggestionsHint) {
                    html.push(
                        '<div class="' +
                            that.classes.hint +
                            '">' +
                            noSuggestionsHint +
                            "</div>"
                    );
                } else {
                    that.hide();
                    return;
                }
            }
        } else {
            // Build hint html
            if (options.hint && that.suggestions.length) {
                html.push(
                    '<div class="' +
                        that.classes.hint +
                        '">' +
                        options.hint +
                        "</div>"
                );
            }
            that.selectedIndex = -1;
            // Build suggestions inner HTML:
            that.suggestions.forEach(function(suggestion, i) {
                if (suggestion == that.selection) {
                    that.selectedIndex = i;
                }
                that.buildSuggestionHtml(suggestion, i, html);
            });
        }

        html.push('<div class="' + CLASSES.promo + '"></div>');
        html.push("</div>");

        that.$container.html(html.join(""));

        // Select first value by default:
        if (options.autoSelectFirst && that.selectedIndex === -1) {
            that.selectedIndex = 0;
        }
        if (that.selectedIndex !== -1) {
            that.getSuggestionsItems()
                .eq(that.selectedIndex)
                .addClass(that.classes.selected);
        }

        if ($.isFunction(options.beforeRender)) {
            options.beforeRender.call(that.element, that.$container);
        }

        that.$container.show();
        that.visible = true;
    },

    buildSuggestionHtml: function(suggestion, ordinal, html) {
        html.push(
            '<div class="' +
                this.classes.suggestion +
                '" data-index="' +
                ordinal +
                '">'
        );

        var formatResult =
            this.options.formatResult ||
            this.type.formatResult ||
            this.formatResult;
        html.push(
            formatResult.call(
                this,
                suggestion.value,
                this.currentValue,
                suggestion,
                {
                    unformattableTokens: this.type.unformattableTokens
                }
            )
        );

        var labels = this.makeSuggestionLabel(this.suggestions, suggestion);
        if (labels) {
            html.push(
                '<span class="' +
                    this.classes.subtext_label +
                    '">' +
                    utils.escapeHtml(labels) +
                    "</span>"
            );
        }
        html.push("</div>");
    },

    wrapFormattedValue: function(value, suggestion) {
        var that = this,
            status = utils.getDeepValue(suggestion.data, "state.status");

        return (
            '<span class="' +
            that.classes.value +
            '"' +
            (status ? ' data-suggestion-status="' + status + '"' : "") +
            ">" +
            value +
            "</span>"
        );
    },

    formatResult: function(value, currentValue, suggestion, options) {
        var that = this;

        value = that.highlightMatches(value, currentValue, suggestion, options);

        return that.wrapFormattedValue(value, suggestion);
    },

    /**
     * Makes HTML contents for suggestion item
     * @param {String} value string to be displayed as a value
     * @param {String} currentValue contents of the textbox
     * @param suggestion whole suggestion object with displaying value and other fields
     * @param {Object} [options] set of flags:
     *          `unformattableTokens` - array of search tokens, that are not to be highlighted
     *          `maxLength` - if set, `value` is limited by this length
     * @returns {String} HTML to be inserted in the list
     */
    highlightMatches: function(value, currentValue, suggestion, options) {
        var that = this,
            chunks = [],
            unformattableTokens = options && options.unformattableTokens,
            maxLength = options && options.maxLength,
            tokens,
            tokenMatchers,
            preferredTokens,
            rWords = utils.reWordExtractor(),
            match,
            word,
            i,
            chunk,
            formattedStr;

        if (!value) return "";

        tokens = text_util.tokenize(currentValue, unformattableTokens);

        tokenMatchers = $.map(tokens, function(token) {
            return new RegExp(
                "^((.*)([" +
                    WORD_PARTS_DELIMITERS +
                    "]+))?" +
                    "(" +
                    utils.escapeRegExChars(token) +
                    ")" +
                    "([^" +
                    WORD_PARTS_DELIMITERS +
                    "]*[" +
                    WORD_PARTS_DELIMITERS +
                    "]*)",
                "i"
            );
        });

        // parse string by words
        while ((match = rWords.exec(value)) && match[0]) {
            word = match[1];
            chunks.push({
                text: word,

                // upper case means a word is a name and can be highlighted even if presents in unformattableTokens
                hasUpperCase: word.toLowerCase() !== word,
                formatted: utils.formatToken(word),
                matchable: true
            });
            if (match[2]) {
                chunks.push({
                    text: match[2]
                });
            }
        }

        // use simple loop because length can change
        for (i = 0; i < chunks.length; i++) {
            chunk = chunks[i];
            if (
                chunk.matchable &&
                !chunk.matched &&
                ($.inArray(chunk.formatted, unformattableTokens) === -1 ||
                    chunk.hasUpperCase)
            ) {
                $.each(tokenMatchers, function(j, matcher) {
                    var tokenMatch = matcher.exec(chunk.formatted),
                        length,
                        nextIndex = i + 1;

                    if (tokenMatch) {
                        tokenMatch = {
                            before: tokenMatch[1] || "",
                            beforeText: tokenMatch[2] || "",
                            beforeDelimiter: tokenMatch[3] || "",
                            text: tokenMatch[4] || "",
                            after: tokenMatch[5] || ""
                        };

                        if (tokenMatch.before) {
                            // insert chunk before current
                            chunks.splice(
                                i,
                                0,
                                {
                                    text: chunk.text.substr(
                                        0,
                                        tokenMatch.beforeText.length
                                    ),
                                    formatted: tokenMatch.beforeText,
                                    matchable: true
                                },
                                {
                                    text: tokenMatch.beforeDelimiter
                                }
                            );
                            nextIndex += 2;

                            length = tokenMatch.before.length;
                            chunk.text = chunk.text.substr(length);
                            chunk.formatted = chunk.formatted.substr(length);
                            i--;
                        }

                        length =
                            tokenMatch.text.length + tokenMatch.after.length;
                        if (chunk.formatted.length > length) {
                            chunks.splice(nextIndex, 0, {
                                text: chunk.text.substr(length),
                                formatted: chunk.formatted.substr(length),
                                matchable: true
                            });
                            chunk.text = chunk.text.substr(0, length);
                            chunk.formatted = chunk.formatted.substr(0, length);
                        }

                        if (tokenMatch.after) {
                            length = tokenMatch.text.length;
                            chunks.splice(nextIndex, 0, {
                                text: chunk.text.substr(length),
                                formatted: chunk.formatted.substr(length)
                            });
                            chunk.text = chunk.text.substr(0, length);
                            chunk.formatted = chunk.formatted.substr(0, length);
                        }
                        chunk.matched = true;
                        return false;
                    }
                });
            }
        }

        if (maxLength) {
            for (i = 0; i < chunks.length && maxLength >= 0; i++) {
                chunk = chunks[i];
                maxLength -= chunk.text.length;
                if (maxLength < 0) {
                    chunk.text =
                        chunk.text.substr(0, chunk.text.length + maxLength) +
                        "...";
                }
            }
            chunks.length = i;
        }

        formattedStr = highlightMatches(chunks);
        return nowrapLinkedParts(formattedStr, that.classes.nowrap);
    },

    makeSuggestionLabel: function(suggestions, suggestion) {
        var that = this,
            fieldNames = that.type.fieldNames,
            nameData = {},
            rWords = utils.reWordExtractor(),
            match,
            word,
            labels = [];

        if (
            fieldNames &&
            hasAnotherSuggestion(suggestions, suggestion) &&
            suggestion.data
        ) {
            $.each(fieldNames, function(field) {
                var value = suggestion.data[field];
                if (value) {
                    nameData[field] = utils.formatToken(value);
                }
            });

            if (!$.isEmptyObject(nameData)) {
                while (
                    (match = rWords.exec(
                        utils.formatToken(suggestion.value)
                    )) &&
                    (word = match[1])
                ) {
                    $.each(nameData, function(i, value) {
                        if (value == word) {
                            labels.push(fieldNames[i]);
                            delete nameData[i];
                            return false;
                        }
                    });
                }

                if (labels.length) {
                    return labels.join(", ");
                }
            }
        }
    },

    hide: function() {
        var that = this;
        that.visible = false;
        that.selectedIndex = -1;
        that.$container.hide().empty();
    },

    activate: function(index) {
        var that = this,
            $activeItem,
            selected = that.classes.selected,
            $children;

        if (!that.dropdownDisabled) {
            $children = that.getSuggestionsItems();

            $children.removeClass(selected);

            that.selectedIndex = index;

            if (
                that.selectedIndex !== -1 &&
                $children.length > that.selectedIndex
            ) {
                $activeItem = $children.eq(that.selectedIndex);
                $activeItem.addClass(selected);
                return $activeItem;
            }
        }

        return null;
    },

    deactivate: function(restoreValue) {
        var that = this;

        if (!that.dropdownDisabled) {
            that.selectedIndex = -1;
            that.getSuggestionsItems().removeClass(that.classes.selected);
            if (restoreValue) {
                that.el.val(that.currentValue);
            }
        }
    },

    moveUp: function() {
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

    moveDown: function() {
        var that = this;

        if (that.dropdownDisabled) {
            return;
        }
        if (that.selectedIndex === that.suggestions.length - 1) {
            that.deactivate(true);
            return;
        }

        that.adjustScroll(that.selectedIndex + 1);
    },

    adjustScroll: function(index) {
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
        if (itemTop < 0) {
            that.$container.scrollTop(scrollTop + itemTop);
        } else {
            itemBottom = itemTop + $activeItem.outerHeight();
            containerHeight = that.$container.innerHeight();
            if (itemBottom > containerHeight) {
                that.$container.scrollTop(
                    scrollTop - containerHeight + itemBottom
                );
            }
        }

        that.el.val(that.suggestions[index].value);
    }
};

$.extend(DEFAULT_OPTIONS, optionsUsed);

$.extend(Suggestions.prototype, methods$4);

notificator
    .on("initialize", methods$4.createContainer)
    .on("dispose", methods$4.removeContainer)
    .on("setOptions", methods$4.setContainerOptions)
    .on("ready", methods$4.showContainer)
    .on("assignSuggestions", methods$4.suggest);

/**
 * Methods related to CONSTRAINTS component
 */
var optionsUsed$1 = {
    constraints: null,
    restrict_value: false
};

var fiasParamNames = [
    "country_iso_code",
    "region_iso_code",
    "region_fias_id",
    "area_fias_id",
    "city_fias_id",
    "city_district_fias_id",
    "settlement_fias_id",
    "planning_structure_fias_id",
    "street_fias_id"
];

/**
 * Compares two suggestion objects
 * @param suggestion
 * @param instance other Suggestions instance
 */
function belongsToArea(suggestion, instance) {
    var parentSuggestion = instance.selection,
        result = parentSuggestion && parentSuggestion.data && instance.bounds;

    if (result) {
        collection_util.each(instance.bounds.all, function(bound, i) {
            return (result =
                parentSuggestion.data[bound] === suggestion.data[bound]);
        });
    }
    return result;
}

/**
 * Возвращает КЛАДР-код, обрезанный до последнего непустого уровня
 * 50 000 040 000 00 → 50 000 040
 * @param kladr_id
 * @returns {string}
 */
function getSignificantKladrId(kladr_id) {
    var significantKladrId = kladr_id.replace(/^(\d{2})(\d*?)(0+)$/g, "$1$2");
    var length = significantKladrId.length;
    var significantLength = -1;
    if (length <= 2) {
        significantLength = 2;
    } else if (length > 2 && length <= 5) {
        significantLength = 5;
    } else if (length > 5 && length <= 8) {
        significantLength = 8;
    } else if (length > 8 && length <= 11) {
        significantLength = 11;
    } else if (length > 11 && length <= 15) {
        significantLength = 15;
    } else if (length > 15) {
        significantLength = 19;
    }
    return text_util.padEnd(significantKladrId, significantLength, "0");
}

/**
 * @param {Object} data  fields
 * @param {Suggestions} instance
 * @constructor
 */
var ConstraintLocation = function(data, instance) {
    var that = this,
        fieldNames,
        fiasFieldNames,
        fiasFields = {};

    that.instance = instance;
    that.fields = {};
    that.specificity = -1;

    if (lang_util.isPlainObject(data) && instance.type.dataComponents) {
        collection_util.each(instance.type.dataComponents, function(
            component,
            i
        ) {
            var fieldName = component.id;

            if (component.forLocations && data[fieldName]) {
                that.fields[fieldName] = data[fieldName];
                that.specificity = i;
            }
        });
    }

    fieldNames = Object.keys(that.fields);
    fiasFieldNames = collection_util.intersect(fieldNames, fiasParamNames);
    if (fiasFieldNames.length) {
        collection_util.each(fiasFieldNames, function(fieldName, index) {
            fiasFields[fieldName] = that.fields[fieldName];
        });
        that.fields = fiasFields;
        that.specificity = that.getFiasSpecificity(fiasFieldNames);
    } else if (that.fields.kladr_id) {
        that.fields = { kladr_id: that.fields.kladr_id };
        that.significantKladr = getSignificantKladrId(that.fields.kladr_id);
        that.specificity = that.getKladrSpecificity(that.significantKladr);
    }
};

jqapi.extend(ConstraintLocation.prototype, {
    getLabel: function() {
        return this.instance.type.composeValue(this.fields, {
            saveCityDistrict: true
        });
    },

    getFields: function() {
        return this.fields;
    },

    isValid: function() {
        return !lang_util.isEmptyObject(this.fields);
    },

    /**
     * Возвращает specificity для КЛАДР
     * Описание ниже, в getFiasSpecificity
     * @param kladr_id
     * @returns {number}
     */
    getKladrSpecificity: function(kladr_id) {
        var specificity = -1;
        var kladrLength = kladr_id.length;

        collection_util.each(this.instance.type.dataComponents, function(
            component,
            i
        ) {
            if (
                component.kladrFormat &&
                kladrLength === component.kladrFormat.digits
            ) {
                specificity = i;
            }
        });

        return specificity;
    },

    /**
     * Возвращает особую величину specificity для ФИАС
     * Specificity это индекс для массива this.instance.type.dataComponents
     * до которого (включительно) обрежется этот массив при формировании строки адреса.
     * Этот параметр нужен для случаев, когда в настройках плагина restrict_value = true
     * Например, установлено ограничение (locations) по region_fias_id (Краснодарский край)
     * В выпадашке нажимаем на "г. Сочи"
     * Если restrict_value отключен, то выведется значение "Краснодарский край, г Сочи"
     * Если включен, то просто "г Сочи"
     *
     * @param fiasFieldNames
     * @returns {number}
     */
    getFiasSpecificity: function(fiasFieldNames) {
        var specificity = -1;

        collection_util.each(this.instance.type.dataComponents, function(
            component,
            i
        ) {
            if (
                component.fiasType &&
                fiasFieldNames.indexOf(component.fiasType) > -1 &&
                specificity < i
            ) {
                specificity = i;
            }
        });

        return specificity;
    },

    containsData: function(data) {
        var result = true;

        if (this.fields.kladr_id) {
            return (
                !!data.kladr_id &&
                data.kladr_id.indexOf(this.significantKladr) === 0
            );
        } else {
            collection_util.each(this.fields, function(value, fieldName) {
                return (result =
                    !!data[fieldName] &&
                    data[fieldName].toLowerCase() === value.toLowerCase());
            });

            return result;
        }
    }
});

Suggestions.ConstraintLocation = ConstraintLocation;

/**
 * @param {Object} data
 * @param {Object|Array} data.locations
 * @param {string} [data.label]
 * @param {boolean} [data.deletable]
 * @param {Suggestions} [instance]
 * @constructor
 */
var Constraint = function(data, instance) {
    this.id = generateId("c");
    this.deletable = !!data.deletable;
    this.instance = instance;

    var locationsArray = collection_util.makeArray(
        data && (data.locations || data.restrictions)
    );
    this.locations = locationsArray.map(function(data) {
        return new ConstraintLocation(data, instance);
    });

    this.locations = this.locations.filter(function(location) {
        return location.isValid();
    });

    this.label = data.label;
    if (this.label == null && instance.type.composeValue) {
        this.label = this.locations
            .map(function(location) {
                return location.getLabel();
            })
            .join(", ");
    }
};

jqapi.extend(Constraint.prototype, {
    isValid: function() {
        return this.locations.length > 0;
    },
    getFields: function() {
        return this.locations.map(function(location) {
            return location.getFields();
        });
    }
});

var methods$5 = {
    createConstraints: function() {
        var that = this;
        that.constraints = {};
    },
    setupConstraints: function() {
        var that = this,
            constraints = that.options.constraints,
            $parent;

        if (!constraints) {
            that.unbindFromParent();
            return;
        }

        if (
            jqapi.isJqObject(constraints) ||
            typeof constraints === "string" ||
            typeof constraints.nodeType === "number"
        ) {
            $parent = jqapi.select(constraints);
            if (!$parent.is(that.constraints)) {
                that.unbindFromParent();
                if (!$parent.is(that.el)) {
                    that.constraints = $parent;
                    that.bindToParent();
                }
            }
        } else {
            collection_util.each(that.constraints, function(_, id) {
                that.removeConstraint(id);
            });
            collection_util.each(
                collection_util.makeArray(constraints),
                function(constraint, i) {
                    that.addConstraint(constraint);
                }
            );
        }
    },

    filteredLocation: function(data) {
        var locationComponents = [],
            location = {};

        collection_util.each(this.type.dataComponents, function() {
            if (this.forLocations) locationComponents.push(this.id);
        });

        if (lang_util.isPlainObject(data)) {
            // Copy to location only allowed fields
            collection_util.each(data, function(value, key) {
                if (value && locationComponents.indexOf(key) >= 0) {
                    location[key] = value;
                }
            });
        }

        if (!lang_util.isEmptyObject(location)) {
            return location.kladr_id
                ? { kladr_id: location.kladr_id }
                : location;
        }
    },

    addConstraint: function(constraint) {
        var that = this;

        constraint = new Constraint(constraint, that);

        if (constraint.isValid()) {
            that.constraints[constraint.id] = constraint;
        }
    },

    removeConstraint: function(id) {
        var that = this;
        delete that.constraints[id];
    },

    constructConstraintsParams: function() {
        var that = this,
            locations = [],
            constraints = that.constraints,
            parentInstance,
            parentData,
            params = {};

        while (
            jqapi.isJqObject(constraints) &&
            (parentInstance = constraints.suggestions()) &&
            !(parentData = object_util.getDeepValue(
                parentInstance,
                "selection.data"
            ))
        ) {
            constraints = parentInstance.constraints;
        }

        if (jqapi.isJqObject(constraints)) {
            parentData = new ConstraintLocation(
                parentData,
                parentInstance
            ).getFields();

            if (parentData) {
                // if send city_fias_id for city request
                // then no cities will responded
                if (that.bounds.own.indexOf("city") > -1) {
                    delete parentData.city_fias_id;
                }
                params.locations = [parentData];
                params.restrict_value = true;
            }
        } else {
            if (constraints) {
                collection_util.each(constraints, function(constraint, id) {
                    locations = locations.concat(constraint.getFields());
                });

                if (locations.length) {
                    params.locations = locations;
                    params.restrict_value = that.options.restrict_value;
                }
            }
        }

        return params;
    },

    /**
     * Returns label of the first constraint (if any), empty string otherwise
     * @returns {String}
     */
    getFirstConstraintLabel: function() {
        var that = this,
            constraints_id =
                lang_util.isPlainObject(that.constraints) &&
                Object.keys(that.constraints)[0];

        return constraints_id ? that.constraints[constraints_id].label : "";
    },

    bindToParent: function() {
        var that = this;

        that.constraints
            .on(
                [
                    "suggestions-select." + that.uniqueId,
                    "suggestions-invalidateselection." + that.uniqueId,
                    "suggestions-clear." + that.uniqueId
                ].join(" "),
                jqapi.proxy(that.onParentSelectionChanged, that)
            )
            .on(
                "suggestions-dispose." + that.uniqueId,
                jqapi.proxy(that.onParentDispose, that)
            );
    },

    unbindFromParent: function() {
        var that = this,
            $parent = that.constraints;

        if (jqapi.isJqObject($parent)) {
            $parent.off("." + that.uniqueId);
        }
    },

    onParentSelectionChanged: function(e, suggestion, valueChanged) {
        // Don't clear if parent has been just enriched
        if (e.type !== "suggestions-select" || valueChanged) {
            this.clear();
        }
    },

    onParentDispose: function(e) {
        this.unbindFromParent();
    },

    getParentInstance: function() {
        return (
            jqapi.isJqObject(this.constraints) && this.constraints.suggestions()
        );
    },

    shareWithParent: function(suggestion) {
        // that is the parent control's instance
        var that = this.getParentInstance();

        if (
            !that ||
            that.type !== this.type ||
            belongsToArea(suggestion, that)
        ) {
            return;
        }

        that.shareWithParent(suggestion);
        that.setSuggestion(suggestion);
    },

    /**
     * Pick only fields that absent in restriction
     */
    getUnrestrictedData: function(data) {
        var that = this,
            restrictedKeys = [],
            unrestrictedData = {},
            maxSpecificity = -1;

        // Find most specific location that could restrict current data
        collection_util.each(that.constraints, function(constraint, id) {
            collection_util.each(constraint.locations, function(location, i) {
                if (
                    location.containsData(data) &&
                    location.specificity > maxSpecificity
                ) {
                    maxSpecificity = location.specificity;
                }
            });
        });

        if (maxSpecificity >= 0) {
            // Для городов-регионов нужно также отсечь и город
            if (
                data.region_kladr_id &&
                data.region_kladr_id === data.city_kladr_id
            ) {
                restrictedKeys.push.apply(
                    restrictedKeys,
                    that.type.dataComponentsById["city"].fields
                );
            }

            // Collect all fieldnames from all restricted components
            collection_util.each(
                that.type.dataComponents.slice(0, maxSpecificity + 1),
                function(component, i) {
                    restrictedKeys.push.apply(restrictedKeys, component.fields);
                }
            );

            // Copy skipping restricted fields
            collection_util.each(data, function(value, key) {
                if (restrictedKeys.indexOf(key) === -1) {
                    unrestrictedData[key] = value;
                }
            });
        } else {
            unrestrictedData = data;
        }

        return unrestrictedData;
    }
};

jqapi.extend(DEFAULT_OPTIONS, optionsUsed$1);

jqapi.extend(Suggestions.prototype, methods$5);

// Disable this feature when GET method used. See SUG-202
if (ajax.getDefaultType() != "GET") {
    notificator
        .on("initialize", methods$5.createConstraints)
        .on("setOptions", methods$5.setupConstraints)
        .on("requestParams", methods$5.constructConstraintsParams)
        .on("dispose", methods$5.unbindFromParent);
}

/**
 * Methods for selecting a suggestion
 */

var methods$6 = {
    proceedQuery: function(query) {
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
    selectCurrentValue: function(selectionOptions) {
        var that = this,
            result = jqapi.Deferred();

        // force onValueChange to be executed if it has been deferred
        that.inputPhase.resolve();

        that.fetchPhase
            .done(function() {
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
            .fail(function() {
                result.reject();
            });

        return result;
    },

    /**
     * Selects first when user interaction is not supposed
     */
    selectFoundSuggestion: function() {
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
            value = that.el.val().trim();
            if (value) {
                that.type.matchers.some(function(matcher) {
                    index = matcher(value, that.suggestions);
                    return index !== -1;
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
    select: function(index, selectionOptions) {
        var that = this,
            suggestion = that.suggestions[index],
            continueSelecting =
                selectionOptions && selectionOptions.continueSelecting,
            currentValue = that.currentValue,
            hasSameValues;

        // Prevent recursive execution
        if (that.triggering["Select"]) return;

        // if no suggestion to select
        if (!suggestion) {
            if (!continueSelecting && !that.selection) {
                that.triggerOnSelectNothing();
            }
            that.onSelectComplete(continueSelecting);
            return;
        }

        hasSameValues = that.hasSameValues(suggestion);

        that.enrichSuggestion(suggestion, selectionOptions).done(function(
            enrichedSuggestion,
            hasBeenEnriched
        ) {
            var newSelectionOptions = jqapi.extend(
                {
                    hasBeenEnriched: hasBeenEnriched,
                    hasSameValues: hasSameValues
                },
                selectionOptions
            );
            that.selectSuggestion(
                enrichedSuggestion,
                index,
                currentValue,
                newSelectionOptions
            );
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
    selectSuggestion: function(suggestion, index, lastValue, selectionOptions) {
        var that = this,
            continueSelecting = selectionOptions.continueSelecting,
            assumeDataComplete =
                !that.type.isDataComplete ||
                that.type.isDataComplete.call(that, suggestion),
            currentSelection = that.selection;

        // Prevent recursive execution
        if (that.triggering["Select"]) return;

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
            that.currentValue = that.getSuggestionValue(
                suggestion,
                selectionOptions
            );

            if (
                that.currentValue &&
                !selectionOptions.noSpace &&
                !assumeDataComplete
            ) {
                that.currentValue += " ";
            }
            that.el.val(that.currentValue);
        }

        if (that.currentValue) {
            that.selection = suggestion;
            if (!that.areSuggestionsSame(suggestion, currentSelection)) {
                that.trigger(
                    "Select",
                    suggestion,
                    that.currentValue != lastValue
                );
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

    onSelectComplete: function(continueSelecting) {
        var that = this;

        if (continueSelecting) {
            that.selectedIndex = -1;
            that.updateSuggestions(that.currentValue);
        } else {
            that.hide();
        }
    },

    triggerOnSelectNothing: function() {
        var that = this;

        if (!that.triggering["SelectNothing"]) {
            that.trigger("SelectNothing", that.currentValue);
        }
    },

    trigger: function(event) {
        var that = this,
            args = utils.slice(arguments, 1),
            callback = that.options["on" + event];

        that.triggering[event] = true;
        if (utils.isFunction(callback)) {
            callback.apply(that.element, args);
        }
        that.el.trigger.call(
            that.el,
            "suggestions-" + event.toLowerCase(),
            args
        );
        that.triggering[event] = false;
    }
};

jqapi.extend(Suggestions.prototype, methods$6);

notificator.on("assignSuggestions", methods$6.selectFoundSuggestion);

/**
 * features for connected instances
 */

var optionsUsed$2 = {
    bounds: null,
};

var methods$7 = {
    setupBounds: function() {
        this.bounds = {
            from: null,
            to: null,
        };
    },

    setBoundsOptions: function() {
        var that = this,
            boundsAvailable = [],
            newBounds = $.trim(that.options.bounds).split("-"),
            boundFrom = newBounds[0],
            boundTo = newBounds[newBounds.length - 1],
            boundsOwn = [],
            boundIsOwn,
            boundsAll = [];

        if (that.type.dataComponents) {
            $.each(that.type.dataComponents, function() {
                if (this.forBounds) {
                    boundsAvailable.push(this.id);
                }
            });
        }

        if (boundsAvailable.indexOf(boundFrom) === -1) {
            boundFrom = null;
        }

        if (boundsAvailable.indexOf(boundTo) === -1) {
            boundTo = null;
        }

        if (boundFrom || boundTo) {
            boundIsOwn = !boundFrom;
            $.each(boundsAvailable, function(i, bound) {
                if (bound == boundFrom) {
                    boundIsOwn = true;
                }
                boundsAll.push(bound);
                if (boundIsOwn) {
                    boundsOwn.push(bound);
                }
                if (bound == boundTo) {
                    return false;
                }
            });
        }

        that.bounds.from = boundFrom;
        that.bounds.to = boundTo;
        that.bounds.all = boundsAll;
        that.bounds.own = boundsOwn;
    },

    constructBoundsParams: function() {
        var that = this,
            params = {};

        if (that.bounds.from) {
            params["from_bound"] = { value: that.bounds.from };
        }
        if (that.bounds.to) {
            params["to_bound"] = { value: that.bounds.to };
        }

        return params;
    },

    /**
     * Подстраивает suggestion.value под that.bounds.own
     * Ничего не возвращает, меняет в самом suggestion
     * @param suggestion
     */
    checkValueBounds: function(suggestion) {
        var that = this,
            valueData;

        // If any bounds set up
        if (that.bounds.own.length && that.type.composeValue) {
            // делаем копию
            var bounds = that.bounds.own.slice(0);
            // если роль текущего инстанса плагина показывать только район города
            // то для корректного формировния нужен city_district_fias_id
            if (bounds.length === 1 && bounds[0] === "city_district") {
                bounds.push("city_district_fias_id");
            }
            valueData = that.copyDataComponents(suggestion.data, bounds);
            suggestion.value = that.type.composeValue(valueData);
        }
    },

    copyDataComponents: function(data, components) {
        var result = {},
            dataComponentsById = this.type.dataComponentsById;

        if (dataComponentsById) {
            $.each(components, function(i, component) {
                $.each(dataComponentsById[component].fields, function(
                    i,
                    field
                ) {
                    if (data[field] != null) {
                        result[field] = data[field];
                    }
                });
            });
        }

        return result;
    },

    getBoundedKladrId: function(kladr_id, boundsRange) {
        var boundTo = boundsRange[boundsRange.length - 1],
            kladrFormat;

        $.each(this.type.dataComponents, function(i, component) {
            if (component.id === boundTo) {
                kladrFormat = component.kladrFormat;
                return false;
            }
        });

        return (
            kladr_id.substr(0, kladrFormat.digits) +
            new Array((kladrFormat.zeros || 0) + 1).join("0")
        );
    },
};

$.extend(DEFAULT_OPTIONS, optionsUsed$2);

$.extend(Suggestions.prototype, methods$7);

notificator
    .on("initialize", methods$7.setupBounds)
    .on("setOptions", methods$7.setBoundsOptions)
    .on("requestParams", methods$7.constructBoundsParams);

/**
 * Утилиты для работы с DOM.
 */
var dom = {
    /**
     * Выбрать первый элемент с указанным классом.
     */
    selectByClass: function(classname, parent) {
        var selector = "." + classname;
        if (parent) {
            return parent.querySelector(selector);
        } else {
            return document.querySelector(selector);
        }
    },

    /**
     * Добавить элементу класс.
     */
    addClass: function(element, className) {
        var list = element.className.split(" ");
        if (list.indexOf(className) === -1) {
            list.push(className);
        }
        element.className = list.join(" ");
    },

    /**
     * Добавить элементу стиль.
     */
    setStyle: function(element, name, value) {
        element.style[name] = value;
    },

    /**
     * Подписаться на событие на элементе.
     * @param {Element} element - элемент
     * @param {string} eventName - название события
     * @param {string} namespace - пространство имён события
     * @param {Function} callback - функция-обработчик события
     */
    listenTo: function(element, eventName, namespace, callback) {
        element.addEventListener(eventName, callback, false);
        if (namespace) {
            if (!eventsByNamespace[namespace]) {
                eventsByNamespace[namespace] = [];
            }
            eventsByNamespace[namespace].push({
                eventName: eventName,
                element: element,
                callback: callback
            });
        }
    },

    /**
     * Отписаться от всех событий с указанным пространством имён.
     */
    stopListeningNamespace: function(namespace) {
        var events = eventsByNamespace[namespace];
        if (events) {
            events.forEach(function(event) {
                event.element.removeEventListener(
                    event.eventName,
                    event.callback,
                    false
                );
            });
        }
    }
};

/**
 * Промо-ссылка в списке подсказок.
 */
var FREE_PLAN = "FREE";
var LINK =
    "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery";
var PREFIX = "";
var SUFFIX = "";
var IMAGE =
    '<svg version="1.1" viewBox="0 0 128 38" xmlns="http://www.w3.org/2000/svg"><path d="m128 19v16.077c0 1.614-1.302 2.923-2.909 2.923h-122.18c-1.607 0-2.909-1.309-2.909-2.923v-32.154c-0-1.614 1.302-2.923 2.909-2.923h122.18c1.607 0 2.909 1.309 2.909 2.923z" fill="#ef4741"/><path d="m59.52 7.912h-8.902v22.098h9.92c3.724 0 9.872-0.341 9.872-6.703v-8.682c-0.01-6.372-7.166-6.713-10.89-6.713zm5.595 14.81c0 3.186-2.308 3.508-4.936 3.508h-4.276v-14.538h3.287c2.628 0 5.954 0.322 5.954 3.508zm-46.545-14.81h-8.834v22.098h9.871c3.724 0 9.872-0.341 9.872-6.703v-8.682c0-6.372-7.137-6.713-10.88-6.713zm5.595 14.81c0 3.186-2.308 3.508-4.936 3.508h-4.247v-14.538h3.258c2.628 0 5.954 0.322 5.954 3.508zm71.757-13.953h-4.945v16.301c-0.018 0.785 0.113 1.565 0.388 2.3 0.203 0.569 0.535 1.082 0.97 1.5 0.446 0.385 0.962 0.677 1.522 0.858 0.58 0.205 1.182 0.343 1.794 0.409 0.575 0.052 1.248 0.081 2.017 0.088 0.917-1e-3 1.834-0.057 2.744-0.166v-2.796h-1.765c-0.393 0.055-0.795 0.032-1.18-0.071-0.385-0.102-0.745-0.28-1.06-0.524-0.413-0.691-0.59-1.498-0.504-2.299v-8.068h4.509v-3.06h-4.509zm20.364 5.535c-1.176-0.741-3.278-1.108-6.303-1.101h-5.741v0.243l0.708 2.826h5.033c0.837-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.458 0.553 0.579 0.891 0.121 0.339 0.162 0.701 0.119 1.058v1.12h-5.527c-1.939 0-3.271 0.38-3.995 1.14-0.725 0.76-1.099 2.127-1.125 4.102 0 2.154 0.359 3.06 1.086 3.742 0.728 0.682 2.134 1.188 4.344 1.188h6.847c1.706 0 3.345-0.808 3.345-2.747v-8.584c0-2.176-0.589-3.635-1.765-4.375zm-3.19 12.959h-3.249c-0.735 0.081-1.478-0.036-2.152-0.342-0.285-0.227-0.427-0.876-0.427-1.948s0.136-1.741 0.407-2.007c0.625-0.331 1.336-0.46 2.037-0.371h3.384zm-26.667-12.959c-1.176-0.741-3.277-1.108-6.303-1.101h-5.741v0.243l0.708 2.826h5.033c0.836-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.457 0.553 0.578 0.891 0.121 0.339 0.162 0.701 0.12 1.058v1.12h-5.556c-1.939 0-3.271 0.38-3.995 1.14s-1.086 2.127-1.086 4.102c0 2.154 0.359 3.06 1.086 3.742s2.133 1.188 4.344 1.188h6.846c1.717 0 3.346-0.808 3.346-2.747v-8.584c-7e-3 -2.176-0.595-3.635-1.765-4.375zm-3.181 12.959h-3.248c-0.735 0.081-1.478-0.037-2.153-0.342-0.284-0.227-0.426-0.876-0.426-1.948s0.135-1.741 0.407-2.007c0.624-0.331 1.336-0.46 2.036-0.371h3.384zm-37.74-12.959c-1.176-0.741-3.278-1.108-6.303-1.101h-5.712v0.243l0.708 2.826h5.033c0.837-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.457 0.553 0.578 0.891 0.121 0.339 0.162 0.701 0.12 1.058v1.12h-5.556c-1.939 0-3.271 0.38-3.995 1.14s-1.099 2.127-1.125 4.102c0 2.154 0.359 3.06 1.086 3.742s2.133 1.188 4.344 1.188h6.846c1.717 0 3.346-0.808 3.346-2.747v-8.584c0-2.176-0.589-3.635-1.765-4.375zm-3.181 12.959h-3.219c-0.735 0.081-1.478-0.037-2.153-0.342-0.284-0.227-0.427-0.876-0.427-1.948s0.136-1.741 0.408-2.007c0.624-0.331 1.336-0.46 2.036-0.371h3.384z" fill="#fff"/></svg>';

function Promo(plugin) {
    this.plan = plugin.status.plan;
    var container = plugin.getContainer();
    this.element = dom.selectByClass(CLASSES.promo, container);
}

Promo.prototype.show = function() {
    if (this.plan !== FREE_PLAN) {
        return;
    }
    if (!this.element) {
        return;
    }
    this.setStyles();
    this.setHtml();
};

Promo.prototype.setStyles = function() {
    this.element.style.display = "block";
};

Promo.prototype.setHtml = function() {
    this.element.innerHTML =
        '<a target="_blank" tabindex="-1" href="' +
        LINK +
        '">' +
        PREFIX +
        IMAGE +
        SUFFIX +
        "</a>";
};

function show() {
    new Promo(this).show();
}

notificator.on("assignSuggestions", show);

Suggestions.defaultOptions = DEFAULT_OPTIONS;

Suggestions.version = "21.12.0";

$.Suggestions = Suggestions;

// Create chainable jQuery plugin:
$.fn.suggestions = function(options, args) {
    // If function invoked without argument return
    // instance of the first matched element:
    if (arguments.length === 0) {
        return this.first().data(DATA_ATTR_KEY);
    }

    return this.each(function() {
        var inputElement = $(this),
            instance = inputElement.data(DATA_ATTR_KEY);

        if (typeof options === "string") {
            if (instance && typeof instance[options] === "function") {
                instance[options](args);
            }
        } else {
            // If instance already exists, destroy it:
            if (instance && instance.dispose) {
                instance.dispose();
            }
            instance = new Suggestions(this, options);
            inputElement.data(DATA_ATTR_KEY, instance);
        }
    });
};

})));
