import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [personal, setPersonal] = useState(null)
  const [aluno, setAluno] = useState(null)
  const [role, setRole] = useState(null) // 'personal' | 'aluno' | null
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadProfile(newSession.user)
      else {
        setPersonal(null)
        setAluno(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadProfile(user) {
    setLoading(true)

    // Tenta primeiro como personal trainer
    const { data: personalData } = await supabase
      .from('personal_trainers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (personalData) {
      setPersonal(personalData)
      setAluno(null)
      setRole('personal')
      setLoading(false)
      return
    }

    // Não é personal: tenta como aluno já vinculado
    let { data: alunoData } = await supabase
      .from('alunos')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Ainda não vinculado: tenta reivindicar o cadastro pelo email através
    // de uma função no banco (contorna problemas de RLS na comparação de email)
    if (!alunoData && user.email) {
      const { data: claimed } = await supabase.rpc('vincular_aluno_por_email')
      alunoData = claimed
    }

    if (!alunoData) {
      // Conta órfã: não é personal nem aluno vinculado (ex: cadastro de teste
      // sem email confirmado, ou vínculo quebrado no banco). Adiamos o signOut
      // com setTimeout porque chamá-lo direto dentro do callback do
      // onAuthStateChange trava o navegador em loop de navegação.
      setPersonal(null)
      setAluno(null)
      setRole(null)
      setLoading(false)
      setTimeout(() => {
        supabase.auth.signOut()
      }, 0)
      return
    }

    setPersonal(null)
    setAluno(alunoData)
    setRole('aluno')
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, personal, aluno, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
