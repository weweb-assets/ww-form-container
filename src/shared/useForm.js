import { debounce, isEqual } from 'lodash-es';
import { inject, computed, watch, onBeforeUnmount, shallowRef } from 'vue';

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

    const { uid } = elementState;
    const _fieldName = computed(() => fieldName?.value || elementState.name);

    registerFormInput(uid, {
        [_fieldName.value]: {
            value: value.value,
            isValid: !required.value && !customValidation.value ? true : null,
            pending: false,
            forceValidateField,
        },
    });
    const { resolveFormula } = wwLib.wwFormula.useFormula();

    const computeValidation = (value, required, customValidation, validation) => {
        const hasValue = !isValueEmpty(value);

        // If not required, field is valid unless there's custom validation
        if (!required) {
            return customValidation ? resolveFormula(validation)?.value : true;
        }

        // If required and has custom validation, both must be true
        if (customValidation && validation) {
            return hasValue && resolveFormula(validation)?.value;
        }

        // If just required, check for value
        return hasValue;
    };

    function updateInputValidity(isValid) {
        updateFormInput(uid, input => {
            if (!input[_fieldName.value]) {
                console.warn('Field name not available, is the AI generating ?');
                return;
            }
            input[_fieldName.value].isValid = isValid;
            input[_fieldName.value].pending = false;
        });
    }
    let debouncedUpdateInputValidity = debounce(updateInputValidity, form.debounceDelay.value);
    watch(
        () => form.debounceDelay.value,
        () => {
            debouncedUpdateInputValidity.flush();
            debouncedUpdateInputValidity = debounce(updateInputValidity, form.debounceDelay.value);
        }
    );

    const computedValidation = computed(() => {
        console.log('computedValidation');
        return computeValidation(value.value, required.value, customValidation.value, validation.value);
    });
    watch(computedValidation, isValid => {
        if (form.validationType.value === 'change') {
            updateFormInput(uid, input => {
                if (!input[_fieldName.value]) {
                    console.warn('Field name not available, is the AI generating ?');
                    return;
                }
                input[_fieldName.value].pending = true;
            });
            debouncedUpdateInputValidity(isValid);
        }
    });
    watch(
        () => form.validationType.value,
        validationType => {
            if (validationType === 'change') {
                updateInputValidity(
                    computeValidation(value.value, required?.value, customValidation?.value, validation?.value)
                );
            } else if (validationType === 'submit') {
                updateInputValidity(true);
            }
        }
    );
    onBeforeUnmount(() => {
        debouncedUpdateInputValidity.cancel();
    });
    function forceValidateField() {
        debouncedUpdateInputValidity.cancel();
        const isValid = computeValidation(value.value, required?.value, customValidation?.value, validation?.value);
        updateInputValidity(isValid);
        return isValid;
    }

    watch(
        value,
        (nv, ov) => {
            if (!isEqual(nv, ov)) {
                updateFormInput(uid, input => {
                    input[_fieldName.value].value = nv;
                });
            }
        },
        {
            deep: true,
        }
    );
    watch(_fieldName, (newName, oldName) => {
        updateFormInput(uid, input => {
            const oldValue = input[oldName];
            delete input[oldName];
            input[newName] = oldValue;
        });
    });

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
