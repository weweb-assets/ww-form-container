export default {
    options: {
        displayAllowedValues: ['flex', 'block', 'inline-block', 'inline-flex'],
    },
    inherit: {
        type: 'ww-layout',
    },
    editor: {
        label: {
            fr: 'Conteneur de formulaire',
            en: 'Form Container',
        },
        icon: 'pencil',
        bubble: {
            icon: 'pencil',
        },
        customStylePropertiesOrder: ['validation', 'debounceDelay'],
        hint: () => {
            const currentEl = wwLib.wwUtils.getSelectedComponent();
            if (!currentEl) {
                return false;
            }
            const hasSubmitBtn = currentEl.querySelector('[data-ww-flag="btn-submit"]');
            if (hasSubmitBtn) {
                return false;
            }

            return {
                section: 'workflows',
                type: 'warning',
                header: {
                    en: 'Submit button missing!',
                    fr: 'Bouton de soumission manquant !',
                },
                text: {
                    en: 'A form container require a button with type submit to use the "on submit" trigger.',
                    fr: "Un conteneur de formulaire à besoin d'un bouton avec le type submit pour délencher l'évènement de soumission.",
                },
            };
        },
    },
    actions: [
        {
            label: 'Set form state',
            action: '_setFormState',
            args: [
                {
                    name: 'isSubmitting',
                    type: 'boolean',
                },
                {
                    name: 'isSubmitted',
                    type: 'boolean',
                },
            ],
        },
    ],
    triggerEvents: [{ name: 'submit', label: { en: 'On submit' }, default: true }],
    properties: {
        validation: {
            label: 'Validation',
            type: 'TextRadioGroup',
            options: {
                choices: [
                    { value: 'submit', label: 'Submit' },
                    { value: 'change', label: 'Change' },
                ],
            },
            defaultValue: 'submit',
        },
        debounceDelay: {
            type: 'Length',
            label: {
                en: 'Validation delay',
            },
            options: {
                unitChoices: [{ value: 'ms', label: 'ms', min: 1, max: 5000 }],
            },
            defaultValue: '500ms',
            hidden: content => content.validation !== 'change',
        },
        formContent: {
            hidden: true,
            defaultValue: [],
        },
        autocomplete: {
            section: 'settings',
            label: { en: 'Autocomplete', fr: 'Autocomplétion' },
            type: 'OnOff',
            defaultValue: true,
        },
    },
};
