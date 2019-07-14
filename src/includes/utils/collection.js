import { lang_util } from "./lang";

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

export { collection_util };
