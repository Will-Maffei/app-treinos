import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { formatarDuracao } from '../utils/datas'

export default function PersonalDashboard() {
  const [execucoes, setExecucoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroAluno, setFiltroAluno] = useState('todos')

  useEffect(() => {
    loadExecucoes()
  }, [])

  async function loadExecucoes() {
    setLoading(true)
    const { data } = await supabase
      .from('treino_execucoes')
      .select('*, treinos(id, nome), alunos(id, nome)')
      .order('data_execucao', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(200)
    setExecucoes(data || [])
    setLoading(false)
  }

  const alunosUnicos = useMemo(() => {
    const map = new Map()
    execucoes.forEach((e) => {
      if (e.alunos) map.set(e.alunos.id, e.alunos.nome)
    })
    return Array.from(map.entries())
  }, [execucoes])

  const execucoesFiltradas = useMemo(() => {
    if (filtroAluno === 'todos') return execucoes
    return execucoes.filter((e) => e.alunos?.id === filtroAluno)
  }, [execucoes, filtroAluno])

  const stats = useMemo(() => {
    const hoje = new Date()
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(hoje.getDate() - 7)
    const seteDiasAtrasStr = seteDiasAtras.toISOString().slice(0, 10)

    const execucoesSemana = execucoes.filter((e) => e.data_execucao >= seteDiasAtrasStr)
    const alunosAtivosSemana = new Set(execucoesSemana.map((e) => e.alunos?.id).filter(Boolean))
    const concluidas = execucoes.filter((e) => e.concluido)
    const taxaConclusao = execucoes.length > 0 ? Math.round((concluidas.length / execucoes.length) * 100) : 0

    return {
      totalSemana: execucoesSemana.length,
      alunosAtivos: alunosAtivosSemana.size,
      taxaConclusao,
    }
  }, [execucoes])

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Acompanhe quando e como seus alunos estão treinando.</p>
        </div>
      </div>

      {!loading && execucoes.length > 0 && (
        <div className="grid-cards" style={{ marginBottom: 28 }}>
          <div className="card">
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Treinos nos últimos 7 dias
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 32 }}>{stats.totalSemana}</p>
          </div>
          <div className="card">
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Alunos ativos essa semana
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 32 }}>{stats.alunosAtivos}</p>
          </div>
          <div className="card">
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Taxa de conclusão
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 32 }}>{stats.taxaConclusao}%</p>
          </div>
        </div>
      )}

      {loading && <div className="loading-line">Carregando...</div>}

      {!loading && execucoes.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum treino registrado ainda</strong>
          Assim que seus alunos começarem a treinar, o histórico aparece aqui.
        </div>
      )}

      {!loading && execucoes.length > 0 && (
        <>
          <div className="field" style={{ maxWidth: 280, marginBottom: 16 }}>
            <label htmlFor="filtro-aluno">Filtrar por aluno</label>
            <select id="filtro-aluno" value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)}>
              <option value="todos">Todos os alunos</option>
              {alunosUnicos.map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Aluno</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Treino</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Data</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Duração</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {execucoesFiltradas.map((e) => {
                  const duracao = formatarDuracao(e.criado_em, e.concluido_em)
                  const dataFormatada = new Date(e.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {e.alunos ? (
                          <Link to={`/alunos/${e.alunos.id}`} style={{ color: 'var(--accent)' }}>{e.alunos.nome}</Link>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{e.treinos?.nome || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{dataFormatada}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{duracao || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${e.concluido ? 'badge-success' : 'badge-muted'}`}>
                          {e.concluido ? 'Concluído' : 'Em andamento'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
