import express from 'express'
import { pool } from './config/db.js'

export const app = express()
app.use(express.json())

app.get('/', (_, res) => {
  return res.json({ message: 'Hello, World!' })
})

app.get('/usuarios', async (_, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `SELECT * FROM usuarios`
    )

    return res.status(200).json(result.rows)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Error occurred' })
  }
})

app.get('/posts', async (_, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const result = await pool.query(`
        SELECT 
          post.id,
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

app.post('/posts', async (req, res) => {
  try {
    const { titulo, conteudo, usuario_id } = req.body

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `INSERT INTO post (titulo, conteudo, usuario_id) VALUES ($1, $2, $3) RETURNING *`,
      [titulo, conteudo, usuario_id]
    )

    return res.status(201).json({
      mensagem: 'Post criado com sucesso.',
      post: result.rows[0],
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro ao criar post.' })
  }
})

app.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, conteudo } = req.body

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: This is SQL command
      `UPDATE post SET titulo=$1, conteudo=$2 WHERE id=$3  RETURNING *`,
      [titulo, conteudo, id]
    )

    return res.status(200).json({
      mensagem: 'Post atualizado com sucesso.',
      post: result.rows[0],
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro ao atualizar post.' })
  }
})

app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: This is SQL command
      `DELETE FROM post WHERE id=$1 RETURNING *`,
      [id]
    )

    return res.status(200).json({
      mensagem: 'Post excluído com sucesso.',
      post: result.rows[0],
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro ao excluir post.' })
  }
})
