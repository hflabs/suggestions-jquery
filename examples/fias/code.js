(function($) {
    function log(suggestion) {
        console.log(suggestion);
    }

    $(function() {
        Token.init();

        var serviceUrl =
                "http://suggestions-1.office.dadata.ru:8080/suggestions/api/4_1/rs",
            token = Token.get(),
            type = "FIAS",
            $address = $("#address"),
            $region = $("#region"),
            $area = $("#area"),
            $city = $("#city"),
            $cityDistrict = $("#city_district"),
            $settlement = $("#settlement"),
            $planningStructure = $("#planning_structure"),
            $street = $("#street"),
            $house = $("#house");

        // одной строкой
        $address.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            onSelect: log
        });

        // регион
        $region.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "region",
            onSelect: log
        });

        // район
        $area.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "area",
            constraints: $region,
            onSelect: log
        });

        // город и населенный пункт
        $city.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "city",
            constraints: $area,
            onSelect: log
        });

        // район города
        $cityDistrict.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "city_district",
            constraints: $city,
            onSelect: log
        });

        // населенный пункт
        $settlement.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "settlement",
            constraints: $cityDistrict,
            onSelect: log
        });

        // план. структура
        $planningStructure.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "planning_structure",
            constraints: $settlement,
            onSelect: log
        });

        // улица
        $street.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "street",
            constraints: $planningStructure,
            onSelect: log
        });

        // дом
        $house.suggestions({
            serviceUrl: serviceUrl,
            token: token,
            type: type,
            hint: false,
            bounds: "house",
            constraints: $street,
            onSelect: log
        });
    });
})(jQuery);
