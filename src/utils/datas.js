// Calcula e formata a duração entre início e fim de uma execução de treino.
// Retorna null se a execução ainda não foi concluída (sem horário final).
export function formatarDuracao(criadoEm, concluidoEm) {
  if (!concluidoEm) return null
  const inicio = new Date(criadoEm)
  const fim = new Date(concluidoEm)
  const minutos = Math.max(0, Math.round((fim - inicio) / 60000))

  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`
}

// Formata uma data (YYYY-MM-DD ou timestamp) para exibição em português,
// ex: "Segunda-feira, 14 de julho"
export function formatarDataCompleta(data) {
  const d = new Date(data + (typeof data === 'string' && data.length === 10 ? 'T00:00:00' : ''))
  const texto = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Agrupa uma lista de execuções por mês (ex: "Julho de 2026"), mantendo a ordem.
export function agruparPorMes(execucoes, campoData = 'data_execucao') {
  const grupos = new Map()
  for (const execucao of execucoes) {
    const d = new Date(execucao[campoData] + 'T00:00:00')
    const chave = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const chaveCapitalizada = chave.charAt(0).toUpperCase() + chave.slice(1)
    if (!grupos.has(chaveCapitalizada)) grupos.set(chaveCapitalizada, [])
    grupos.get(chaveCapitalizada).push(execucao)
  }
  return Array.from(grupos.entries())
}
