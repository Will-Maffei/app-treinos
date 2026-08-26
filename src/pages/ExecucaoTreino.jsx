import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { toEmbedUrl } from '../utils/video'

export default function ExecucaoTreino({ basePath = '/treinos' }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [execucao, setExecucao] = useState(null)
  const [treino, setTreino] = useState(null)
  const [checks, setChecks] = useState([])
  const [anteriorMap, setAnteriorMap] = useState(new Map())
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
        concluido: false,
      }))
      const { data: inseridos } = await supabase.from('execucao_exercicios').insert(novos).select()
      inseridos?.forEach((e) => existentesMap.set(e.treino_exercicio_id, e))
    }

    // Busca as séries já registradas para cada exercício
    const execucaoExercicioIds = Array.from(existentesMap.values()).map((e) => e.id)
    let seriesPorExercicio = new Map()
    if (execucaoExercicioIds.length > 0) {
      const { data: seriesData } = await supabase
        .from('execucao_series')
        .select('*')
        .in('execucao_exercicio_id', execucaoExercicioIds)
        .order('numero_serie')

      seriesPorExercicio = (seriesData || []).reduce((map, s) => {
        const lista = map.get(s.execucao_exercicio_id) || []
        lista.push(s)
        map.set(s.execucao_exercicio_id, lista)
        return map
      }, new Map())
    }

    // Garante que cada exercício tenha ao menos as séries planejadas
    const novasSeries = []
    for (const item of itensData || []) {
      const check = existentesMap.get(item.id)
      if (!check) continue
      const existentesDoExercicio = seriesPorExercicio.get(check.id) || []
      const planejadas = item.series || 0
      for (let n = existentesDoExercicio.length + 1; n <= planejadas; n++) {
        novasSeries.push({
          execucao_exercicio_id: check.id,
          numero_serie: n,
          repeticoes: null,
          carga_kg: item.carga_kg,
          concluida: false,
        })
      }
    }
    if (novasSeries.length > 0) {
      const { data: inseridas } = await supabase.from('execucao_series').insert(novasSeries).select()
      inseridas?.forEach((s) => {
        const lista = seriesPorExercicio.get(s.execucao_exercicio_id) || []
        lista.push(s)
        seriesPorExercicio.set(s.execucao_exercicio_id, lista)
      })
    }

    const listaChecks = (itensData || []).map((item) => {
      const check = existentesMap.get(item.id)
      const series = (seriesPorExercicio.get(check?.id) || []).sort((a, b) => a.numero_serie - b.numero_serie)
      return { item, check, series }
    })

    // Busca o último treino concluído (antes deste) para mostrar como referência
    // ao lado de cada série (ex: "Anterior: 10 reps × 50kg")
    const novoAnteriorMap = new Map()
    const { data: execucaoAnterior } = await supabase
      .from('treino_execucoes')
      .select('id')
      .eq('treino_id', execucaoData.treino_id)
      .eq('aluno_id', execucaoData.aluno_id)
      .eq('concluido', true)
      .neq('id', id)
      .order('data_execucao', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (execucaoAnterior) {
      const { data: exerciciosAnteriores } = await supabase
        .from('execucao_exercicios')
        .select('id, treino_exercicio_id')
        .eq('execucao_id', execucaoAnterior.id)

      const idsAnteriores = (exerciciosAnteriores || []).map((e) => e.id)

      if (idsAnteriores.length > 0) {
        const { data: seriesAnteriores } = await supabase
          .from('execucao_series')
          .select('*')
          .in('execucao_exercicio_id', idsAnteriores)

        const porExecucaoExercicioId = new Map(
          (exerciciosAnteriores || []).map((e) => [e.id, e.treino_exercicio_id])
        )

        for (const s of seriesAnteriores || []) {
          const treinoExercicioId = porExecucaoExercicioId.get(s.execucao_exercicio_id)
          if (!treinoExercicioId) continue
          if (!novoAnteriorMap.has(treinoExercicioId)) novoAnteriorMap.set(treinoExercicioId, new Map())
          novoAnteriorMap.get(treinoExercicioId).set(s.numero_serie, s)
        }
      }
    }

    setExecucao(execucaoData)
    setTreino(treinoData)
    setChecks(listaChecks)
    setAnteriorMap(novoAnteriorMap)
    setLoading(false)
  }

  function updateChecksState(checkId, updater) {
    setChecks((prev) => prev.map((c) => (c.check?.id === checkId ? updater(c) : c)))
  }

  async function toggleSerieConcluida(check, serie) {
    const novoValor = !serie.concluida
    await supabase.from('execucao_series').update({ concluida: novoValor }).eq('id', serie.id)
    updateChecksState(check.id, (c) => ({
      ...c,
      series: c.series.map((s) => (s.id === serie.id ? { ...s, concluida: novoValor } : s)),
    }))
  }

  function updateSerieCampo(check, serieId, campo, valor) {
    updateChecksState(check.id, (c) => ({
      ...c,
      series: c.series.map((s) => (s.id === serieId ? { ...s, [campo]: valor } : s)),
    }))
  }

  async function salvarSerieCampo(serieId, campo, valor) {
    await supabase.from('execucao_series').update({ [campo]: valor }).eq('id', serieId)
  }

  async function adicionarSerie(check, series) {
    const proximoNumero = (series[series.length - 1]?.numero_serie || 0) + 1
    const ultimaCarga = series[series.length - 1]?.carga_kg ?? null
    const { data } = await supabase
      .from('execucao_series')
      .insert({
        execucao_exercicio_id: check.id,
        numero_serie: proximoNumero,
        repeticoes: null,
        carga_kg: ultimaCarga,
        concluida: false,
      })
      .select()
      .single()
    if (data) {
      updateChecksState(check.id, (c) => ({ ...c, series: [...c.series, data] }))
    }
  }

  async function removerSerie(check, serieId) {
    await supabase.from('execucao_series').delete().eq('id', serieId)
    updateChecksState(check.id, (c) => ({ ...c, series: c.series.filter((s) => s.id !== serieId) }))
  }

  async function handleFinalizar() {
    setFinalizing(true)
    await supabase.from('treino_execucoes').update({ concluido: true, concluido_em: new Date().toISOString() }).eq('id', id)
    setFinalizing(false)
    navigate(`${basePath}/${treino.id}`)
  }

  if (loading) return <div className="loading-line">Carregando...</div>
  if (!execucao) return <div className="empty-state"><strong>Execução não encontrada</strong></div>

  const totalFeitos = checks.filter(
    (c) => c.series.length > 0 && c.series.every((s) => s.concluida)
  ).length

  return (
    <div>
      <p className="breadcrumb">
        <Link to={`${basePath}/${treino?.id}`}>← {treino?.nome}</Link>
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

      {checks.map(({ item, check, series }) => {
        if (!check) return null
        const embed = toEmbedUrl(item.exercicios?.video_url)
        const videoAberto = openVideoId === item.id
        const todasFeitas = series.length > 0 && series.every((s) => s.concluida)

        return (
          <div key={check.id} className={`check-row${todasFeitas ? ' done' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15 }}>{item.exercicios?.nome}</h4>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Planejado: {item.series}x{item.repeticoes} {item.carga_kg ? `· ${item.carga_kg}kg` : ''}
                  {' · '}{series.filter((s) => s.concluida).length}/{series.length} séries feitas
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

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {series.map((serie, index) => {
                const anterior = anteriorMap.get(item.id)?.get(serie.numero_serie)
                const anteriorTexto = anterior
                  ? `${anterior.carga_kg != null ? `${anterior.carga_kg}kg` : '—'} × ${anterior.repeticoes ?? '—'}`
                  : null

                return (
                  <div
                    key={serie.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: serie.concluida ? 'var(--success-soft)' : 'var(--surface-alt)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      className="check-toggle"
                      style={{ width: 26, height: 26, fontSize: 13, flexShrink: 0 }}
                      onClick={() => toggleSerieConcluida(check, serie)}
                      aria-label={`Marcar série ${index + 1} como concluída`}
                    >
                      {serie.concluida ? '✓' : ''}
                    </button>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', width: 52, flexShrink: 0 }}>
                      Série {index + 1}
                    </span>

                    <input
                      type="number"
                      min="0"
                      placeholder={anterior?.repeticoes != null ? String(anterior.repeticoes) : 'reps'}
                      value={serie.repeticoes ?? ''}
                      onChange={(e) => updateSerieCampo(check, serie.id, 'repeticoes', e.target.value)}
                      onBlur={(e) => salvarSerieCampo(serie.id, 'repeticoes', e.target.value === '' ? null : Number(e.target.value))}
                      style={{ width: 64, border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>reps ×</span>

                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder={anterior?.carga_kg != null ? String(anterior.carga_kg) : 'kg'}
                      value={serie.carga_kg ?? ''}
                      onChange={(e) => updateSerieCampo(check, serie.id, 'carga_kg', e.target.value)}
                      onBlur={(e) => salvarSerieCampo(serie.id, 'carga_kg', e.target.value === '' ? null : Number(e.target.value))}
                      style={{ width: 72, border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>kg</span>

                    <button
                      className="icon-btn"
                      title="Remover série"
                      style={{ marginLeft: 'auto', width: 26, height: 26 }}
                      onClick={() => removerSerie(check, serie.id)}
                    >
                      ✕
                    </button>

                    {anteriorTexto && (
                      <span
                        style={{
                          width: '100%',
                          fontSize: 11,
                          color: 'var(--ink-faint)',
                          fontFamily: 'var(--font-mono)',
                          paddingLeft: 88,
                        }}
                      >
                        Última vez: {anteriorTexto}
                      </span>
                    )}
                  </div>
                )
              })}

              <button
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => adicionarSerie(check, series)}
              >
                + Adicionar série
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
