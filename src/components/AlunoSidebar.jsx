import { useAuth } from '../context/AuthContext'

export default function AlunoSidebar() {
  const { aluno, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-title">TREINO</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-link active">Meus treinos</span>
      </nav>

      <div className="sidebar-footer">
        {aluno?.nome || 'Aluno'}
        <button onClick={signOut}>Sair</button>
      </div>
    </aside>
  )
}
