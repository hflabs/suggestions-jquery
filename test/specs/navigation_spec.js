describe('Keyboard navigation', function () {
    'use strict';

    var serviceUrl = '/some/url';
    var suggestions = [
        { value: 'Afghanistan', data: 'Af' },
        { value: 'Albania', data: 'Al' },
        { value: 'Andorra', data: 'An' }
    ];

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();
        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.server.restore();
        this.instance.dispose()
    });

    it('Should select first suggestion on DOWN key in textbox', function () {
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        helpers.keydown(this.input, 40);

        expect(this.instance.selectedIndex).toBe(0);
        expect(this.input.value).toEqual(suggestions[0].value);
    });

    it('Should select last suggestion on UP key in textbox', function () {
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        helpers.keydown(this.input, 38);

        expect(this.instance.selectedIndex).toBe(2);
        expect(this.input.value).toEqual(suggestions[2].value);
    });

    it('Should select textbox on DOWN key in last suggestion', function () {
        this.instance.selectedIndex = -1;

        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        this.instance.selectedIndex = 2;
        helpers.keydown(this.input, 40);

        expect(this.instance.selectedIndex).toBe(-1);
        expect(this.input.value).toEqual('A');
    });

});