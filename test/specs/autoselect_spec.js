describe('Autoselect', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.instance = $(this.input).suggestions({
            serviceUrl: serviceUrl,
            type: 'ADDRESS',
            geoLocation: false
        }).suggestions();
        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.server.restore();
        this.instance.dispose();
    });

    it('Should not autoselect first item by default', function () {
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica', 'Jamaica', 'Jamaica']));

        expect(this.instance.selectedIndex).toBe(-1);
    });

    it('Should autoselect first item if autoSelectFirst set to true', function () {
        this.instance.setOptions({
            autoSelectFirst: true
        });
        this.instance.selectedIndex = -1;

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica', 'Jamaica', 'Jamaica']));

        expect(this.instance.selectedIndex).toBe(0);
    });
});