import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatarDuracao, agruparPorMes } from '../utils/datas'

export default function AlunoHistorico() {
  const { aluno } = useAuth()
  const [execucoes, setExecucoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (aluno?.id) loadHistorico()
  }, [aluno?.id])

  async function loadHistorico() {
    setLoading(true)
    const { data } = await supabase
      .from('treino_execucoes')
      .select('*, treinos(id, nome)')
      .eq('aluno_id', aluno.id)
      .order('data_execucao', { ascending: false })
      .order('criado_em', { ascending: false })
      .limit(200)
    setExecucoes(data || [])
    setLoading(false)
  }

  const gruposPorMes = agruparPorMes(execucoes)

  const diaSemanaCurto = { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sáb: 0, dom: 0 }
  execucoes.forEach((e) => {
    if (!e.concluido) return
    const d = new Date(e.data_execucao + 'T00:00:00')
    const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
    diaSemanaCurto[nomes[d.getDay()]] = (diaSemanaCurto[nomes[d.getDay()]] || 0) + 1
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Seu progresso</p>
          <h1 className="page-title">Histórico</h1>
          <p className="page-subtitle">Veja quando e o que você treinou.</p>
        </div>
      </div>

      {!loading && execucoes.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Frequência por dia da semana
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((dia) => (
              <div key={dia} style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${Math.min(44, (diaSemanaCurto[dia] || 0) * 14 + (diaSemanaCurto[dia] ? 6 : 2))}px`,
                      background: diaSemanaCurto[dia] ? 'var(--accent)' : 'var(--border)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{dia}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="loading-line">Carregando...</div>}

      {!loading && execucoes.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum treino registrado ainda</strong>
          Assim que você concluir um treino, ele aparece aqui.
        </div>
      )}

      {!loading && gruposPorMes.map(([mes, lista]) => (
        <div key={mes} style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.3px', margin: '0 0 12px' }}>
            {mes}
          </h3>
          {lista.map((e) => {
            const duracao = formatarDuracao(e.criado_em, e.concluido_em)
            const dataFormatada = new Date(e.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'short', day: '2-digit', month: '2-digit',
            })
            return (
              <div
                key={e.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: 16 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>
                    {e.treinos ? (
                      <Link to={`/aluno/treinos/${e.treinos.id}`} style={{ color: 'inherit' }}>{e.treinos.nome}</Link>
                    ) : 'Treino removido'}
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {dataFormatada}{duracao ? ` · ${duracao}` : ''}
                  </span>
                </div>
                <span className={`badge ${e.concluido ? 'badge-success' : 'badge-muted'}`}>
                  {e.concluido ? 'Concluído' : 'Em andamento'}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
