export function useFormSubmission({ emit, forceValidateAllFields, formInputs, formName }) {
    const handleSubmit = async event => {
        try {
            /* wwEditor:start */
            wwLib.logStore.verbose('🚀 Form submission started', {
                type: 'action',
                preview: { form: formName?.value || 'Unnamed form' }
            });
            /* wwEditor:end */

            const validationResult = forceValidateAllFields();
            
            if (!validationResult.isValid) {
                const invalidFields = validationResult.invalidFields;
                const fieldNames = invalidFields.map(f => f.name).join(', ');
                
                /* wwEditor:start */
                wwLib.logStore.warning('❌ Form submission blocked - Validation errors detected', {
                    type: 'action',
                    preview: {
                        form: formName?.value || 'Unnamed form',
                        invalidFieldsCount: invalidFields.length,
                        invalidFields: fieldNames,
                        details: invalidFields
                    }
                });
                /* wwEditor:end */

                /* wwEditor:start */
                wwLib.logStore.info('📋 Form validation details:', {
                    type: 'action',
                    preview: invalidFields.reduce((acc, field) => {
                        acc[field.name] = {
                            value: field.value,
                            isValid: field.isValid,
                            error: field.error || 'Validation failed'
                        };
                        return acc;
                    }, {})
                });
                /* wwEditor:end */

                emit('trigger-event', { name: 'submit-validation-error', event });
            } else {
                const formData = Object.fromEntries(
                    Object.entries(formInputs?.value || {}).map(([key, input]) => [key, input.value])
                );

                /* wwEditor:start */
                wwLib.logStore.info('✅ Form submission successful - All validations passed', {
                    type: 'action',
                    preview: {
                        form: formName?.value || 'Unnamed form',
                        fieldsCount: Object.keys(formData).length,
                        data: formData
                    }
                });
                /* wwEditor:end */

                emit('trigger-event', { name: 'submit', event });
            }
        } catch (error) {
            /* wwEditor:start */
            wwLib.logStore.error('💥 Form submission error', {
                type: 'action',
                error: error,
                preview: { form: formName?.value || 'Unnamed form', error: error.message }
            });
            /* wwEditor:end */
            console.error('Form submission error', error);
        }
    };

    return { handleSubmit };
}
