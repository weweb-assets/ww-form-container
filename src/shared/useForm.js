import { inject, computed, watch, onBeforeUnmount, ref, shallowRef } from 'vue';

function isValueEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'number') {
        return Number.isNaN(value);
    }

    if (typeof value === 'string') {
        return value.length === 0;
    }

    if (typeof value === 'boolean') {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (value instanceof Set) {
        return value.size === 0;
    }

    if (value instanceof Map) {
        return value.size === 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
}

/**
 * This composable is defined here to be provided once to all form children inputs.
 * It allows child components to interact with the parent form by:
 * - Registering themselves as form inputs
 * - Providing their values and validation state
 * - Receiving form context like the form name and uid
 * - Unregistering when unmounted
 */
export function useForm(
    value,
    { fieldName, validation, customValidation = shallowRef(false), required = shallowRef(false) },
    { elementState, emit, sidepanelFormPath = 'form' }
) {
    const form = inject('_wwForm:info', null);
    const registerFormInput = inject('_wwForm:registerInput', () => {});
    const unregisterFormInput = inject('_wwForm:unregisterInput', () => {});
    const updateFormInput = inject('_wwForm:updateInput', () => {});

    const { uid, name } = elementState;
    const _fieldName = computed(() => fieldName?.value || name);

    registerFormInput(uid, { [_fieldName.value]: { value: value.value } });

    const { resolveFormula } = wwLib.wwFormula.useFormula();

    const computeValidation = (value, required, customValidation, validation) => {
        const hasValue = !isValueEmpty(value);

        // If not required, field is valid unless there's custom validation
        if (!required) {
            return customValidation && validation ? resolveFormula(validation)?.value : true;
        }

        // If required and has custom validation, both must be true
        if (customValidation && validation) {
            return hasValue && resolveFormula(validation)?.value;
        }

        // If just required, check for value
        return hasValue;
    };

    const isValid = computed(() => {
        const isValid = computeValidation(value.value, required?.value, customValidation?.value, validation?.value);
        return isValid;
    });
    watch(
        isValid,
        isValid => {
            updateFormInput(uid, input => {
                input[_fieldName.value].isValid = isValid;
            });
        },
        {
            immediate: true,
        }
    );
    watch(
        value,
        (nv, ov) => {
            if (!_.isEqual(nv, ov)) {
                updateFormInput(uid, input => {
                    input[_fieldName.value].value = nv;
                });
            }
        },
        {
            immediate: true,
            deep: true,
        }
    );

    /* wwEditor:start */
    watch(
        () => form,
        () => {
            emit('update:sidepanel-content', {
                path: sidepanelFormPath,
                value: { uid: form?.uid, name: form?.name?.value },
            });
        },
        { immediate: true, deep: true }
    );
    /* wwEditor:end */

    onBeforeUnmount(() => {
        unregisterFormInput(uid);
    });

    return {
        selectForm,
    };
}

export function selectForm(uid, componentId) {
    /* wwEditor:start */
    wwLib.editorSelectionStore.selectComponent({ type: 'element', uid, componentId });
    /* wwEditor:end */
}
