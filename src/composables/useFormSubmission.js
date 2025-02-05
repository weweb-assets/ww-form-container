import { unref } from 'vue';

export function useFormSubmission({ emit, isValid, updateFormData, validationType }) {
    const handleSubmit = async event => {
        try {
            if (!unref(isValid)) return;
            if (validationType.value === 'submit') {
                updateFormData();
            }
            emit('trigger-event', { name: 'submit', event });
        } catch (error) {
            // Set form state errors
        } finally {
        }
    };

    return { handleSubmit };
}
