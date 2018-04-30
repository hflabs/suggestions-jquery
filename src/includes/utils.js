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

export { generateId, utils };