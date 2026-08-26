import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

export default function AlunoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { personal } = useAuth()
  const [aluno, setAluno] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const [{ data: alunoData }, { data: treinosData }] = await Promise.all([
      supabase.from('alunos').select('*').eq('id', id).maybeSingle(),
      supabase.from('treinos').select('*').eq('aluno_id', id).order('criado_em', { ascending: false }),
    ])
    setAluno(alunoData)
    setTreinos(treinosData || [])
    setLoading(false)
  }

  async function handleRemoveAluno() {
    if (!confirm(`Remover ${aluno.nome} e todos os treinos associados? Essa ação não pode ser desfeita.`)) return
    await supabase.from('alunos').delete().eq('id', id)
    navigate('/')
  }

  async function handleRemoveTreino(treino) {
    if (!confirm(`Remover o treino "${treino.nome}"? Isso também apaga o histórico de execuções desse treino. Essa ação não pode ser desfeita.`)) return
    await supabase.from('treinos').delete().eq('id', treino.id)
    setTreinos((prev) => prev.filter((t) => t.id !== treino.id))
  }

  if (loading) return <div className="loading-line">Carregando...</div>
  if (!aluno) return <div className="empty-state"><strong>Aluno não encontrado</strong></div>

  return (
    <div>
      <p className="breadcrumb"><Link to="/">← Alunos</Link></p>

      <div className="page-header">
        <div>
          <p className="eyebrow">{aluno.objetivo || 'Aluno'}</p>
          <h1 className="page-title">{aluno.nome}</h1>
          <p className="page-subtitle">{aluno.email || 'Sem email cadastrado'}</p>
          <span className={`badge ${aluno.user_id ? 'badge-success' : 'badge-muted'}`} style={{ marginTop: 10, display: 'inline-flex' }}>
            {aluno.user_id ? 'Conta de acesso vinculada' : 'Aguardando aluno criar a conta'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleRemoveAluno}>Remover aluno</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo treino</button>
        </div>
      </div>

      {treinos.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum treino montado ainda</strong>
          Crie o primeiro treino para {aluno.nome.split(' ')[0]}.
        </div>
      )}

      {treinos.length > 0 && (
        <div className="grid-cards">
          {treinos.map((treino) => (
            <div key={treino.id} className="card" style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                title="Remover treino"
                onClick={() => handleRemoveTreino(treino)}
                style={{ position: 'absolute', top: 14, right: 14 }}
              >
                ✕
              </button>
              <Link to={`/treinos/${treino.id}`} style={{ display: 'block', paddingRight: 30 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{treino.nome}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
                  {treino.descricao || 'Sem descrição'}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NovoTreinoModal
          alunoId={id}
          personalId={personal?.id}
          onClose={() => setShowModal(false)}
          onCreated={(treinoId) => navigate(`/treinos/${treinoId}`)}
        />
      )}
    </div>
  )
}

function NovoTreinoModal({ alunoId, personalId, onClose, onCreated }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data, error } = await supabase
      .from('treinos')
      .insert({ aluno_id: alunoId, personal_id: personalId, nome, descricao: descricao || null })
      .select()
      .single()
    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    onCreated(data.id)
  }

  return (
    <Modal title="Novo treino" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nome">Nome do treino</label>
          <input
            id="nome"
            placeholder="Ex: Treino A - Peito e Tríceps"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="descricao">Descrição (opcional)</label>
          <textarea
            id="descricao"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Criar treino'}
        </button>
      </form>
    </Modal>
  )
}
