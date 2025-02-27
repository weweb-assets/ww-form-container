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

    function resetInputs(initialValues = {}) {
        for (const [id, inputs] of Object.entries(inputsMap.value)) {
            for (const [name, input] of Object.entries(inputs)) {
                if (input && typeof input === 'object') {
                    updateFormInput(id, input => {
                        if (input[name]) {
                            // Priority order for values:
                            // 1. Value from passed initialValues object
                            // 2. Field's stored initialValue from useForm
                            // 3. Default empty value based on type
                            
                            if (initialValues[name] !== undefined) {
                                // Use value from initialValues parameter
                                input[name].value = initialValues[name];
                            } else if (input[name].initialValue !== undefined) {
                                // Use the field's own initialValue that was set during registration
                                input[name].value = input[name].initialValue;
                            } else {
                                // Reset to empty value based on the input type
                                if (Array.isArray(input[name].value)) {
                                    input[name].value = [];
                                } else if (typeof input[name].value === 'object' && input[name].value !== null) {
                                    input[name].value = {};
                                } else if (typeof input[name].value === 'boolean') {
                                    input[name].value = false;
                                } else if (typeof input[name].value === 'number') {
                                    input[name].value = 0;
                                } else {
                                    input[name].value = '';
                                }
                            }
                            
                            // Reset validation state
                            input[name].isValid = null;
                            input[name].pending = false;
                        }
                    });
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
