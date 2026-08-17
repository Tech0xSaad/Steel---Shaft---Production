import Joi from 'joi'

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Enter a valid email address.',
      'any.required': 'Email is required.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min':   'Password must be at least 6 characters.',
      'any.required': 'Password is required.',
    }),
})

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required.',
  }),
})
