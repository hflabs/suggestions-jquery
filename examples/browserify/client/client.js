var $ = require('jquery');
var Token = require('../../token');
require('../../../dist/js/jquery.suggestions');

$(function () {
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