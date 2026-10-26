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

Custom fields are stored on the form independently of the custom input's visibility or lifetime.
Hiding or removing an unregistered custom input does not remove its field from submission.
Update that field to an empty value or `null` when your workflow needs to clear it; this merge
action does not remove keys. The custom input should read its displayed value from `formData`,
or reset its own displayed value in the same workflow as **Reset form**.

If a native input mounts after a value was added under the same field name, it receives that
prefill through its value setter and takes ownership of the field. The temporary custom entry
is removed, so unmounting that native input cannot restore an obsolete value. Its normal initial
value and validation still control reset and submission.

Run the regression tests with `npm test`.
