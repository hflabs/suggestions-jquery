import { collection_util } from './collection';
import { lang_util } from './lang';

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

        if (typeof a == 'object' && a != null && b != null) {
            collection_util.each(a, function (value, i) {
                return same = self(value, b[i]);
            });
            return same;
        }

        return a === b;
    },

    /**
     * Копирует свойства и их значения из исходных объектов в целевой
     */
    assign: function(target, varArgs) {
        if (typeof Object.assign === 'function') {
            return Object.assign.apply(null, arguments);
        }
        if (target == null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
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

        collection_util.each(copy, function (val, key) {
            if (val === null || val === undefined || val === '') {
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
    fieldsAreNotEmpty: function(obj, fields){
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
     * Возвращает вложенное значение по указанному пути
     * например, 'data.address.value'
     */
    getDeepValue: function self(obj, name) {
        var path = name.split('.'),
            step = path.shift();

        return obj && (path.length ? self(obj[step], path.join('.')) : obj[step]);
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
    indexObjectsById: function (objectsArray, idField, indexField) {
        var result = {};

        collection_util.each(objectsArray, function (obj, idx) {
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

export { object_util };