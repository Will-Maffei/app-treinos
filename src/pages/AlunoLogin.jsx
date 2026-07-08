import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AlunoLogin() {
  const { session, role, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session && role === 'aluno') return <Navigate to="/aluno" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError('Email ou senha incorretos.')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-title">TREINO</span>
        </div>
        <p style={{ textAlign: 'center', marginTop: -12, marginBottom: 24, fontSize: 13, color: 'var(--ink-soft)' }}>
          Portal do aluno
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 18, color: 'var(--ink-soft)' }}>
          Primeiro acesso? <Link to="/aluno/cadastro" style={{ color: 'var(--accent)', fontWeight: 600 }}>Criar minha senha</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>
          <Link to="/login" style={{ color: 'var(--ink-faint)' }}>Sou o personal trainer</Link>
        </p>
      </div>
    </div>
  )
}
