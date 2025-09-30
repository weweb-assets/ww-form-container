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
            if (inputsValidity.some(v => v === null)) {
                return null;
            }

            return !inputsValidity.some(isValid => !isValid);
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
        console.log(
            '🔄 [updateInputValidity] Current inputValidityMap before update:',
            JSON.parse(JSON.stringify(inputValidityMap.value))
        );

        if (typeof isValid === 'boolean' || isValid === null) {
            inputValidityMap.value[inputId] = isValid;
            console.log(
                '🔄 [updateInputValidity] Updated inputValidityMap after update:',
                JSON.parse(JSON.stringify(inputValidityMap.value))
            );
            console.log('🔄 [updateInputValidity] New form isValid value:', formState.isValid.value);
        } else {
            console.log('🔄 [updateInputValidity] Invalid isValid value type:', typeof isValid, 'value:', isValid);
        }
    };

    const removeInputValidity = inputId => {
        console.log('🔄 [removeInputValidity] Removing input validity for id:', inputId);
        console.log(
            '🔄 [removeInputValidity] Current inputValidityMap before removal:',
            JSON.parse(JSON.stringify(inputValidityMap.value))
        );
        delete inputValidityMap.value[inputId];
        console.log(
            '🔄 [removeInputValidity] inputValidityMap after removal:',
            JSON.parse(JSON.stringify(inputValidityMap.value))
        );
        console.log('🔄 [removeInputValidity] New form isValid value:', formState.isValid.value);
    };

    return {
        formState,
        setFormState,
        updateInputValidity,
        removeInputValidity,
    };
}
