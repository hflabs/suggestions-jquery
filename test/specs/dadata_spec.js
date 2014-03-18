
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
                name: 'Alexander',
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
            }
        };

    beforeEach(function(){
        this.server = sinon.fakeServer.create();
        this.server.respondWith('POST', serviceUrl, function(xhr){
            xhr.respond(
                200, 
                {'Content-type':'application/json'},
                JSON.stringify(xhr.requestBody ?
                    {
                        suggestions: [
                            'Adam', 'Alexander', 'Anny'
                        ]
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
            token: token,
            dadataType: 'NAME',
            onSelect: $.noop
        }).suggestions();

        this.input.value = 'A';
        this.instance.onValueChange();

        this.server.respond();
        this.server.respond();
        this.server.requests.length = 0;
    });
    
    afterEach(function () {
        this.instance.dispose()
        this.$input.remove();
        this.server.restore();
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
        
        expect(options.onSelect).toHaveBeenCalledWith({value: 'Adam', data: null});
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
            data: fixtures['Alexander']
        };
        expectation.data.gender = 'MALE';
        
        expect(options.onSelect).toHaveBeenCalledWith(expectation);
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
        
        expect(options.onSelect).toHaveBeenCalledWith({value: 'Anny', data: null});
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