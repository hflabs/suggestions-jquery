import { DEFAULT_OPTIONS } from "./default-options";
import { jqapi } from "./jqapi";
import { ADDRESS_TYPE } from "./types/address";
import { FIAS_TYPE } from "./types/fias";
import { NAME_TYPE } from "./types/name";
import { PARTY_TYPE } from "./types/party";
import { EMAIL_TYPE } from "./types/email";
import { BANK_TYPE } from "./types/bank";
import { Outward } from "./types/outward";

/**
 * Type is a bundle of properties:
 * - urlSuffix Mandatory. String
 * - matchers Mandatory. Array of functions (with optional data bound as a context) that find appropriate suggestion to select
 * - `fieldNames` Map fields of suggestion.data to their displayable names
 * - `unformattableTokens` Array of strings which should not be highlighted
 * - `dataComponents` Array of 'bound's can be set as `bounds` option. Order is important.
 *
 * flags:
 * - `alwaysContinueSelecting` Forbids to hide dropdown after selecting
 * - `geoEnabled` Makes to detect client's location for passing it to all requests
 * - `enrichmentEnabled` Makes to send additional request when a suggestion is selected
 *
 * and methods:
 * - `isDataComplete` Checks if suggestion.data can be operated as full data of it's type
 * - `composeValue` returns string value based on suggestion.data
 * - `formatResult` returns html of a suggestion. Overrides default method
 * - `formatResultInn` returns html of suggestion.data.inn
 * - `isQueryRequestable` checks if query is appropriated for requesting server
 * - `formatSelected` returns string to be inserted in textbox
 */

var types = {
    NAME: NAME_TYPE,
    ADDRESS: ADDRESS_TYPE,
    FIAS: FIAS_TYPE,
    PARTY: PARTY_TYPE,
    EMAIL: EMAIL_TYPE,
    BANK: BANK_TYPE
};

types.get = function(type) {
    if (types.hasOwnProperty(type)) {
        return types[type];
    } else {
        return new Outward(type);
    }
};

jqapi.extend(DEFAULT_OPTIONS, {
    suggest_local: true
});

export { types };
