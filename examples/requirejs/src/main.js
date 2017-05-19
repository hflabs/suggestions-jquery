require.config({
    shim: {
        'jquery.suggestions': {
            deps:["jquery"]
        }
    }
});

require(['jquery', 'jquery.suggestions', 'token'], function(jQuery, suggestions, Token) {

    $(function(){

        Token.init();

        var serviceUrl='https://suggestions.dadata.ru/suggestions/api/4_1/rs',
            token = Token.get(),
            type  = 'ADDRESS',
            $address = $('#address');

        // регион
        $address.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false
        });

    });

});