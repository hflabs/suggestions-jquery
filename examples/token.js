(function(window) {

    window.Token = {

        init: function () {
            var $token = $('#token');

            $token.val(this.get());

            $token.on('input', function () {
                var token = $token.val();
                location.hash = token;
                localStorage.setItem('dadata_token', token);
                location.reload();
            });
        },

        get: function () {
            var token = location.hash.replace(/^#(.*)$/, '$1');

            if (!token && this.localStorageAvailable()) {
                token = localStorage.getItem('dadata_token') || '';
            }

            return token;
        },

        localStorageAvailable: function () {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch(e) {
                return false;
            }
        }

    }

})(window);