
describe('DaData API', function () {
    'use strict';
    
    var serviceUrl = '/some/url',
        token = '1234',
        fixtures = {
            'Adam': {
                source: 'Adam',
                surname: null,
                name: 'Adam',
                patronymic: null,
                gender: 'М',
                qc: 1
            },
            'Alexander': {
                source: 'Alexander',
                surname: null,
                name: 'Aleksander',
                patronymic: null,
                gender: 'М',
                qc: 0
            },
            'Anny': {
                source: 'Anny',
                surname: null,
                name: 'Anny',
                patronymic: null,
                gender: 'Ж',
                qc: 0
            },
            'Bad': {
                source: 'Bad',
                surname: 'Bad',
                name: null,
                patronymic: null,
                gender: 'НД',
                qc: 1
            },
            'Very bad': {
                source: 'Very bad',
                surname: null,
                name: null,
                patronymic: null,
                gender: 'НД',
                qc: 1
            }
        };

    beforeEach(function(){
        this.server = sinon.fakeServer.create();
        this.server.respondWith('POST', /some\/url\/suggest/, function(xhr){
            var request = JSON.parse(xhr.requestBody),
                query = request && request.query,
                filter = query && new RegExp('^' + query + '|\\s+' + query, 'i');
            xhr.respond(
                200, 
                {'Content-type':'application/json'},
                JSON.stringify(query ?
                    {
                        suggestions: $.grep([
                                {value: 'Adam', data: {name: 'Adam'}},
                                {value: 'Alexander', data: {name: 'Alexander'}},
                                {value: 'Anny', data: {}}
                            ], function(a){
                                return filter.test(a.value);
                            }
                        )
                    } : {})
            );
        });
        this.server.respondWith('POST', $.Suggestions.dadataConfig.url, function(xhr){
            var request = JSON.parse(xhr.requestBody),
                src = request.data[0][0];
            if (src == 'Anny') {
                xhr.respond(500, {}, '');
            } else {
                xhr.respond(
                    200, 
                    {'Content-type':'application/json'},
                    JSON.stringify({
                        structure: request.structure,
                        data: [[ fixtures[src] ]]
                    })
                );
            }
        });

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            token: token,
            onSelect: $.noop,
            constraints: false
        }).suggestions();

        this.server.respond();
        this.server.requests.length = 0;
    });
    
    afterEach(function () {
        this.instance.dispose()
        this.$input.remove();
        this.server.restore();
        $.Suggestions.resetTokens();
    });

    describe('For individual suggestion', function(){

        beforeEach(function(){

            // shows three suggestions
            this.input.value = 'A';
            this.instance.onValueChange();
            this.server.respond();
            this.server.requests.length = 0;

        });

        it('Should send request on suggestion click', function () {
            this.instance.$container.children('.suggestions-suggestion').first().click();

            expect(this.server.requests.length).toEqual(1);
            expect(this.server.requests[0].url).toEqual($.Suggestions.dadataConfig.url);
        });

        it('Should send request on SPACE click', function () {
            this.instance.selectedIndex = 0;
            helpers.keydown(this.input, 32);

            expect(this.server.requests.length).toEqual(1);
            expect(this.server.requests[0].url).toEqual($.Suggestions.dadataConfig.url);
        });

        it('Should pass original suggestion for not guaranteed response', function () {
            var options = {
                onSelect: $.noop
            };
            spyOn(options, 'onSelect');
            this.instance.setOptions(options);

            // click on Adam
            this.instance.$container.children('.suggestions-suggestion').eq(0).click();
            this.server.respond();

            expect(options.onSelect.calls.count()).toEqual(1);
            expect(options.onSelect).toHaveBeenCalledWith(
                helpers.appendUnrestrictedValue({value: 'Adam', data: {name: 'Adam', qc: 1}})
            );
        });

        it('Should pass enriched suggestion for guaranteed response', function () {
            var options = {
                onSelect: $.noop
            };
            spyOn(options, 'onSelect');
            this.instance.setOptions(options);

            // click on Alexander
            this.instance.$container.children('.suggestions-suggestion').eq(1).click();
            this.server.respond();

            var expectation = {
                value: 'Alexander',
                data: $.extend({}, fixtures['Alexander'], {
                    // field reformatted
                    gender: 'MALE',
                    // fields from original suggestion are not overridden
                    name: 'Alexander'
                })
            };
            delete expectation.data.source;

            expect(options.onSelect.calls.count()).toEqual(1);
            expect(options.onSelect).toHaveBeenCalledWith(
                helpers.appendUnrestrictedValue(expectation)
            );
        });

        it('Should pass original suggestion if ajax request failed', function () {
            var options = {
                onSelect: $.noop
            };
            spyOn(options, 'onSelect');
            this.instance.setOptions(options);

            // click on Anny
            this.instance.$container.children('.suggestions-suggestion').eq(2).click();
            this.server.respond();

            expect(options.onSelect.calls.count()).toEqual(1);
            expect(options.onSelect).toHaveBeenCalledWith(
                helpers.appendUnrestrictedValue({value: 'Anny', data: {}})
            );
        });

        it('Should lock dropdown list while request is pending', function () {
            this.instance.selectedIndex = 0;

            // click on Adam
            this.instance.$container.children('.suggestions-suggestion').eq(0).click();

            expect(this.server.requests.length).toEqual(1);

            // be sure container is disabled
            expect(this.instance.$container.attr('disabled')).toBeTruthy();

            // be sure keyboard navigation does nothing
            helpers.keydown(this.input, 40);
            expect(this.instance.selectedIndex).toEqual(0);

            // be sure mouseover on other suggesion does nothing
            this.instance.$container.children('.suggestions-suggestion').eq(1).mouseover();
            expect(this.instance.selectedIndex).toEqual(0);

            // be sure click on other suggesion does nothing
            this.instance.$container.children('.suggestions-suggestion').eq(1).click();
            expect(this.instance.selectedIndex).toEqual(0);
        });

    });

    describe('For empty response', function(){

        beforeEach(function(){

            // shows empty suggestions list
            this.input.value = 'Bad';
            this.instance.onValueChange();
            this.server.respond();

        });

        it('Should send request when no suggestions received', function () {
            expect(this.server.requests.length).toEqual(2);
            expect(this.server.requests[1].url).toEqual($.Suggestions.dadataConfig.url);
        });

        it('Should display even not guaranteed suggestion', function(){
            this.server.respond();
            var $items = this.instance.$container.children('.suggestions-suggestion');
            expect($items.length).toEqual(1);
            expect($items.text()).toEqual('Bad');
        });

        it('Should not display a suggestion, with all displayable fields are NULL', function(){

            this.input.value = 'Very';
            this.instance.onValueChange();
            this.server.respond();
            this.server.respond();
            var $items = this.instance.$container.children('.suggestions-suggestion');
            expect($items.length).toEqual(0);
        });

    });

});