import { inject, computed, watch, onBeforeUnmount, ref } from 'vue';

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
    { fieldName, validation, customValidation = ref(false) },
    { elementState, emit, sidepanelFormPath = 'form' }
) {
    const form = inject('_wwForm:info', null);
    const registerFormInput = inject('_wwForm:registerInput', () => {});
    const unregisterFormInput = inject('_wwForm:unregisterInput', () => {});

    const { uid, name } = elementState;
    const _fieldName = computed(() => fieldName?.value || name);

    const { resolveFormula } = wwLib.wwFormula.useFormula();

    watch(
        () => [value, _fieldName, customValidation, validation],
        () => {
            if (!registerFormInput) return;

            const item = { value: value.value };
            registerFormInput(uid, { [_fieldName.value]: item });
            if (customValidation.value) item.isValid = resolveFormula(validation.value)?.value;
            registerFormInput(uid, { [_fieldName.value]: item });
        },
        { immediate: true, deep: true }
    );

    /* wwEditor:start */
    watch(
        () => form,
        () => {
            emit('update:sidepanel-content', {
                path: sidepanelFormPath,
                value: { uid: form?.uid, name: form?.name?.value },
            });
        },
        { immediate: true, deep: true }
    );
    /* wwEditor:end */

    onBeforeUnmount(() => {
        unregisterFormInput(uid);
    });

    return {
        selectForm,
    };
}

/* wwEditor:start */
export function selectForm(uid, componentId) {
    wwLib.editorSelectionStore.selectComponent({ type: 'element', uid, componentId });
}
/* wwEditor:end */
