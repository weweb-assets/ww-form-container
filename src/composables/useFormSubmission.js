export function useFormSubmission({ emit, forceValidateAllFields }) {
    const handleSubmit = async event => {
        console.log('[Form Container] handleSubmit called', {
            event,
            eventType: event?.type,
            eventTarget: event?.target,
        });
        
        try {
            console.log('[Form Container] Validating all fields...');
            const isValid = forceValidateAllFields();
            console.log('[Form Container] Validation result:', isValid);
            
            if (!isValid) {
                console.log('[Form Container] Validation failed, emitting submit-validation-error');
                emit('trigger-event', { name: 'submit-validation-error', event });
            } else {
                console.log('[Form Container] Validation passed, emitting submit event');
                emit('trigger-event', { name: 'submit', event });
            }
        } catch (error) {
            console.error('[Form Container] Form submission error', error);
        } finally {
            console.log('[Form Container] handleSubmit completed');
        }
    };

    return { handleSubmit };
}
