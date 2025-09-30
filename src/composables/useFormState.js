import { ref, shallowReactive, computed, shallowRef } from 'vue';

export function useFormState() {
    const isSubmitting = shallowRef(false);
    const isSubmitted = shallowRef(false);
    const inputValidityMap = ref({});

    const formState = shallowReactive({
        isSubmitting: computed(() => isSubmitting.value),
        isSubmitted: computed(() => isSubmitted.value),
        isValid: computed(() => {
            const inputsValidity = Object.values(inputValidityMap.value);
            console.log('🔍 [isValid] Computing form validity...');
            try {
                console.log('🔍 [isValid] inputValidityMap:', JSON.parse(JSON.stringify(inputValidityMap.value)));
            } catch (e) {
                console.log('🔍 [isValid] inputValidityMap (raw):', inputValidityMap.value);
            }
            console.log('🔍 [isValid] inputsValidity array:', inputsValidity);

            // If no inputs, return null
            if (inputsValidity.length === 0) {
                console.log('🔍 [isValid] No inputs found, returning null');
                return null;
            }

            // Check if any input has null validity (unvalidated)
            const hasNullValidity = inputsValidity.some(v => v === null);
            console.log('🔍 [isValid] Has null validity inputs:', hasNullValidity);

            if (hasNullValidity) {
                console.log('🔍 [isValid] Returning null (some inputs unvalidated)');
                return null;
            }

            // Check if any input is invalid
            const hasInvalidInputs = inputsValidity.some(isValid => !isValid);
            const finalResult = !hasInvalidInputs;

            console.log('🔍 [isValid] Has invalid inputs:', hasInvalidInputs);
            console.log('🔍 [isValid] Final result:', finalResult);
            console.log(
                '🔍 [isValid] Validation breakdown:',
                inputsValidity.map((valid, index) => ({
                    inputIndex: index,
                    isValid: valid,
                    status: valid === null ? 'unvalidated' : valid ? 'valid' : 'invalid',
                }))
            );

            return finalResult;
        }),
    });

    const setFormState = newState => {
        console.log('🔄 [setFormState] Setting form state with:', newState);
        console.log('🔄 [setFormState] Current state before update:', {
            isSubmitting: isSubmitting.value,
            isSubmitted: isSubmitted.value,
            isValid: formState.isValid.value,
        });

        if ('isSubmitting' in newState) {
            console.log(
                '🔄 [setFormState] Updating isSubmitting from',
                isSubmitting.value,
                'to',
                newState.isSubmitting
            );
            isSubmitting.value = newState.isSubmitting;
        }
        if ('isSubmitted' in newState) {
            console.log('🔄 [setFormState] Updating isSubmitted from', isSubmitted.value, 'to', newState.isSubmitted);
            isSubmitted.value = newState.isSubmitted;
        }

        console.log('🔄 [setFormState] Final state after update:', {
            isSubmitting: isSubmitting.value,
            isSubmitted: isSubmitted.value,
            isValid: formState.isValid.value,
        });
    };

    const updateInputValidity = (inputId, isValid) => {
        console.log('🔄 [updateInputValidity] Updating input validity for id:', inputId, 'to:', isValid);
        try {
            console.log(
                '🔄 [updateInputValidity] Current inputValidityMap before update:',
                JSON.parse(JSON.stringify(inputValidityMap.value))
            );
        } catch (e) {
            console.log(
                '🔄 [updateInputValidity] Current inputValidityMap before update (raw):',
                inputValidityMap.value
            );
        }

        if (typeof isValid === 'boolean' || isValid === null) {
            inputValidityMap.value[inputId] = isValid;
            try {
                console.log(
                    '🔄 [updateInputValidity] Updated inputValidityMap after update:',
                    JSON.parse(JSON.stringify(inputValidityMap.value))
                );
            } catch (e) {
                console.log(
                    '🔄 [updateInputValidity] Updated inputValidityMap after update (raw):',
                    inputValidityMap.value
                );
            }
            console.log('🔄 [updateInputValidity] New form isValid value:', formState.isValid.value);
        } else {
            console.log('🔄 [updateInputValidity] Invalid isValid value type:', typeof isValid, 'value:', isValid);
        }
    };

    const removeInputValidity = inputId => {
        console.log('🔄 [removeInputValidity] Removing input validity for id:', inputId);
        try {
            console.log(
                '🔄 [removeInputValidity] Current inputValidityMap before removal:',
                JSON.parse(JSON.stringify(inputValidityMap.value))
            );
        } catch (e) {
            console.log(
                '🔄 [removeInputValidity] Current inputValidityMap before removal (raw):',
                inputValidityMap.value
            );
        }
        delete inputValidityMap.value[inputId];
        try {
            console.log(
                '🔄 [removeInputValidity] inputValidityMap after removal:',
                JSON.parse(JSON.stringify(inputValidityMap.value))
            );
        } catch (e) {
            console.log('🔄 [removeInputValidity] inputValidityMap after removal (raw):', inputValidityMap.value);
        }
        console.log('🔄 [removeInputValidity] New form isValid value:', formState.isValid.value);
    };

    // Force trigger validation computation
    const triggerValidationComputation = () => {
        console.log('🔄 [triggerValidationComputation] Forcing validation computation...');
        try {
            console.log(
                '🔄 [triggerValidationComputation] Current inputValidityMap:',
                JSON.parse(JSON.stringify(inputValidityMap.value))
            );
        } catch (e) {
            console.log('🔄 [triggerValidationComputation] Current inputValidityMap (raw):', inputValidityMap.value);
        }
        console.log('🔄 [triggerValidationComputation] Current isValid value:', formState.isValid.value);

        // Force the computed to re-evaluate by accessing it
        const currentIsValid = formState.isValid.value;
        console.log('🔄 [triggerValidationComputation] Re-computed isValid value:', currentIsValid);

        return currentIsValid;
    };

    return {
        formState,
        setFormState,
        updateInputValidity,
        removeInputValidity,
        triggerValidationComputation,
    };
}
