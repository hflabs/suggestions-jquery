import { collection_util } from './collection';

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
     * Возвращает вложенное значение по указанному пути
     * например, 'data.address.value'
     */
    getDeepValue: function self(obj, name) {
        var path = name.split('.'),
            step = path.shift();

        return obj && (path.length ? self(obj[step], path.join('.')) : obj[step]);
    }
};

export { object_util };