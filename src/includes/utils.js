import $ from 'jquery';

import { WORD_DELIMITERS, WORD_PARTS_SPLITTER, WORD_SPLITTER } from './constants';

var utils = (function () {
    var uniqueId = 0;
    return {
        escapeRegExChars: function (value) {
            return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        escapeHtml: function (str) {
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;'
            };

            if (str) {
                $.each(map, function(ch, html){
                    str = str.replace(new RegExp(ch, 'g'), html);
                });
            }
            return str;
        },
        getDefaultType: function () {
            return ($.support.cors ? 'POST' : 'GET');
        },
        getDefaultContentType: function () {
            return ($.support.cors ? 'application/json' : 'application/x-www-form-urlencoded');
        },
        fixURLProtocol: function(url){
            return $.support.cors ? url : url.replace(/^https?:/, location.protocol);
        },
        addUrlParams: function (url, params) {
            return url + (/\?/.test(url) ? '&' : '?') + $.param(params);
        },
        serialize: function (data) {
            if ($.support.cors) {
                return JSON.stringify(data, function (key, value) {
                    return value === null ? undefined : value;
                });
            } else {
                data = this.compactObject(data);
                return $.param(data, true);
            }
        },
        compact: function (array) {
            return $.grep(array, function (el) {
                return !!el;
            });
        },
        delay: function (handler, delay) {
            return setTimeout(handler, delay || 0);
        },
        uniqueId: function (prefix) {
            return (prefix || '') + ++uniqueId;
        },
        slice: function(obj, start) {
            return Array.prototype.slice.call(obj, start);
        },
        indexBy: function (data, field, indexField) {
            var result = {};

            $.each(data, function (i, obj) {
                var key = obj[field],
                    val = {};

                if (indexField) {
                    val[indexField] = i;
                }

                result[key] = $.extend(true, val, obj);
            });

            return result;
        },

        /**
         * Compares two objects, but only fields that are set in both
         * @param a
         * @param b
         * @returns {boolean}
         */
        areSame: function self(a, b) {
            var same = true;

            if (typeof a != typeof b) {
                return false;
            }

            if (typeof a == 'object' && a != null && b != null) {
                $.each(a, function (i, value) {
                    return same = self(value, b[i]);
                });
                return same;
            }

            return a === b;
        },

        /**
         * Returns array1 minus array2
         */
        arrayMinus: function(array1, array2) {
            return array2 ? $.grep(array1, function(el, i){
                return $.inArray(el, array2) === -1;
            }) : array1;
        },
        /**
         * Returns array1 minus array2
         * if value in array1 in enclosed by value in array2, it is considered a match
         */
        arrayMinusWithPartialMatching: function(array1, array2) {
            return array2 ? $.grep(array1, function(el, i){
                return !array2.some(function(el2) {
                    return el2.indexOf(el) === 0;
                })
            }) : array1;
        },
        /**
         * Пересечение массивов: ([1,2,3,4], [2,4,5,6]) => [2,4]
         * Исходные массивы не меняются
         * @param {Array} array1
         * @param {Array} array2
         * @returns {Array}
         */
        arraysIntersection: function(array1, array2) {
            var result = [];
            if (!$.isArray(array1) || !$.isArray(array2)) {
                return result;
            }
            $.each(array1, function(index, item) {
                if ($.inArray(item, array2) >= 0) {
                    result.push(item);
                }
            });
            return result;
        },
        getWords: function(str, stopwords) {
            // Split numbers and letters written together
            str = str.replace(/(\d+)([а-яА-ЯёЁ]{2,})/g, '$1 $2')
                .replace(/([а-яА-ЯёЁ]+)(\d+)/g, '$1 $2');

            var words = this.compact(str.split(WORD_SPLITTER)),
                lastWord = words.pop(),
                goodWords = this.arrayMinus(words, stopwords);

            goodWords.push(lastWord);
            return goodWords;
        },
        /**
         * Returns normalized string without stopwords
         */
        normalize: function(str, stopwords) {
            var that = this;
            return that.getWords(str, stopwords).join(' ');
        },
        /**
         * Returns true if str1 includes str2 plus something else, false otherwise.
         */
        stringEncloses: function(str1, str2) {
            return str1.length > str2.length && str1.indexOf(str2) !== -1;
        },
        fieldsNotEmpty: function(obj, fields){
            if (!$.isPlainObject(obj)) {
                return false;
            }
            var result = true;
            $.each(fields, function (i, field) {
                return result = !!(obj[field]);
            });
            return result;
        },
        getDeepValue: function self(obj, name) {
            var path = name.split('.'),
                step = path.shift();

            return obj && (path.length ? self(obj[step], path.join('.')) : obj[step]);
        },
        reWordExtractor: function () {
            return new RegExp('([^' + WORD_DELIMITERS + ']*)([' + WORD_DELIMITERS + ']*)', 'g');
        },
        formatToken: function (token) {
            return token && token.toLowerCase().replace(/[ёЁ]/g, 'е');
        },
        withSubTokens: function (tokens) {
            var result = [];

            $.each(tokens, function (i, token) {
                var subtokens = token.split(WORD_PARTS_SPLITTER);

                result.push(token);

                if (subtokens.length > 1) {
                    result = result.concat(utils.compact(subtokens));
                }
            });

            return result;
        },

        /**
         * Возвращает массив с ключами переданного объекта
         * Используется нативный Object.keys если он есть
         * @param {Object} obj
         * @returns {Array}
         */
        objectKeys: function(obj) {
            if (Object.keys) {
                return Object.keys(obj);
            }
            var keys = [];
            $.each(obj, function(name) {
                keys.push(name);
            });
            return keys;
        },

        /**
         * Возвращает копию объекта без пустых элементов
         * @param obj
         */
        compactObject: function(obj) {
            var copy = $.extend(true, {}, obj);

            $.each(copy, function (key, val) {
                if (val === null || val === undefined || val === '') {
                    delete copy[key]
                }
            });

            return copy;
        }

    };
}());

export { utils };