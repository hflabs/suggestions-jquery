describe('Select on Enter', function () {
    'use strict';

    var serviceUrl = '/some/url',
        fixtures = {
            'тверская оленинский упыри': [
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри', data: 0 },
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри, д 1', data: 1 },
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри, д 2', data: 2 }
            ],
            'г москва, зеленоград': [
                { value: 'г Москва, г Зеленоград', data: 0 },
                { value: 'г Москва, ул Зеленоградская', data: 1 },
                { value: 'г Москва, г Зеленоград, п Крюково', data: 2 },
                { value: 'г Москва, г Зеленоград, аллея Березовая', data: 3 }
            ],
            'новосибирская': [
                { value: 'Россия, обл Новосибирская', data: 0 },
                { value: 'Россия, обл Новосибирская, г Новосибирск', data: 1 },
                { value: 'Россия, г Москва, ул Новосибирская ', data: 2 }
            ],
            'москва мира': [
                { value: 'г Москва, ул Мира ', data: 0 },
                { value: 'г Москва, пр-кт Мира ', data: 1 },
                { value: 'г Москва, ул Мира, д 1', data: 2 },
            ],
            'Россия, обл Тверская, р-н Оленинский, д Упыри ул': [
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри', data: 0 },
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри, д 1', data: 1 },
                { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри, д 2', data: 2 }
            ],
            'ставропольский средний зеленая 36': [
                { value: 'Россия, край Ставропольский, р-н Александровский, х Средний, ул Зеленая, д 36', data: 0 }
            ],
            'зеленоград мкр': [
                { value: 'г Москва, г Зеленоград', data: 0 }
            ],
            'ленина 36': [
                { value: 'Россия, г Севастополь, ул Ленина, д 36', data: 0 },
                { value: 'Россия, респ Коми, г Ухта, пр-кт Ленина, д 36А', data: 1 },
                { value: 'Россия, респ Калмыкия, г Элиста, ул В.И.Ленина, влд 367', data: 2 }
            ],
            'средний зеленая 36' : [
                { value: 'Россия, край Ставропольский, р-н Александровский, х Средний, ул Зеленая, д 36', data: 0 },
                { value: 'Россия, респ Марий Эл, р-н Горномарийский, д Средний Околодок, ул Зеленая, д 36', data: 1 },
                { value: 'Россия, обл Воронежская, р-н Лискинский, с Средний Икорец, ул Зеленая, д 36', data: 2 }
            ]
        };

    beforeEach(function(){
        this.server = sinon.fakeServer.create();
        this.server.respondWith('POST', serviceUrl, function(xhr){
            var request = JSON.parse(xhr.requestBody),
                query = request && request.query;
            xhr.respond(
                200,
                {'Content-type':'application/json'},
                JSON.stringify(query ?
                    {
                        suggestions: fixtures[query]
                    } : {})
            );
        });

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            onSelect: $.noop
        }).suggestions();

        this.server.respond();
        this.server.requests.length = 0;
    });

    afterEach(function () {
        this.instance.dispose()
        this.$input.remove();
        this.server.restore();
    });

    it('Should trigger on full match', function () {
        var suggestions = [
                { value: 'Afghanistan', data: 'Af' },
                { value: 'Albania', data: 'Al' },
                { value: 'Andorra', data: 'An' }
            ],
            options = {
                lookup: suggestions,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Albania';
        this.instance.onValueChange();

        helpers.hitEnter(this.input);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(suggestions[1]);
    });

    it('Should trigger when suggestion is selected manually', function () {
        var suggestions = [
            { value: 'Afghanistan', data: 'Af' },
            { value: 'Albania', data: 'Al' },
            { value: 'Andorra', data: 'An' }
        ];
        var options = {
                lookup: suggestions,
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);

        this.input.value = 'A';
        this.instance.onValueChange();

        this.instance.selectedIndex = 2;
        helpers.hitEnter(this.input);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(suggestions[2]);
    });

    it('Should NOT trigger on partial match', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when nothing matched', function () {
        var suggestion = { value: 'Jamaica', data: 'J' },
            options = {
                lookup: [suggestion],
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Alg';
        this.instance.onValueChange();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should trigger when normalized query equals single suggestion from list (same parent)', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'тверская оленинский упыри';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).toHaveBeenCalledWith(
            { value: 'Россия, обл Тверская, р-н Оленинский, д Упыри', data: 0 }
        );
    });

    it('Should trigger when normalized query equals single suggestion from list (not same parent), part 1', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'г москва, зеленоград';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).toHaveBeenCalledWith(
            { value: 'г Москва, г Зеленоград', data: 0 }
        );
    });

    it('Should trigger when normalized query equals single suggestion from list (not same parent), part 2', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'новосибирская';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).toHaveBeenCalledWith(
            { value: 'Россия, обл Новосибирская', data: 0 }
        );
    });

    it('Should NOT trigger when normalized query encloses suggestion from list', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'Россия, обл Тверская, р-н Оленинский, д Упыри ул';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when normalized query equals multiple suggestions from list', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'москва мира';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should trigger when normalized query byword-matches single suggestion', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'ставропольский средний зеленая 36';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).toHaveBeenCalledWith(
            { value: 'Россия, край Ставропольский, р-н Александровский, х Средний, ул Зеленая, д 36', data: 0 }
        );
    });

    it('Should NOT trigger when the last word in query is a stop-word', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'зеленоград мкр';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when normalized query byword-matches single suggestion from list', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'ленина 36';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

    it('Should NOT trigger when normalized query byword-matches multiple suggestions from list', function () {
        var options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');

        this.instance.setOptions(options);
        this.instance.selectedIndex = -1;

        this.input.value = 'средний зеленая 36';
        this.instance.onValueChange();
        this.server.respond();
        helpers.hitEnter(this.input);

        expect(options.onSelect).not.toHaveBeenCalled();
    });

});