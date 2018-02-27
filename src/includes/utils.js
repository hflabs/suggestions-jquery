import { collection_util } from './utils/collection';
import { func_util } from './utils/func';
import { lang_util } from './utils/lang';
import { object_util } from './utils/object';
import { text_util } from './utils/text';
import { jqapi } from './jqapi';
import { ajax } from './ajax';

/**
 * Возвращает автоинкрементный идентификатор.
 * @param {string} prefix - префикс для идентификатора
 */
var generateId = (function () {
    var counter = 0;
    return function (prefix) {
        return (prefix || '') + ++counter;
    }
}());

/**
 * Утилиты на все случаи жизни.
 */
var utils = {
    escapeRegExChars: text_util.escapeRegExChars,
    escapeHtml: text_util.escapeHtml,
    formatToken: text_util.formatToken,
    getTokens: text_util.tokenize,
    getWords: text_util.split,
    normalize: text_util.normalize,
    reWordExtractor: text_util.getWordExtractorRegExp,
    stringEncloses: text_util.stringEncloses,
    withSubTokens: text_util.withSubTokens,

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

    isArray: lang_util.isArray,
    isEmptyObject: lang_util.isEmptyObject,
    isFunction: lang_util.isFunction,
    isPlainObject: lang_util.isPlainObject,

    uniqueId: generateId,

    /**
     * Проверяет, что указанные поля в объекте заполнены.
     * @param {Object} obj - проверяемый объект
     * @param {Array} fields - список названий полей, которые надо проверить
     * @returns {boolean}
     */
    fieldsNotEmpty: function(obj, fields){
        if (!lang_util.isPlainObject(obj)) {
            return false;
        }
        var result = true;
        collection_util.each(fields, function (field, i) {
            result = !!(obj[field]);
            return result;
        });
        return result;
    },

    /**
     * Возвращает карту объектов по их идентификаторам.
     * Принимает на вход массив объектов и идентифицирующее поле.
     * Возвращает карты, ключом в которой является значение идентифицирующего поля,
     *   а значением — исходный объект.
     * Заодно добавляет объектам поле с порядковым номером.
     * @param {Array} arr - массив объектов
     * @param {string} idField - название идентифицирующего поля
     * @param {string} indexField - название поля с порядковым номером
     * @return {Object} карта объектов по их идентификаторам
     */
    indexBy: function (arr, idField, indexField) {
        var result = {};

        collection_util.each(arr, function (obj, idx) {
            var key = obj[idField],
                val = {};

            if (indexField) {
                val[indexField] = idx;
            }

            result[key] = jqapi.extend(true, val, obj);
        });

        return result;
    }
};

export { utils };