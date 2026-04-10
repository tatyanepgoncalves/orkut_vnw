import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { auth } from './auth/authLogin.js'
import { pool } from './config/db.js'
import { validatePost } from './validacao/post.js'
import { validarUsuarios } from './validacao/usuario.js'

export const app = express()
app.use(express.json())
app.use(cors())

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })
}

app.get('/', (_, res) => {
  return res.json({ message: 'Hello, World!' })
})

// Cadastro
app.post('/usuarios', validarUsuarios, async (req, resp) => {
  try {
    const { nome, email, senha } = req.body

    const senhaHash = await bcrypt.hash(senha, 10)

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *`,
      [nome, email, senhaHash]
    )

    return resp.status(201).json({
      mensagem: 'Usuário criado com sucesso.',
      usuario: result.rows[0],
    })
  } catch (error) {
    const message = error.message || 'Erro ao criar usuário.'

    return resp.status(500).json({ error: message })
  }
})

// Login
app.post('/login', async (req, resp) => {
  try {
    const { email, senha } = req.body

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `SELECT * FROM usuarios WHERE email=$1`,
      [email]
    )

    if (result.rows.length === 0) {
      return resp.status(404).json({ error: 'Usuário não encontrado.' })
    }

    const usuario = result.rows[0]
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      return resp.status(401).json({ error: 'Senha incorreta.' })
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })

    return resp.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        usuarioToken: token,
      },
    })
  } catch (error) {
    const message = error.message || 'Erro ao realizar login.'
    return resp.status(500).json({ error: message })
  }
})

app.get('/usuarios', async (_, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `SELECT * FROM usuarios`
    )

    const data = result.rows.map((usuario) => ({
      ...usuario,
      criadoem: formatarData(usuario.criadoem),
    }))

    return res.status(200).json(data)
  } catch (error) {
    const message = error.message || 'Error occurred'
    return res.status(500).json({ error: message })
  }
})

app.put('/usuarios/:id', auth, async (req, resp) => {
  try {
    const { id } = req.params
    const { nome, email, senha } = req.body

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `UPDATE usuarios SET nome=$1, email=$2, senha=$3 WHERE id=$4 RETURNING *`,
      [nome, email, senha, id]
    )

    return resp.status(200).json({
      mensagem: 'Usuário atualizado com sucesso.',
      usuario: result.rows[0],
    })
  } catch (error) {
    const message = error.message || 'Erro ao atualizar usuário.'
    return resp.status(500).json({ error: message })
  }
})

app.delete('/usuarios/:id', auth, async (req, resp) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      // biome-ignore lint/style/noUnusedTemplateLiteral: this code is SQL command
      `DELETE FROM usuarios WHERE id=$1`,
      [id]
    )

    return resp.status(200).json({
      mensagem: 'Usuário excluído com sucesso.',
      usuario: result.rows[0],
    })
  } catch (error) {
    const message = error.message || 'Erro ao excluir usuário'
    return resp.status(500).json({ error: message })
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

    const data = result.rows.map((post) => ({
      ...post,
      criado_em: formatarData(post.criado_em),
    }))

    return res.status(200).json(data)
  } catch (error) {
    const message = error.message || 'Erro ao buscar posts.'
    return res.status(500).json({ error: message })
  }
})

app.post('/posts', auth, validatePost, async (req, res) => {
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
    const message = error.message || 'Erro ao criar post.'
    return res.status(500).json({ error: message })
  }
})

app.put('/posts/:id', auth, validatePost, async (req, res) => {
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
    const message = error.message || 'Erro ao atualizar post.'
    return res.status(500).json({ error: message })
  }
})

app.delete('/posts/:id', auth, async (req, res) => {
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
    const message = error.message || 'Erro ao excluir post.'
    return res.status(500).json({ error: message })
  }
})
