import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

export default function TreinoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { personal } = useAuth()

  const [treino, setTreino] = useState(null)
  const [aluno, setAluno] = useState(null)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: treinoData } = await supabase.from('treinos').select('*').eq('id', id).maybeSingle()
    if (treinoData) {
      const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', treinoData.aluno_id).maybeSingle()
      setAluno(alunoData)
    }
    const { data: itensData } = await supabase
      .from('treino_exercicios')
      .select('*, exercicios(*)')
      .eq('treino_id', id)
      .order('ordem')
    setTreino(treinoData)
    setItens(itensData || [])
    setLoading(false)
  }

  async function handleRemoveItem(itemId) {
    if (!confirm('Remover este exercício do treino?')) return
    await supabase.from('treino_exercicios').delete().eq('id', itemId)
    loadAll()
  }

  async function handleIniciarExecucao() {
    setStarting(true)
    const { data, error } = await supabase
      .from('treino_execucoes')
      .insert({ treino_id: id, aluno_id: treino.aluno_id })
      .select()
      .single()
    setStarting(false)
    if (!error) navigate(`/execucoes/${data.id}`)
  }

  if (loading) return <div className="loading-line">Carregando...</div>
  if (!treino) return <div className="empty-state"><strong>Treino não encontrado</strong></div>

  return (
    <div>
      <p className="breadcrumb">
        <Link to="/">Alunos</Link> {' / '}
        <Link to={`/alunos/${treino.aluno_id}`}>{aluno?.nome}</Link>
      </p>

      <div className="page-header">
        <div>
          <p className="eyebrow">Treino</p>
          <h1 className="page-title">{treino.nome}</h1>
          {treino.descricao && <p className="page-subtitle">{treino.descricao}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Adicionar exercício
          </button>
          <button className="btn btn-ghost" onClick={handleIniciarExecucao} disabled={starting || itens.length === 0}>
            {starting ? 'Iniciando...' : 'Iniciar execução'}
          </button>
        </div>
      </div>

      {itens.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum exercício adicionado</strong>
          Adicione exercícios do seu banco para montar esse treino.
        </div>
      )}

      {itens.map((item, index) => (
        <div key={item.id} className="exercise-row">
          <span className="order-tag">{String(index + 1).padStart(2, '0')}</span>
          <div className="info">
            <h4>{item.exercicios?.nome || 'Exercício removido'}</h4>
            <span className="muscle">{item.exercicios?.grupo_muscular || '—'}</span>
          </div>
          <div className="stats">
            <span><b>{item.series}</b> séries</span>
            <span><b>{item.repeticoes}</b> reps</span>
            <span><b>{item.carga_kg ?? '—'}</b> kg</span>
            <span><b>{item.descanso_segundos ?? '—'}</b>s desc.</span>
          </div>
          <div className="row-actions">
            <button className="icon-btn" title="Editar" onClick={() => setEditingItem(item)}>✎</button>
            <button className="icon-btn" title="Remover" onClick={() => handleRemoveItem(item.id)}>✕</button>
          </div>
        </div>
      ))}

      {showAddModal && (
        <AdicionarExercicioModal
          treinoId={id}
          personalId={personal?.id}
          ordemAtual={itens.length}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false)
            loadAll()
          }}
        />
      )}

      {editingItem && (
        <EditarItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null)
            loadAll()
          }}
        />
      )}
    </div>
  )
}

function AdicionarExercicioModal({ treinoId, personalId, ordemAtual, onClose, onSaved }) {
  const [exercicios, setExercicios] = useState([])
  const [exercicioId, setExercicioId] = useState('')
  const [series, setSeries] = useState(3)
  const [repeticoes, setRepeticoes] = useState('12')
  const [cargaKg, setCargaKg] = useState('')
  const [descanso, setDescanso] = useState(60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('exercicios')
      .select('*')
      .eq('personal_id', personalId)
      .order('nome')
      .then(({ data }) => setExercicios(data || []))
  }, [personalId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exercicioId) {
      setError('Selecione um exercício.')
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('treino_exercicios').insert({
      treino_id: treinoId,
      exercicio_id: exercicioId,
      ordem: ordemAtual + 1,
      series: Number(series),
      repeticoes,
      carga_kg: cargaKg === '' ? null : Number(cargaKg),
      descanso_segundos: Number(descanso),
    })
    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    onSaved()
  }

  return (
    <Modal title="Adicionar exercício" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}

      {exercicios.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          Você ainda não tem exercícios cadastrados. Vá em "Banco de exercícios" no menu para criar o primeiro.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="exercicio">Exercício</label>
            <select id="exercicio" value={exercicioId} onChange={(e) => setExercicioId(e.target.value)} required autoFocus>
              <option value="">Selecione...</option>
              {exercicios.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.nome}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="series">Séries</label>
              <input id="series" type="number" min="1" value={series} onChange={(e) => setSeries(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="reps">Repetições</label>
              <input id="reps" placeholder="Ex: 8-12" value={repeticoes} onChange={(e) => setRepeticoes(e.target.value)} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="carga">Carga (kg)</label>
              <input id="carga" type="number" step="0.5" min="0" value={cargaKg} onChange={(e) => setCargaKg(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="descanso">Descanso (s)</label>
              <input id="descanso" type="number" min="0" value={descanso} onChange={(e) => setDescanso(e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
            {saving ? 'Adicionando...' : 'Adicionar ao treino'}
          </button>
        </form>
      )}
    </Modal>
  )
}

function EditarItemModal({ item, onClose, onSaved }) {
  const [series, setSeries] = useState(item.series)
  const [repeticoes, setRepeticoes] = useState(item.repeticoes)
  const [cargaKg, setCargaKg] = useState(item.carga_kg ?? '')
  const [descanso, setDescanso] = useState(item.descanso_segundos ?? 60)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('treino_exercicios')
      .update({
        series: Number(series),
        repeticoes,
        carga_kg: cargaKg === '' ? null : Number(cargaKg),
        descanso_segundos: Number(descanso),
      })
      .eq('id', item.id)
    setSaving(false)
    onSaved()
  }

  return (
    <Modal title={`Editar: ${item.exercicios?.nome}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="series-e">Séries</label>
            <input id="series-e" type="number" min="1" value={series} onChange={(e) => setSeries(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="reps-e">Repetições</label>
            <input id="reps-e" value={repeticoes} onChange={(e) => setRepeticoes(e.target.value)} required />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="carga-e">Carga (kg)</label>
            <input id="carga-e" type="number" step="0.5" min="0" value={cargaKg} onChange={(e) => setCargaKg(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="descanso-e">Descanso (s)</label>
            <input id="descanso-e" type="number" min="0" value={descanso} onChange={(e) => setDescanso(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </Modal>
  )
}
