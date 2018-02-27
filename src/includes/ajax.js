import { object_util } from './utils/object';
import { jqapi } from './jqapi';

/**
 * Утилиты для работы через AJAX
 */
var ajax = {
    /**
     * HTTP-метод, который поддерживает браузер
     */
    getDefaultType: function () {
        return (jqapi.supportsCors() ? 'POST' : 'GET');
    },

    /**
     * Content-type, который поддерживает браузер
     */
    getDefaultContentType: function () {
        return (jqapi.supportsCors() ? 'application/json' : 'application/x-www-form-urlencoded');
    },

    /**
     * Меняет HTTPS на протокол страницы, если браузер не поддерживает CORS
     */
    fixURLProtocol: function(url){
        return jqapi.supportsCors() ? url : url.replace(/^https?:/, location.protocol);
    },

    /**
     * Записывает параметры в GET-строку
     */
    addUrlParams: function (url, params) {
        return url + (/\?/.test(url) ? '&' : '?') + jqapi.param(params);
    },

    /**
     * Сериализует объект для передачи по сети.
     * Либо в JSON-строку (если браузер поддерживает CORS),
     *   либо в GET-строку.
     */
    serialize: function (data) {
        if (jqapi.supportsCors()) {
            return JSON.stringify(data, function (key, value) {
                return value === null ? undefined : value;
            });
        } else {
            data = object_util.compact(data);
            return jqapi.param(data, true);
        }
    }
};

export { ajax };