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
        console.log('🔍 [registerInput] Registering new input with id:', id);
        try {
            console.log('🔍 [registerInput] Input data:', JSON.parse(JSON.stringify(input)));
        } catch (e) {
            console.log('🔍 [registerInput] Input data (raw):', input);
        }

        inputsMap.value[id] = input;
        const [, value] = Object.entries(input)[0];

        try {
            console.log('🔍 [registerInput] Input value object:', JSON.parse(JSON.stringify(value)));
        } catch (e) {
            console.log('🔍 [registerInput] Input value object (raw):', value);
        }

        console.log('🔍 [registerInput] Initial isValid value:', value.isValid);
        console.log('🔍 [registerInput] Using validation state:', value.isValid ?? null);

        updateInputValidity(id, value.isValid ?? null);
        console.log('🔍 [registerInput] Input registration completed for id:', id);
    }

    function updateInput(id, updateFn) {
        console.log('🔍 [updateInput] Updating input with id:', id);
        const input = inputsMap.value[id];
        if (!input) {
            console.log('🔍 [updateInput] Input not found for id:', id);
            return;
        }

        try {
            console.log('🔍 [updateInput] Input before update:', JSON.parse(JSON.stringify(input)));
        } catch (e) {
            console.log('🔍 [updateInput] Input before update (raw):', input);
        }

        updateFn(input);

        try {
            console.log('🔍 [updateInput] Input after update:', JSON.parse(JSON.stringify(input)));
        } catch (e) {
            console.log('🔍 [updateInput] Input after update (raw):', input);
        }

        const newValidationState = Object.values(inputsMap.value[id])?.[0]?.isValid ?? null;
        console.log('🔍 [updateInput] New validation state for id', id, ':', newValidationState);

        updateInputValidity(id, newValidationState);
        console.log('🔍 [updateInput] Input update completed for id:', id);
    }

    function unregisterInput(id) {
        delete inputsMap.value[id];
        removeInputValidity(id);
    }

    watch(
        inputsMap,
        (newInputsMap, oldInputsMap) => {
            console.log('🔍 [inputsMap watcher] inputsMap changed');
            try {
                console.log('🔍 [inputsMap watcher] New inputsMap:', JSON.parse(JSON.stringify(newInputsMap)));
            } catch (e) {
                console.log('🔍 [inputsMap watcher] New inputsMap (raw):', newInputsMap);
            }
            try {
                console.log('🔍 [inputsMap watcher] Old inputsMap:', JSON.parse(JSON.stringify(oldInputsMap)));
            } catch (e) {
                console.log('🔍 [inputsMap watcher] Old inputsMap (raw):', oldInputsMap);
            }

            for (const [id, input] of Object.entries(inputsMap.value)) {
                const [, value] = Object.entries(input)[0];
                try {
                    console.log(
                        '🔍 [inputsMap watcher] Processing input id:',
                        id,
                        'value:',
                        JSON.parse(JSON.stringify(value))
                    );
                } catch (e) {
                    console.log('🔍 [inputsMap watcher] Processing input id:', id, 'value (raw):', value);
                }

                if ('isValid' in value) {
                    console.log('🔍 [inputsMap watcher] Updating validity for id:', id, 'to:', value.isValid);
                    updateInputValidity(id, value.isValid);
                } else {
                    console.log('🔍 [inputsMap watcher] No isValid property found for id:', id);
                }
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
        console.log('🔄 [resetInputs] Starting resetInputs with initialValues:', initialValues);
        try {
            console.log(
                '🔄 [resetInputs] Current inputsMap before reset:',
                JSON.parse(JSON.stringify(inputsMap.value))
            );
        } catch (e) {
            console.log('🔄 [resetInputs] Current inputsMap before reset (raw):', inputsMap.value);
        }

        initialValues ||= {};
        const resetDetails = [];

        // STEP 1: Set reset flag to prevent validation interference
        console.log('🔄 [resetInputs] STEP 1: Setting reset flag to prevent validation interference');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].setResettingFlag) {
                    console.log('🔄 [resetInputs] Setting reset flag for input:', id, 'field:', name);
                    input[name].setResettingFlag(true);
                }
            }
        }

        // STEP 2: Clear all input validity states
        console.log('🔄 [resetInputs] STEP 2: Clearing all input validity states');
        const inputIds = Object.keys(inputsMap.value);
        for (const id of inputIds) {
            console.log('🔄 [resetInputs] Clearing validity for input id:', id);
            removeInputValidity(id);
        }

        // STEP 3: Reset all input values and validation states
        console.log('🔄 [resetInputs] STEP 3: Resetting input values and validation states');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            console.log('🔄 [resetInputs] Processing input with id:', id);

            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object') {
                    console.log('🔄 [resetInputs] Processing field:', name, 'with current value:', input[name]?.value);

                    updateInput(id, input => {
                        if (input[name]) {
                            const oldValue = input[name].value;
                            const oldIsValid = input[name].isValid;
                            const oldPending = input[name].pending;

                            // Priority order for values:
                            // 1. Value from passed initialValues object
                            // 2. Field's stored initialValue from useForm
                            // 3. Default empty value based on type

                            let newValue;
                            let valueSource = '';

                            if (initialValues[name] !== undefined) {
                                // Use value from initialValues parameter
                                newValue = initialValues[name];
                                valueSource = 'initialValues parameter';
                            } else if (input[name].initialValue !== undefined) {
                                // Use the field's own initialValue that was set during registration
                                newValue = input[name].initialValue;
                                valueSource = 'field initialValue';
                            } else {
                                // Reset to empty value based on the input type
                                if (Array.isArray(input[name].value)) {
                                    newValue = [];
                                    valueSource = 'default empty array';
                                } else if (typeof input[name].value === 'object' && input[name].value !== null) {
                                    newValue = {};
                                    valueSource = 'default empty object';
                                } else if (typeof input[name].value === 'boolean') {
                                    newValue = false;
                                    valueSource = 'default false';
                                } else if (typeof input[name].value === 'number') {
                                    newValue = 0;
                                    valueSource = 'default 0';
                                } else {
                                    newValue = '';
                                    valueSource = 'default empty string';
                                }
                            }

                            console.log(
                                '🔄 [resetInputs] Field',
                                name,
                                'reset from',
                                oldValue,
                                'to',
                                newValue,
                                '(source:',
                                valueSource + ')'
                            );

                            // Update both the form input's value and the component's reactive value reference
                            input[name].value = newValue;
                            if (input[name].updateValue) {
                                console.log('🔄 [resetInputs] Calling updateValue for field:', name);
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
                                valueSource,
                                oldIsValid,
                                newIsValid: null,
                                oldPending: oldPending,
                                newPending: false,
                            });
                        }
                    });
                }
            }
        }

        // STEP 4: Ensure all inputs are registered with null validity (unvalidated state)
        console.log('🔄 [resetInputs] STEP 4: Ensuring all inputs have null validity state');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name]) {
                    console.log('🔄 [resetInputs] Setting null validity for input:', id, 'field:', name);
                    updateInputValidity(id, null);
                }
            }
        }

        // STEP 5: Clear reset flag to re-enable validation
        console.log('🔄 [resetInputs] STEP 5: Clearing reset flag to re-enable validation');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].setResettingFlag) {
                    console.log('🔄 [resetInputs] Clearing reset flag for input:', id, 'field:', name);
                    input[name].setResettingFlag(false);
                }
            }
        }

        // STEP 6: Reset validation state for all fields
        console.log('🔄 [resetInputs] STEP 6: Resetting validation state for all fields');
        try {
            console.log(
                '🔄 [resetInputs] Current inputsMap for validation reset:',
                JSON.parse(JSON.stringify(inputsMap.value))
            );
        } catch (e) {
            console.log('🔄 [resetInputs] Current inputsMap for validation reset (raw):', inputsMap.value);
        }

        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            console.log('🔄 [resetInputs] Processing input id for validation reset:', id);
            for (const [name, input] of Object.entries(inputs)) {
                console.log('🔄 [resetInputs] Processing field for validation reset:', name);
                try {
                    console.log('🔄 [resetInputs] Input object:', JSON.parse(JSON.stringify(input)));
                } catch (e) {
                    console.log('🔄 [resetInputs] Input object (raw):', input);
                }

                if (input && typeof input === 'object' && input[name]) {
                    try {
                        console.log('🔄 [resetInputs] Field object:', JSON.parse(JSON.stringify(input[name])));
                    } catch (e) {
                        console.log('🔄 [resetInputs] Field object (raw):', input[name]);
                    }
                    console.log(
                        '🔄 [resetInputs] Has resetValidationState function:',
                        !!input[name].resetValidationState
                    );

                    if (input[name].resetValidationState) {
                        console.log(
                            '🔄 [resetInputs] Resetting validation state for field:',
                            name,
                            'for input id:',
                            id
                        );
                        input[name].resetValidationState();
                        console.log('🔄 [resetInputs] Validation state reset completed for field:', name);
                    } else {
                        console.log('🔄 [resetInputs] No resetValidationState function found for field:', name);
                    }
                } else {
                    console.log('🔄 [resetInputs] Invalid input structure for field:', name);
                }
            }
        }

        // STEP 7: Force validation of all fields to compute proper validation state
        console.log('🔄 [resetInputs] STEP 7: Force validating all fields to compute proper validation state');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].forceValidateField) {
                    console.log('🔄 [resetInputs] Force validating field:', name, 'for input id:', id);
                    const validationResult = input[name].forceValidateField();
                    console.log('🔄 [resetInputs] Force validation result for field', name, ':', validationResult);
                }
            }
        }

        // STEP 8: Force trigger all validation watchers by updating input values slightly
        console.log('🔄 [resetInputs] STEP 8: Force triggering validation watchers...');
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object' && input[name] && input[name].updateValue) {
                    console.log('🔄 [resetInputs] Triggering validation watcher for field:', name);
                    // Force a small update to trigger validation watchers
                    const currentValue = input[name].value;
                    input[name].updateValue(currentValue);
                }
            }
        }

        console.log('🔄 [resetInputs] Reset details:', resetDetails);
        try {
            console.log('🔄 [resetInputs] Final inputsMap after reset:', JSON.parse(JSON.stringify(inputsMap.value)));
        } catch (e) {
            console.log('🔄 [resetInputs] Final inputsMap after reset (raw):', inputsMap.value);
        }
        console.log('🔄 [resetInputs] resetInputs completed successfully');
    }

    return {
        inputsMap,
        formInputs,
        updateInput,
        forceValidateAllFields,
        resetInputs,
    };
}
