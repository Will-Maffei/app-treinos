import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AlunoDashboard() {
  const { aluno } = useAuth()
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!aluno) return
    supabase
      .from('treinos')
      .select('*')
      .eq('aluno_id', aluno.id)
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        setTreinos(data || [])
        setLoading(false)
      })
  }, [aluno])

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Olá, {aluno?.nome?.split(' ')[0]}</p>
          <h1 className="page-title">Meus treinos</h1>
          <p className="page-subtitle">Escolha um treino para ver os exercícios e começar.</p>
        </div>
      </div>

      {loading && <div className="loading-line">Carregando...</div>}

      {!loading && treinos.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum treino disponível ainda</strong>
          Seu personal ainda não montou um treino para você. Volte em breve.
        </div>
      )}

      {!loading && treinos.length > 0 && (
        <div className="grid-cards">
          {treinos.map((treino) => (
            <Link key={treino.id} to={`/aluno/treinos/${treino.id}`} className="card card-link">
              <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{treino.nome}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
                {treino.descricao || 'Toque para ver os exercícios'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
