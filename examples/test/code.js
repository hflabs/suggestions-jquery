(function () {

    $(function() {
        Token.init();

        var token = Token.get(),
            type = 'ADDRESS',
            $suggestions = $('#suggestions'),
            $region = $('#region'),
            $city = $('#city'),
            $street = $('#street');

        // просто подсказки
        $suggestions.suggestions({
            token: token,
            type: type,
            hint: false,
            addon: 'clear',
            onInvalidateSelection: function () {
                console.log('ON INVALIDATE SELECTION');
            }
        });

        // регион
        $region.suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: 'region-area'
        });

        // город и населенный пункт
        $city.suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: 'city-settlement',
            constraints: $region,
            formatSelected: function(suggestion) {
                var address = suggestion.data;
                if (address.city_with_type === address.region_with_type) {
                    return address.settlement_with_type || '';
                } else {
                    return join([ address.city_with_type, address.settlement_with_type ]);
                }
            }
        });

        // улица
        $street.suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: 'street',
            constraints: $city
        });

        $('#url').suggestions({
            token: token,
            url: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address1',
            type: type,
            hint: false,
            bounds: 'city'
        });

        $('#city-729').suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: 'city'
        });

    });

})();