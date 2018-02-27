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
        return Object.prototype.toString.call(it) === '[object Function]';
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
      if (obj === undefined
          || typeof (obj) !== 'object' 
          || obj === null
          || obj.nodeType 
          || obj === obj.window) {
        return false;
      }
      if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
        return false;
      }
      return true;
    }
};

export { lang_util };