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
        console.log('🔍 [computeValidation] Computing validation for field:', _fieldName.value);
        console.log('🔍 [computeValidation] Input parameters:', {
            value,
            required,
            customValidation,
            validation: validation?.value,
            requiredValidation: !!requiredValidation,
        });

        const validationResult = customValidation && validation ? resolveFormula(validation)?.value : true;
        console.log('🔍 [computeValidation] Custom validation result:', validationResult);

        // Use custom required validation if provided, otherwise use default isEmpty check
        const hasValue = requiredValidation ? requiredValidation(value) : !isValueEmpty(value);
        console.log('🔍 [computeValidation] Has value check:', hasValue);

        let finalResult;

        // If not required, field is valid unless there's custom validation
        if (!required) {
            finalResult = validationResult;
            console.log('🔍 [computeValidation] Field not required, using validation result:', finalResult);
        }
        // If required and has custom validation, both must be true
        else if (customValidation && validation) {
            finalResult = hasValue && validationResult;
            console.log(
                '🔍 [computeValidation] Required with custom validation:',
                finalResult,
                '(hasValue:',
                hasValue,
                '&& validationResult:',
                validationResult,
                ')'
            );
        }
        // If just required, check for value using custom or default validation
        else {
            finalResult = hasValue;
            console.log('🔍 [computeValidation] Required field, using hasValue:', finalResult);
        }

        console.log('🔍 [computeValidation] Final validation result for field', _fieldName.value, ':', finalResult);
        return finalResult;
    };

    function updateInputValidity(isValid) {
        console.log('🔍 [updateInputValidity] Updating input validity for field:', _fieldName.value, 'to:', isValid);
        updateFormInput(id, input => {
            if (!input[_fieldName.value]) {
                console.warn('Field name not available, is the AI generating ?');
                return;
            }
            console.log(
                '🔍 [updateInputValidity] Setting isValid to:',
                isValid,
                'and pending to false for field:',
                _fieldName.value
            );
            input[_fieldName.value].isValid = isValid;
            input[_fieldName.value].pending = false;
        });
        console.log('🔍 [updateInputValidity] Input validity update completed for field:', _fieldName.value);
    }
    let debouncedUpdateInputValidity = debounce(isValid => {
        console.log(
            '🔍 [debouncedUpdateInputValidity] Debounced function called for field:',
            _fieldName.value,
            'with value:',
            isValid
        );
        updateInputValidity(isValid);
    }, form.debounceDelay.value);
    watch(
        () => form.debounceDelay.value,
        () => {
            debouncedUpdateInputValidity.flush();
            debouncedUpdateInputValidity = debounce(isValid => {
                console.log(
                    '🔍 [debouncedUpdateInputValidity] Debounced function called for field:',
                    _fieldName.value,
                    'with value:',
                    isValid
                );
                updateInputValidity(isValid);
            }, form.debounceDelay.value);
        }
    );

    let isFirst = true;
    let isResetting = false; // Flag to prevent validation during reset

    const computedValidation = computed(() => {
        console.log('🔍 [computedValidation] Computing validation for field:', _fieldName.value);
        console.log('🔍 [computedValidation] isResetting:', isResetting, 'isFirst:', isFirst);

        // Skip validation during reset to prevent interference
        if (isResetting) {
            console.log('🔄 [useForm] Skipping validation during reset for field:', _fieldName.value);
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

        console.log('🔍 [computedValidation] Computed validation result:', isValid);

        if (isFirst) {
            console.log('🔍 [computedValidation] First validation, setting isFirst to false and returning null');
            isFirst = false;
            return null;
        }

        console.log('🔍 [computedValidation] Returning validation result:', isValid);
        return isValid;
    });
    watch(computedValidation, (isValid, oldIsValid) => {
        console.log('🔍 [computedValidation watcher] Validation changed for field:', _fieldName.value);
        console.log('🔍 [computedValidation watcher] Old validation:', oldIsValid, 'New validation:', isValid);
        console.log('🔍 [computedValidation watcher] Form validation type:', form.validationType.value);
        console.log('🔍 [computedValidation watcher] Is resetting flag:', isResetting);

        if (form.validationType.value === 'change') {
            console.log('🔍 [computedValidation watcher] Validation type is "change", updating input');
            updateFormInput(id, input => {
                if (!input[_fieldName.value]) {
                    console.warn('Field name not available, is the AI generating ?');
                    return;
                }
                console.log('🔍 [computedValidation watcher] Setting pending to true for field:', _fieldName.value);
                input[_fieldName.value].pending = true;
            });
            console.log('🔍 [computedValidation watcher] Calling debouncedUpdateInputValidity with:', isValid);
            debouncedUpdateInputValidity(isValid);
        } else {
            console.log('🔍 [computedValidation watcher] Validation type is not "change", skipping update');
        }
    });
    watch(
        () => form.validationType.value,
        (validationType, oldValidationType) => {
            console.log('🔍 [validationType watcher] Validation type changed for field:', _fieldName.value);
            console.log('🔍 [validationType watcher] Old type:', oldValidationType, 'New type:', validationType);

            if (validationType === 'change') {
                console.log('🔍 [validationType watcher] Validation type is "change", computing validation');
                const computedResult = computeValidation(
                    value.value,
                    required?.value,
                    customValidation?.value,
                    validation?.value,
                    requiredValidation
                );
                console.log('🔍 [validationType watcher] Computed validation result:', computedResult);
                updateInputValidity(computedResult);
            } else if (validationType === 'submit') {
                console.log('🔍 [validationType watcher] Validation type is "submit", setting to true');
                updateInputValidity(true);
            } else {
                console.log('🔍 [validationType watcher] Unknown validation type:', validationType);
            }
        }
    );
    onBeforeUnmount(() => {
        debouncedUpdateInputValidity.cancel();
    });
    function forceValidateField() {
        console.log('🔄 [forceValidateField] Force validating field:', _fieldName.value);
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
        console.log('🔄 [useForm] Reset flag set to:', flag, 'for field:', _fieldName.value);
    }

    // Reset the isFirst flag to allow proper validation after reset
    function resetValidationState() {
        console.log('🔄 [useForm] Resetting validation state for field:', _fieldName.value);
        console.log('🔄 [useForm] Before reset - isFirst:', isFirst, 'isResetting:', isResetting);
        isFirst = true;
        isResetting = false; // Also clear the resetting flag
        console.log('🔄 [useForm] After reset - isFirst:', isFirst, 'isResetting:', isResetting);

        // Force a re-computation by triggering the computed validation
        console.log('🔄 [useForm] Triggering validation re-computation for field:', _fieldName.value);
        const currentValidation = computedValidation.value;
        console.log('🔄 [useForm] Current validation result after reset:', currentValidation);

        console.log('🔄 [useForm] Validation state reset completed for field:', _fieldName.value);
    }

    watch(
        value,
        (nv, ov) => {
            console.log('🔍 [value watcher] Value changed for field:', _fieldName.value);
            console.log('🔍 [value watcher] Old value:', ov, 'New value:', nv);
            console.log('🔍 [value watcher] Values are equal:', isEqual(nv, ov));

            if (!isEqual(nv, ov)) {
                console.log('🔍 [value watcher] Values are different, updating form input');
                updateFormInput(id, input => {
                    console.log('🔍 [value watcher] Updating value from', input[_fieldName.value].value, 'to', nv);
                    input[_fieldName.value].value = nv;
                });
            } else {
                console.log('🔍 [value watcher] Values are equal, skipping update');
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
