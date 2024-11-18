import { computed, watch, provide, ref } from 'vue';

export function useFormInputs({ updateInputValidity, removeInputValidity }) {
    const inputsMap = ref({});

    const formInputs = computed(() => {
        return Object.fromEntries(
            Array.from(Object.values(inputsMap.value))
                .filter(input => input && typeof input === 'object')
                .map(input => Object.entries(input)[0])
                .filter(([key, value]) => key !== 'null' && value !== null)
        );
    });

    function registerInput(id, input) {
        inputsMap.value[id] = input;
        const [, value] = Object.entries(input)[0];
        if ('isValid' in value) {
            updateInputValidity(id, value.isValid);
        }
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

    return {
        inputsMap,
        formInputs,
    };
}
