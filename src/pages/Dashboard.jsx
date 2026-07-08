import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

export default function Dashboard() {
  const { personal } = useAuth()
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadAlunos()
  }, [])

  async function loadAlunos() {
    setLoading(true)
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .order('nome')
    setAlunos(data || [])
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Painel</p>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">
            {alunos.length === 0
              ? 'Nenhum aluno cadastrado ainda.'
              : `${alunos.length} aluno${alunos.length > 1 ? 's' : ''} na sua carteira.`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Novo aluno
        </button>
      </div>

      {loading && <div className="loading-line">Carregando alunos...</div>}

      {!loading && alunos.length === 0 && (
        <div className="empty-state">
          <strong>Sua carteira está vazia</strong>
          Cadastre o primeiro aluno para começar a montar treinos.
        </div>
      )}

      {!loading && alunos.length > 0 && (
        <div className="grid-cards">
          {alunos.map((aluno) => (
            <Link key={aluno.id} to={`/alunos/${aluno.id}`} className="card card-link">
              <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{aluno.nome}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
                {aluno.objetivo || 'Objetivo não definido'}
              </p>
              <span className={`badge ${aluno.ativo ? 'badge-success' : 'badge-muted'}`} style={{ marginTop: 12, display: 'inline-flex' }}>
                {aluno.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NovoAlunoModal
          personalId={personal?.id}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            loadAlunos()
          }}
        />
      )}
    </div>
  )
}

function NovoAlunoModal({ personalId, onClose, onCreated }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('alunos').insert({
      personal_id: personalId,
      nome,
      email: email || null,
      objetivo: objetivo || null,
    })
    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    onCreated()
  }

  return (
    <Modal title="Novo aluno" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="email">Email (opcional)</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="objetivo">Objetivo (opcional)</label>
          <input
            id="objetivo"
            placeholder="Ex: hipertrofia, emagrecimento..."
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar aluno'}
        </button>
      </form>
    </Modal>
  )
}
