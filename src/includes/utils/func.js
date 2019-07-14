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

export { func_util };
