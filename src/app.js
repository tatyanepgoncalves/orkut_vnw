import express from 'express'
import { pool } from './config/db.js'

export const app = express()
app.use(express.json())

app.get('/', (_, res) => {
  return res.json({ message: 'Hello, World!' })
})

app.get('/post', async (_, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const result = await pool.query(`
        SELECT 
          usuarios.nome,
          post.conteudo,
          post.criado_em
        FROM post
        JOIN usuarios
        ON post.usuario_id = usuarios.id
        ORDER BY post.criado_em DESC
      `)

    return res.status(200).json(result.rows)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Error occurred' })
  }
})
