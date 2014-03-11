describe('Autoselect', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        $('.suggestions-suggestions').remove();
        this.server.restore();
    });

    it('Should not autoselect first item by default', function () {
        this.instance.setOptions({
            lookup: ['Jamaica', 'Jamaica', 'Jamaica']
        });
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.instance.selectedIndex).toBe(-1);
    });

    it('Should autoselect first item if autoSelectFirst set to true', function () {
        this.instance.setOptions({
            lookup: ['Jamaica', 'Jamaica', 'Jamaica'],
            autoSelectFirst: true
        });
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.instance.selectedIndex).toBe(0);
    });
});