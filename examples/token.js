/**
 * Класс для работы с токеном (ключ API для dadata.ru)
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'jquery'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('jquery'));
    } else {
        // Browser globals
        factory((root.Token = {}), root.$);
    }
}(this, function (exports, $) {

    exports.init = function () {
        var that = this,
            $token = $('#token');

        $token.val(this.get());

        $token.on('input', function () {
            var token = $token.val();
            location.hash = token;
            if (that.localStorageAvailable()) {
                localStorage.setItem('dadata_token', token);
            }
            if (token) {
                location.reload();
            }
        });
    };

    exports.get = function () {
        var token = location.hash.replace(/^#(.*)$/, '$1');

        if (!token && this.localStorageAvailable()) {
            token = localStorage.getItem('dadata_token') || '';
        }

        return token;
    };

    exports.localStorageAvailable = function () {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch(e) {
            return false;
        }
    };

}));
