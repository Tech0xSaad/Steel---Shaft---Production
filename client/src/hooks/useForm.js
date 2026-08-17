import { useState, useCallback } from 'react'

/**
 * Minimal form state hook.
 *
 * @param {object}   initialValues
 * @param {Function} validatorFn   - (values) => errorObject
 */
export function useForm(initialValues, validatorFn) {
  const [values, setValuesState] = useState(initialValues)
  const [errors, setErrors]      = useState({})

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValuesState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }, [])

  /**
   * Replace all form values at once (clears errors too).
   * Pass a plain object — do NOT pass a function here.
   */
  const setValues = useCallback((v) => {
    setValuesState(v)
    setErrors({})
  }, [])

  /**
   * Merge a partial object into the current values without touching
   * the other fields or clearing errors.
   * Safe to call from effects where you only want to update one field.
   *
   * @param {object} partial  — e.g. { bom_id: 'abc-123' }
   */
  const mergeValues = useCallback((partial) => {
    setValuesState(prev => ({ ...prev, ...partial }))
  }, [])

  const validate = useCallback(() => {
    if (!validatorFn) return true
    const errs = validatorFn(values)
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [values, validatorFn])

  const resetForm = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
  }, [initialValues])

  return { values, errors, handleChange, setValues, mergeValues, validate, resetForm, setErrors }
}
