import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { toEmbedUrl } from '../utils/video'

export default function Exercicios() {
  const { personal } = useAuth()
  const [exercicios, setExercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    loadExercicios()
  }, [])

  async function loadExercicios() {
    setLoading(true)
    const { data } = await supabase.from('exercicios').select('*').order('nome')
    setExercicios(data || [])
    setLoading(false)
  }

  async function handleRemove(exId) {
    if (!confirm('Remover este exercício? Ele será removido de todos os treinos que o usam.')) return
    await supabase.from('exercicios').delete().eq('id', exId)
    loadExercicios()
  }

  const filtrados = exercicios.filter((ex) =>
    (ex.nome + ' ' + (ex.grupo_muscular || '')).toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h1 className="page-title">Banco de exercícios</h1>
          <p className="page-subtitle">Cadastre exercícios com vídeo demonstrativo para usar em qualquer treino.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo exercício</button>
      </div>

      {exercicios.length > 0 && (
        <div className="field" style={{ maxWidth: 320, marginBottom: 20 }}>
          <input placeholder="Buscar por nome ou grupo muscular..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
      )}

      {loading && <div className="loading-line">Carregando...</div>}

      {!loading && exercicios.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum exercício cadastrado</strong>
          Comece cadastrando os exercícios que você mais usa nos treinos.
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="grid-cards">
          {filtrados.map((ex) => (
            <div key={ex.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{ex.nome}</h3>
                  {ex.grupo_muscular && <span className="badge badge-accent">{ex.grupo_muscular}</span>}
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="Editar" onClick={() => setEditing(ex)}>✎</button>
                  <button className="icon-btn" title="Remover" onClick={() => handleRemove(ex.id)}>✕</button>
                </div>
              </div>

              {ex.descricao && (
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0 0' }}>{ex.descricao}</p>
              )}

              {ex.video_url && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setPreview(preview === ex.id ? null : ex.id)}
                >
                  {preview === ex.id ? 'Ocultar vídeo' : '▶ Ver vídeo demonstrativo'}
                </button>
              )}

              {preview === ex.id && ex.video_url && (
                toEmbedUrl(ex.video_url) ? (
                  <div className="video-frame">
                    <iframe src={toEmbedUrl(ex.video_url)} title={ex.nome} allowFullScreen />
                  </div>
                ) : (
                  <div className="no-video">
                    Link não reconhecido para preview.{' '}
                    <a href={ex.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Abrir link</a>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ExercicioModal
          personalId={personal?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            loadExercicios()
          }}
        />
      )}

      {editing && (
        <ExercicioModal
          exercicio={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            loadExercicios()
          }}
        />
      )}
    </div>
  )
}

function ExercicioModal({ exercicio, personalId, onClose, onSaved }) {
  const isEdit = Boolean(exercicio)
  const [nome, setNome] = useState(exercicio?.nome || '')
  const [grupo, setGrupo] = useState(exercicio?.grupo_muscular || '')
  const [videoUrl, setVideoUrl] = useState(exercicio?.video_url || '')
  const [descricao, setDescricao] = useState(exercicio?.descricao || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      nome,
      grupo_muscular: grupo || null,
      video_url: videoUrl || null,
      descricao: descricao || null,
    }

    const { error } = isEdit
      ? await supabase.from('exercicios').update(payload).eq('id', exercicio.id)
      : await supabase.from('exercicios').insert({ ...payload, personal_id: personalId })

    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    onSaved()
  }

  return (
    <Modal title={isEdit ? 'Editar exercício' : 'Novo exercício'} onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nome-ex">Nome</label>
          <input id="nome-ex" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="grupo-ex">Grupo muscular</label>
          <input id="grupo-ex" placeholder="Ex: Peito, Costas, Perna..." value={grupo} onChange={(e) => setGrupo(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="video-ex">Link do vídeo demonstrativo</label>
          <input
            id="video-ex"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="desc-ex">Instruções de execução (opcional)</label>
          <textarea id="desc-ex" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Adicionar exercício'}
        </button>
      </form>
    </Modal>
  )
}
