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
                .map(([key, value]) => [key, omit(value, ['forceValidateField', 'pending'])])
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
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if ('forceValidateField' in input) {
                    validityMap[id + name] = input.forceValidateField();
                }
            }
        }
        return Object.values(validityMap).every(Boolean);
    }

    return {
        inputsMap,
        formInputs,
        updateInput,
        forceValidateAllFields,
    };
}
