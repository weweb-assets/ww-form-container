export function useFormSubmission({ emit }) {
    const handleSubmit = async event => {
        // To handle isSubmitting/isSubmitted state, the form need to set it manually in a workflow

        try {
            emit('trigger-event', { name: 'submit', event });
        } catch (error) {
            // Set form state errors
        } finally {
        }
    };

    return { handleSubmit };
}
