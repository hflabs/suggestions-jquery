(function(window) {

    window.Token = {

        init: function () {
            var $token = $('#token');

            $token.val(this.get());

            $token.on('input', function () {
                var token = $token.val();
                location.hash = token;
                location.reload();
            });
        },

        get: function () {
            var token = location.hash.replace(/^#(.*)$/, '$1');

            return token;
        }

    }

})(window);