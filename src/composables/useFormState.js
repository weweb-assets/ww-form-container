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

            // If no inputs, return null
            if (inputsValidity.length === 0) {
                return null;
            }

            // Check if any input has null validity (unvalidated)
            const hasNullValidity = inputsValidity.some(v => v === null);

            // SPECIAL FIX: If all inputs are null but we have inputs, assume they are valid
            // This prevents the stuck null issue after reset
            if (hasNullValidity && inputsValidity.every(v => v === null)) {
                return true; // Assume valid to prevent stuck null
            }

            if (hasNullValidity) {
                return null;
            }

            // Check if any input is invalid
            const hasInvalidInputs = inputsValidity.some(isValid => !isValid);
            return !hasInvalidInputs;
        }),
    });

    const setFormState = newState => {
        if ('isSubmitting' in newState) {
            isSubmitting.value = newState.isSubmitting;
        }
        if ('isSubmitted' in newState) {
            isSubmitted.value = newState.isSubmitted;
        }
    };

    const updateInputValidity = (inputId, isValid) => {
        if (typeof isValid === 'boolean' || isValid === null) {
            inputValidityMap.value[inputId] = isValid;
        }
    };

    const removeInputValidity = inputId => {
        delete inputValidityMap.value[inputId];
    };

    return {
        formState,
        setFormState,
        updateInputValidity,
        removeInputValidity,
    };
}
