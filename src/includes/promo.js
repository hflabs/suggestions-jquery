import { CLASSES } from "./constants";
import { notificator } from "./notificator";
import { dom } from "./dom";

/**
 * Промо-ссылка в списке подсказок.
 */
var FREE_PLAN = "FREE";
var LINK =
    "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery";
var PREFIX = "";
var SUFFIX = "";
var IMAGE =
    '<svg version="1.1" viewBox="0 0 128 38" xmlns="http://www.w3.org/2000/svg"><path d="m128 19v16.077c0 1.614-1.302 2.923-2.909 2.923h-122.18c-1.607 0-2.909-1.309-2.909-2.923v-32.154c-0-1.614 1.302-2.923 2.909-2.923h122.18c1.607 0 2.909 1.309 2.909 2.923z" fill="#ef4741"/><path d="m59.52 7.912h-8.902v22.098h9.92c3.724 0 9.872-0.341 9.872-6.703v-8.682c-0.01-6.372-7.166-6.713-10.89-6.713zm5.595 14.81c0 3.186-2.308 3.508-4.936 3.508h-4.276v-14.538h3.287c2.628 0 5.954 0.322 5.954 3.508zm-46.545-14.81h-8.834v22.098h9.871c3.724 0 9.872-0.341 9.872-6.703v-8.682c0-6.372-7.137-6.713-10.88-6.713zm5.595 14.81c0 3.186-2.308 3.508-4.936 3.508h-4.247v-14.538h3.258c2.628 0 5.954 0.322 5.954 3.508zm71.757-13.953h-4.945v16.301c-0.018 0.785 0.113 1.565 0.388 2.3 0.203 0.569 0.535 1.082 0.97 1.5 0.446 0.385 0.962 0.677 1.522 0.858 0.58 0.205 1.182 0.343 1.794 0.409 0.575 0.052 1.248 0.081 2.017 0.088 0.917-1e-3 1.834-0.057 2.744-0.166v-2.796h-1.765c-0.393 0.055-0.795 0.032-1.18-0.071-0.385-0.102-0.745-0.28-1.06-0.524-0.413-0.691-0.59-1.498-0.504-2.299v-8.068h4.509v-3.06h-4.509zm20.364 5.535c-1.176-0.741-3.278-1.108-6.303-1.101h-5.741v0.243l0.708 2.826h5.033c0.837-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.458 0.553 0.579 0.891 0.121 0.339 0.162 0.701 0.119 1.058v1.12h-5.527c-1.939 0-3.271 0.38-3.995 1.14-0.725 0.76-1.099 2.127-1.125 4.102 0 2.154 0.359 3.06 1.086 3.742 0.728 0.682 2.134 1.188 4.344 1.188h6.847c1.706 0 3.345-0.808 3.345-2.747v-8.584c0-2.176-0.589-3.635-1.765-4.375zm-3.19 12.959h-3.249c-0.735 0.081-1.478-0.036-2.152-0.342-0.285-0.227-0.427-0.876-0.427-1.948s0.136-1.741 0.407-2.007c0.625-0.331 1.336-0.46 2.037-0.371h3.384zm-26.667-12.959c-1.176-0.741-3.277-1.108-6.303-1.101h-5.741v0.243l0.708 2.826h5.033c0.836-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.457 0.553 0.578 0.891 0.121 0.339 0.162 0.701 0.12 1.058v1.12h-5.556c-1.939 0-3.271 0.38-3.995 1.14s-1.086 2.127-1.086 4.102c0 2.154 0.359 3.06 1.086 3.742s2.133 1.188 4.344 1.188h6.846c1.717 0 3.346-0.808 3.346-2.747v-8.584c-7e-3 -2.176-0.595-3.635-1.765-4.375zm-3.181 12.959h-3.248c-0.735 0.081-1.478-0.037-2.153-0.342-0.284-0.227-0.426-0.876-0.426-1.948s0.135-1.741 0.407-2.007c0.624-0.331 1.336-0.46 2.036-0.371h3.384zm-37.74-12.959c-1.176-0.741-3.278-1.108-6.303-1.101h-5.712v0.243l0.708 2.826h5.033c0.837-0.051 1.672 0.117 2.424 0.487 0.259 0.248 0.457 0.553 0.578 0.891 0.121 0.339 0.162 0.701 0.12 1.058v1.12h-5.556c-1.939 0-3.271 0.38-3.995 1.14s-1.099 2.127-1.125 4.102c0 2.154 0.359 3.06 1.086 3.742s2.133 1.188 4.344 1.188h6.846c1.717 0 3.346-0.808 3.346-2.747v-8.584c0-2.176-0.589-3.635-1.765-4.375zm-3.181 12.959h-3.219c-0.735 0.081-1.478-0.037-2.153-0.342-0.284-0.227-0.427-0.876-0.427-1.948s0.136-1.741 0.408-2.007c0.624-0.331 1.336-0.46 2.036-0.371h3.384z" fill="#fff"/></svg>';

function Promo(plugin) {
    this.plan = plugin.status.plan;
    var container = plugin.getContainer();
    this.element = dom.selectByClass(CLASSES.promo, container);
}

Promo.prototype.show = function() {
    if (this.plan !== FREE_PLAN) {
        return;
    }
    if (!this.element) {
        return;
    }
    this.setStyles();
    this.setHtml();
};

Promo.prototype.setStyles = function() {
    this.element.style.display = "block";
};

Promo.prototype.setHtml = function() {
    this.element.innerHTML =
        '<a target="_blank" tabindex="-1" href="' +
        LINK +
        '">' +
        PREFIX +
        IMAGE +
        SUFFIX +
        "</a>";
};

function show() {
    new Promo(this).show();
}

notificator.on("assignSuggestions", show);
