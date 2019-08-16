(function($) {
    function geolocateCity($city) {
        var citySgt = $city.suggestions();
        citySgt.getGeoLocation().done(function(locationData) {
            if (locationData.city) {
                var suggestionVal =
                        locationData.city_type + " " + locationData.city,
                    suggestion = { value: suggestionVal, data: locationData };
                citySgt.setSuggestion(suggestion);
            } else if (locationData.region) {
                var suggestionVal =
                        locationData.region_type + " " + locationData.region,
                    suggestion = { value: suggestionVal, data: locationData };
                citySgt.setSuggestion(suggestion);
            }
        });
    }

    $(function() {
        Token.init();

        var serviceUrl = "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
            token = Token.get(),
            type = "ADDRESS",
            $country = $("#country"),
            $region = $("#region"),
            $area = $("#area"),
            $city = $("#city"),
            $cityDistrict = $("#city_district"),
            $settlement = $("#settlement"),
            $street = $("#street"),
            $house = $("#house");

        // страна
        $country.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "country",
            constraints: {
                locations: { country_iso_code: "*" }
            }
        });

        // регион
        $region.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "region",
            constraints: $country
        });

        // район
        $area.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "area",
            constraints: $region
        });

        // город и населенный пункт
        $city.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "city",
            constraints: $area
        });

        // район города
        $cityDistrict.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "city_district",
            constraints: $city
        });

        // geolocateCity($city);

        // город и населенный пункт
        $settlement.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "settlement",
            constraints: $cityDistrict
        });

        // улица
        $street.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "street",
            constraints: $settlement
        });

        // дом
        $house.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "house",
            constraints: $street
        });
    });
})(jQuery);
