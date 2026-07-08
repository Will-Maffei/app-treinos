import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function AlunoCadastro() {
  const { session, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sucesso, setSucesso] = useState(null) // null | 'confirmar_email' | 'pronto'

  if (session && role === 'aluno') return <Navigate to="/aluno" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Este email já tem uma senha cadastrada. Tente fazer login.'
          : 'Não foi possível criar sua senha. Confira o email e tente novamente.'
      )
      return
    }

    setSucesso(data.session ? 'pronto' : 'confirmar_email')
  }

  if (sucesso === 'confirmar_email') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand">
            <span className="brand-mark" />
            <span className="brand-title">TREINO</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '8px 0' }}>Quase lá!</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              Enviamos um link de confirmação para <strong>{email}</strong>. Abra seu email, clique no link,
              e depois volte aqui para entrar.
            </p>
            <Link to="/aluno/login" className="btn btn-ghost btn-block" style={{ marginTop: 16 }}>
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (sucesso === 'pronto') {
    return <Navigate to="/aluno" replace />
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-title">TREINO</span>
        </div>
        <p style={{ textAlign: 'center', marginTop: -12, marginBottom: 24, fontSize: 13, color: 'var(--ink-soft)' }}>
          Primeiro acesso — crie sua senha
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Use o mesmo email que seu personal cadastrou"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Crie uma senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirme a senha</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Criando...' : 'Criar minha senha'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 18, color: 'var(--ink-soft)' }}>
          Já tem senha? <Link to="/aluno/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
