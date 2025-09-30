import { omit } from 'lodash-es';
import { computed, watch, provide, ref } from 'vue';

export function useFormInputs({ updateInputValidity, removeInputValidity }) {
    const inputsMap = ref({});

    const formInputs = computed(() => {
        return Object.fromEntries(
            Array.from(Object.values(inputsMap.value))
                .filter(input => input && typeof input === 'object')
                .map(input => Object.entries(input)[0])
                .filter(([key, value]) => key !== 'null' && value !== null)
                .map(([key, value]) => [
                    key,
                    omit(value, ['forceValidateField', 'updateValue', 'pending', 'initialValue']),
                ])
        );
    });

    function registerInput(id, input) {
        inputsMap.value[id] = input;
        const [, value] = Object.entries(input)[0];
        updateInputValidity(id, value.isValid ?? null);
    }

    function updateInput(id, updateFn) {
        const input = inputsMap.value[id];
        if (!input) return;
        updateFn(input);
        updateInputValidity(id, Object.values(inputsMap.value[id])?.[0]?.isValid ?? null);
    }

    function unregisterInput(id) {
        delete inputsMap.value[id];
        removeInputValidity(id);
    }

    watch(
        inputsMap,
        () => {
            for (const [id, input] of Object.entries(inputsMap.value)) {
                const [, value] = Object.entries(input)[0];
                if ('isValid' in value) updateInputValidity(id, value.isValid);
            }
        },
        { deep: true, immediate: true }
    );

    provide('_wwForm:registerInput', registerInput);
    provide('_wwForm:unregisterInput', unregisterInput);
    provide('_wwForm:updateInput', updateInput);

    function forceValidateAllFields() {
        const validityMap = {};
        const invalidFields = [];

        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if ('forceValidateField' in input) {
                    const isValid = input.forceValidateField();
                    validityMap[id + name] = isValid;

                    if (!isValid) {
                        invalidFields.push({
                            id: id,
                            name: name,
                            value: input.value,
                            isValid: isValid,
                            error: input.error || input.validationMessage || 'Validation failed',
                        });
                    }
                }
            }
        }

        const isValid = Object.values(validityMap).every(Boolean);

        return {
            isValid,
            invalidFields,
            validityMap,
        };
    }

    function resetInputs(initialValues = {}) {
        initialValues ||= {};
        const resetDetails = [];

        // STEP 1: Set reset flag to prevent validation interference
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].setResettingFlag) {
                    input[name].setResettingFlag(true);
                }
            }
        }

        // STEP 2: Clear all input validity states
        const inputIds = Object.keys(inputsMap.value);
        for (const id of inputIds) {
            removeInputValidity(id);
        }

        // STEP 3: Reset all input values and validation states
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object') {
                    updateInput(id, input => {
                        if (input[name]) {
                            const oldValue = input[name].value;

                            // Priority order for values:
                            // 1. Value from passed initialValues object
                            // 2. Field's stored initialValue from useForm
                            // 3. Default empty value based on type

                            let newValue;
                            if (initialValues[name] !== undefined) {
                                newValue = initialValues[name];
                            } else if (input[name].initialValue !== undefined) {
                                newValue = input[name].initialValue;
                            } else {
                                if (Array.isArray(input[name].value)) {
                                    newValue = [];
                                } else if (typeof input[name].value === 'object' && input[name].value !== null) {
                                    newValue = {};
                                } else if (typeof input[name].value === 'boolean') {
                                    newValue = false;
                                } else if (typeof input[name].value === 'number') {
                                    newValue = 0;
                                } else {
                                    newValue = '';
                                }
                            }

                            // Update both the form input's value and the component's reactive value reference
                            input[name].value = newValue;
                            if (input[name].updateValue) {
                                input[name].updateValue(newValue);
                            }

                            // Reset validation state to null (unvalidated)
                            input[name].isValid = null;
                            input[name].pending = false;

                            resetDetails.push({
                                id,
                                name,
                                oldValue,
                                newValue,
                            });
                        }
                    });
                }
            }
        }

        // STEP 4: Ensure all inputs are registered with null validity (unvalidated state)
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name]) {
                    updateInputValidity(id, null);
                }
            }
        }

        // STEP 5: Clear reset flag to re-enable validation
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].setResettingFlag) {
                    input[name].setResettingFlag(false);
                }
            }
        }

        // STEP 6: Reset validation state for all fields
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].resetValidationState) {
                    input[name].resetValidationState();
                }
            }
        }

        // STEP 7: Force validation of all fields to compute proper validation state
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].forceValidateField) {
                    input[name].forceValidateField();
                }
            }
        }

        // STEP 8: Force trigger all validation watchers by updating input values slightly
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].updateValue) {
                    // Force a small update to trigger validation watchers
                    const currentValue = input[name].value;
                    input[name].updateValue(currentValue);
                }
            }
        }
    }

    return {
        inputsMap,
        formInputs,
        updateInput,
        forceValidateAllFields,
        resetInputs,
    };
}
