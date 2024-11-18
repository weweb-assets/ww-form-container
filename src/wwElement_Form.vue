<template>
    <form
        ref="formRef"
        :name="formName"
        :autocomplete="content.autocomplete"
        class="ww-form-container"
        :class="{
            editing: isEditing,
            selected: isSelected,
        }"
        :aria-busy="formState.isSubmitting"
        :aria-invalid="!formState.isValid"
        data-ww-flag="form-container"
        @submit.prevent="handleSubmit"
    >
        <wwLayout class="ww-form-container__content" path="formContent" ww-responsive="wwLayout" />
    </form>
</template>

<script>
import { ref, provide, computed, watch, onMounted } from 'vue';
import { useForm } from './shared/useForm';
/* wwEditor:start */
import { selectForm } from './shared/useForm';
/* wwEditor:end */
import { useFormState } from './composables/useFormState';
import { useFormSubmission } from './composables/useFormSubmission';
import { useFormInputs } from './composables/useFormInputs';
import { watchDebounced } from '@vueuse/core';

export default {
    props: {
        content: { type: Object, required: true },
        wwElementState: { type: Object, required: true },
        /* wwEditor:start */
        wwEditorState: { type: Object, required: true },
        /* wwEditor:end */
    },
    emits: ['trigger-event'],
    setup(props, { emit }) {
        const isEditing = computed(() => {
            /* wwEditor:start */
            return props.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION;
            /* wwEditor:end */
            // eslint-disable-next-line no-unreachable
            return false;
        });
        const isSelected = computed(() => {
            /* wwEditor:start */
            return props.wwEditorState.isSelected;
            /* wwEditor:end */
            // eslint-disable-next-line no-unreachable
            return false;
        });

        const formRef = ref(null);
        const componentId = ref(null);
        const formName = computed(() => props.wwElementState.name);
        const validationType = computed(() => props.content.validation);
        const debounceDelay = computed(() => wwLib.wwUtils.getLengthUnit(props.content.debounceDelay)[0] || 0);

        const { formState, setFormState, updateInputValidity, removeInputValidity } = useFormState();
        const { formInputs } = useFormInputs({
            updateInputValidity,
            removeInputValidity,
        });
        const { handleSubmit } = useFormSubmission({
            formState: { value: formState, setFormState },
            emit,
        });

        function _setFormState(isSubmitting, isSubmitted) {
            setFormState({ isSubmitting: !!isSubmitting, isSubmitted: !!isSubmitted });
        }

        const { setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.wwElementState.uid,
            name: 'form',
            type: 'object',
            defaultValue: {},
        });

        const data = computed(() => ({
            fields: formInputs.value,
            isSubmitting: formState.isSubmitting.value,
            isSubmitted: formState.isSubmitted.value,
            isValid: formState.isValid.value,
        }));

        const methods = {
            setFormState: {
                method: _setFormState,
                editor: {
                    label: 'Set form state',
                    elementName: 'Form',
                    description: 'Set isSubmitting and isSubmitted',
                    args: [
                        {
                            name: 'isSubmitting',
                            type: 'boolean',
                        },
                        {
                            name: 'isSubmitted',
                            type: 'boolean',
                        },
                    ],
                },
            },
        };

        watch(data, newData => setValue(newData), { deep: true, immediate: true });

        watchDebounced(
            () => data.value.fields,
            (v, ov) => {
                if (validationType.value === 'change' && !_.isEqual(v, ov)) {
                    handleSubmit({ target: formRef.value });
                }
            },
            {
                deep: true,
                debounce: () =>
                    validationType.value === 'change' && debounceDelay.value ? parseInt(debounceDelay.value) : 0,
            }
        );

        provide('_wwForm:info', { uid: props.wwElementState.uid, componentId: componentId.value, name: formName });
        provide('_wwForm:useForm', useForm);
        /* wwEditor:start */
        provide('_wwForm:selectForm', () => selectForm(props.wwElementState.uid, componentId.value));
        /* wwEditor:end */

        const markdown = `### Form local informations

#### inputs
Object containing all form inputs. Each input contains:
- \`value\`: Input's current value
- \`isValid\`: Boolean indicating if input passes validation (optional)`;

        wwLib.wwElement.useRegisterElementLocalContext('form', data, methods, markdown);

        /* Useful for the form to be identified by the childrens and make them have the right behaviors (tooltips, show/hide props, etc...) */
        onMounted(() => {
            componentId.value = formRef?.value?.getAttribute('data-ww-component-id');
        });

        return {
            formRef,
            isEditing,
            isSelected,
            formName,
            handleSubmit,
            formState,
            _setFormState,
        };
    },
};
</script>

<style lang="scss" scoped>
.ww-form-container {
    &__content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
