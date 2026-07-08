import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { toEmbedUrl } from '../utils/video'

export default function ExecucaoTreino() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [execucao, setExecucao] = useState(null)
  const [treino, setTreino] = useState(null)
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [openVideoId, setOpenVideoId] = useState(null)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: execucaoData } = await supabase
      .from('treino_execucoes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!execucaoData) {
      setLoading(false)
      return
    }

    const { data: treinoData } = await supabase
      .from('treinos')
      .select('*')
      .eq('id', execucaoData.treino_id)
      .maybeSingle()

    const { data: itensData } = await supabase
      .from('treino_exercicios')
      .select('*, exercicios(*)')
      .eq('treino_id', execucaoData.treino_id)
      .order('ordem')

    const { data: existentes } = await supabase
      .from('execucao_exercicios')
      .select('*')
      .eq('execucao_id', id)

    const existentesMap = new Map((existentes || []).map((e) => [e.treino_exercicio_id, e]))

    // Garante que existe uma linha de check para cada exercício do treino
    const faltantes = (itensData || []).filter((item) => !existentesMap.has(item.id))
    if (faltantes.length > 0) {
      const novos = faltantes.map((item) => ({
        execucao_id: id,
        treino_exercicio_id: item.id,
        series_realizadas: item.series,
        repeticoes_realizadas: item.repeticoes,
        carga_utilizada_kg: item.carga_kg,
        concluido: false,
      }))
      const { data: inseridos } = await supabase.from('execucao_exercicios').insert(novos).select()
      inseridos?.forEach((e) => existentesMap.set(e.treino_exercicio_id, e))
    }

    const listaChecks = (itensData || []).map((item) => ({
      item,
      check: existentesMap.get(item.id),
    }))

    setExecucao(execucaoData)
    setTreino(treinoData)
    setChecks(listaChecks)
    setLoading(false)
  }

  async function toggleCheck(check) {
    const novoValor = !check.concluido
    await supabase.from('execucao_exercicios').update({ concluido: novoValor }).eq('id', check.id)
    setChecks((prev) =>
      prev.map((c) => (c.check.id === check.id ? { ...c, check: { ...c.check, concluido: novoValor } } : c))
    )
  }

  async function updateCampo(check, campo, valor) {
    setChecks((prev) =>
      prev.map((c) => (c.check.id === check.id ? { ...c, check: { ...c.check, [campo]: valor } } : c))
    )
  }

  async function salvarCampo(check, campo, valor) {
    await supabase.from('execucao_exercicios').update({ [campo]: valor }).eq('id', check.id)
  }

  async function handleFinalizar() {
    setFinalizing(true)
    await supabase.from('treino_execucoes').update({ concluido: true }).eq('id', id)
    setFinalizing(false)
    navigate(`/treinos/${treino.id}`)
  }

  if (loading) return <div className="loading-line">Carregando...</div>
  if (!execucao) return <div className="empty-state"><strong>Execução não encontrada</strong></div>

  const totalFeitos = checks.filter((c) => c.check?.concluido).length

  return (
    <div>
      <p className="breadcrumb">
        <Link to={`/treinos/${treino?.id}`}>← {treino?.nome}</Link>
      </p>

      <div className="page-header">
        <div>
          <p className="eyebrow">Execução de hoje</p>
          <h1 className="page-title">{treino?.nome}</h1>
          <p className="page-subtitle">{totalFeitos} de {checks.length} exercícios concluídos</p>
        </div>
        <button className="btn btn-primary" onClick={handleFinalizar} disabled={finalizing || execucao.concluido}>
          {execucao.concluido ? 'Treino concluído ✓' : finalizing ? 'Salvando...' : 'Finalizar treino'}
        </button>
      </div>

      {checks.map(({ item, check }) => {
        if (!check) return null
        const embed = toEmbedUrl(item.exercicios?.video_url)
        const videoAberto = openVideoId === item.id

        return (
          <div key={check.id} className={`check-row${check.concluido ? ' done' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button className="check-toggle" onClick={() => toggleCheck(check)} aria-label="Marcar como concluído">✓</button>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15 }}>{item.exercicios?.nome}</h4>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Planejado: {item.series}x{item.repeticoes} {item.carga_kg ? `· ${item.carga_kg}kg` : ''}
                </span>
              </div>

              {item.exercicios?.video_url && (
                <button className="icon-btn" title="Ver vídeo" onClick={() => setOpenVideoId(videoAberto ? null : item.id)}>
                  ▶
                </button>
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

            <div className="field-row" style={{ marginTop: 10, marginBottom: 0 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Séries feitas</label>
                <input
                  type="number"
                  min="0"
                  value={check.series_realizadas ?? ''}
                  onChange={(e) => updateCampo(check, 'series_realizadas', e.target.value)}
                  onBlur={(e) => salvarCampo(check, 'series_realizadas', Number(e.target.value))}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Reps feitas</label>
                <input
                  value={check.repeticoes_realizadas ?? ''}
                  onChange={(e) => updateCampo(check, 'repeticoes_realizadas', e.target.value)}
                  onBlur={(e) => salvarCampo(check, 'repeticoes_realizadas', e.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Carga usada (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={check.carga_utilizada_kg ?? ''}
                  onChange={(e) => updateCampo(check, 'carga_utilizada_kg', e.target.value)}
                  onBlur={(e) => salvarCampo(check, 'carga_utilizada_kg', e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
