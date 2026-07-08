import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { toEmbedUrl } from '../utils/video'

export default function AlunoTreinoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [treino, setTreino] = useState(null)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [openVideoId, setOpenVideoId] = useState(null)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: treinoData } = await supabase.from('treinos').select('*').eq('id', id).maybeSingle()
    const { data: itensData } = await supabase
      .from('treino_exercicios')
      .select('*, exercicios(*)')
      .eq('treino_id', id)
      .order('ordem')
    setTreino(treinoData)
    setItens(itensData || [])
    setLoading(false)
  }

  async function handleIniciar() {
    if (!treino) return
    setStarting(true)
    const { data, error } = await supabase
      .from('treino_execucoes')
      .insert({ treino_id: id, aluno_id: treino.aluno_id })
      .select()
      .single()
    setStarting(false)
    if (!error) navigate(`/aluno/execucoes/${data.id}`)
  }

  if (loading) return <div className="loading-line">Carregando...</div>
  if (!treino) return <div className="empty-state"><strong>Treino não encontrado</strong></div>

  return (
    <div>
      <p className="breadcrumb"><Link to="/aluno">← Meus treinos</Link></p>

      <div className="page-header">
        <div>
          <p className="eyebrow">Treino</p>
          <h1 className="page-title">{treino.nome}</h1>
          {treino.descricao && <p className="page-subtitle">{treino.descricao}</p>}
        </div>
        <button className="btn btn-primary" onClick={handleIniciar} disabled={starting || itens.length === 0}>
          {starting ? 'Iniciando...' : '▶ Iniciar treino de hoje'}
        </button>
      </div>

      {itens.map((item, index) => {
        const embed = toEmbedUrl(item.exercicios?.video_url)
        const videoAberto = openVideoId === item.id

        return (
          <div key={item.id} className="exercise-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
              <span className="order-tag">{String(index + 1).padStart(2, '0')}</span>
              <div className="info">
                <h4>{item.exercicios?.nome}</h4>
                <span className="muscle">{item.exercicios?.grupo_muscular || '—'}</span>
              </div>
              <div className="stats">
                <span><b>{item.series}</b> séries</span>
                <span><b>{item.repeticoes}</b> reps</span>
                <span><b>{item.carga_kg ?? '—'}</b> kg</span>
              </div>
              {item.exercicios?.video_url && (
                <button className="icon-btn" title="Ver vídeo" onClick={() => setOpenVideoId(videoAberto ? null : item.id)}>▶</button>
              )}
            </div>

            {videoAberto && (
              embed ? (
                <div className="video-frame">
                  <iframe src={embed} title={item.exercicios.nome} allowFullScreen />
                </div>
              ) : (
                <div className="no-video">
                  Não foi possível exibir o vídeo aqui.{' '}
                  <a href={item.exercicios.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                    Abrir link
                  </a>
                </div>
              )
            )}

            {item.exercicios?.descricao && (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '8px 0 0' }}>{item.exercicios.descricao}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
