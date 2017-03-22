(function () {

    $(function() {
        Token.init();

        var token = Token.get(),
            type  = "ADDRESS",
            $city   = $("#city"),
            $street = $("#street");

        // город и населенный пункт
        $city.suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: "city-settlement"
        });

        // улица
        $street.suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: "street",
            constraints: $city
        });

        $('#city-729').suggestions({
            token: token,
            type: type,
            hint: false,
            bounds: "city"
        });

    });

})();