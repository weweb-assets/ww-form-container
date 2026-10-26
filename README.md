# WW-FORM-CONTAINER

This is an element for Weweb, to display a form container.

## Installation

To run locally, first install all dependencies with `npm install`.

## Start

To serve locally, run `npm run serve --port=[PORT]`, and then go to Weweb editor, open developper popup and add localhost:[PORT] as custom element.

## Build

Before release, you can check build error by running `npm run build --name="ww-form-container" --type="element"`

## Update form data

Use the **Update form data** component action with an object of field values, for example
`{ bookingDate: "2026-11-10", guests: 0, newsletter: false }`.
The action merges these values with the form's existing fields. It updates registered native inputs
through their value setter and preserves their validation. Values from custom inputs remain in the
exposed `formData` when another input changes and are included when the form is submitted.

Custom fields use the normal reset defaults (empty string, zero, false, empty array or object), or
values supplied to **Reset form**. A custom input still owns its UI and validation; this action does
not add a validator or a value setter to that component. The action requires a plain object and
rejects the reserved property names `__proto__`, `constructor` and `prototype`.

Run the regression tests with `npm test`.
