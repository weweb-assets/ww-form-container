import { debounce, isEqual } from 'lodash-es';
import { inject, computed, watch, onBeforeUnmount, shallowRef, unref, isRef } from 'vue';

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
        return value === false;
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
    {
        fieldName,
        validation,
        customValidation = shallowRef(false),
        required = shallowRef(false),
        requiredValidation = null,
        initialValue = undefined,
    },
    { elementState, emit, sidepanelFormPath = 'form', setValue = null }
) {
    const form = inject('_wwForm:info', null);
    const registerFormInput = inject('_wwForm:registerInput', () => {});
    const unregisterFormInput = inject('_wwForm:unregisterInput', () => {});
    const updateFormInput = inject('_wwForm:updateInput', () => {});
    const submitForm = inject('_wwForm:submit', () => {});

    const id = wwLib.wwUtils.getUid();
    const _fieldName = computed(() => fieldName?.value || elementState.name);

    function updateValue(newValue) {
        if (setValue) {
            setValue(newValue);
        } else {
            value.value = newValue;
        }
    }

    registerFormInput(id, {
        [_fieldName.value]: {
            value: value.value,
            isValid: !required.value && !customValidation.value ? true : null,
            pending: false,
            forceValidateField,
            updateValue,
            setResettingFlag,
            resetValidationState,
            initialValue: unref(initialValue), // Store the initialValue so it can be used during form reset
        },
    });

    // Watch initialValue if it's a ref and update the form input
    if (isRef(initialValue)) {
        watch(initialValue, newInitialValue => {
            updateFormInput(id, input => {
                if (input[_fieldName.value]) {
                    input[_fieldName.value].initialValue = newInitialValue;
                }
            });
        });
    }
    const { resolveFormula } = wwLib.wwFormula.useFormula();

    const computeValidation = (value, required, customValidation, validation, requiredValidation) => {
        const validationResult = customValidation && validation ? resolveFormula(validation)?.value : true;

        // Use custom required validation if provided, otherwise use default isEmpty check
        const hasValue = requiredValidation ? requiredValidation(value) : !isValueEmpty(value);

        let finalResult;

        // If not required, field is valid unless there's custom validation
        if (!required) {
            finalResult = validationResult;
        }
        // If required and has custom validation, both must be true
        else if (customValidation && validation) {
            finalResult = hasValue && validationResult;
        }
        // If just required, check for value using custom or default validation
        else {
            finalResult = hasValue;
        }

        return finalResult;
    };

    function updateInputValidity(isValid) {
        updateFormInput(id, input => {
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

    let isFirst = true;
    let isResetting = false; // Flag to prevent validation during reset

    const computedValidation = computed(() => {
        // Skip validation during reset to prevent interference
        if (isResetting) {
            return null;
        }

        // We have to compute the validation here, otherwise the reactivity will not work
        const isValid = computeValidation(
            value.value,
            required.value,
            customValidation.value,
            validation.value,
            requiredValidation
        );

        if (isFirst) {
            isFirst = false;
            return null;
        }

        return isValid;
    });
    watch(computedValidation, (isValid, oldIsValid) => {
        if (form.validationType.value === 'change') {
            updateFormInput(id, input => {
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
        (validationType, oldValidationType) => {
            if (validationType === 'change') {
                const computedResult = computeValidation(
                    value.value,
                    required?.value,
                    customValidation?.value,
                    validation?.value,
                    requiredValidation
                );
                updateInputValidity(computedResult);
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
        const isValid = computeValidation(
            value.value,
            required?.value,
            customValidation?.value,
            validation?.value,
            requiredValidation
        );
        updateInputValidity(isValid);
        return isValid;
    }

    // Expose reset flag for external control
    function setResettingFlag(flag) {
        isResetting = flag;
    }

    // Reset the isFirst flag to allow proper validation after reset
    function resetValidationState() {
        isFirst = true;
        isResetting = false; // Also clear the resetting flag

        // Force a re-computation by triggering the computed validation
        const currentValidation = computedValidation.value;
    }

    watch(
        value,
        (nv, ov) => {
            if (!isEqual(nv, ov)) {
                updateFormInput(id, input => {
                    input[_fieldName.value].value = nv;
                });
            }
        },
        {
            deep: true,
        }
    );
    watch(_fieldName, (newName, oldName) => {
        updateFormInput(id, input => {
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
                forced: true,
            });
        },
        { immediate: true, deep: true }
    );
    /* wwEditor:end */

    onBeforeUnmount(() => {
        unregisterFormInput(id);
    });

    return {
        selectForm,
        submitForm,
        setResettingFlag,
        resetValidationState,
    };
}

export function selectForm(uid, componentId) {
    /* wwEditor:start */
    wwLib.editorSelectionStore.selectComponent({ type: 'element', uid, componentId });
    /* wwEditor:end */
}
