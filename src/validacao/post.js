import Joi from 'joi'

const postSchema = Joi.object({
  titulo: Joi.string().min(3).required().messages({
    'string.empty': 'O título é obrigatório.',
    'string.min': 'O título deve ter pelo menos 3 caracteres.',
    'any.required': 'O título é obrigatório.',
  }),
  conteudo: Joi.string().min(5).max(500).required().messages({
    'string.empty': 'O conteúdo é obrigatório.',
    'string.min': 'O conteúdo deve ter pelo menos 5 caracteres.',
    'string.max': 'O conteúdo não pode ter mais de 500 caracteres.',
    'any.required': 'O conteúdo é obrigatório.',
  }),
})

export function validatePost(req, res, next) {
  const { error } = postSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    return res.status(400).json({ error: error.details.map((e) => e.message) })
  }

  next()
}
