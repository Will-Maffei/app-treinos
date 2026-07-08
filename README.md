# App de Treinos — Painel do Personal

App em React + Supabase para montar treinos, cadastrar alunos, gerenciar
exercícios com vídeo demonstrativo e acompanhar a execução (checklist)
dos treinos.

## 1. Configurar as variáveis do Supabase

1. No painel do Supabase, vá em **Project Settings → API**
2. Copie a **Project URL** e a **anon public key**
3. Duplique o arquivo `.env.example`, renomeie a cópia para `.env` e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

⚠️ O arquivo `.env` nunca deve ser enviado ao GitHub (já está no `.gitignore`).

## 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (geralmente `http://localhost:5173`).
Faça login com o email e senha que você já criou em Authentication → Users
no Supabase.

## 3. Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão do app de treinos"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/app-treinos.git
git push -u origin main
```

## 4. Publicar online de graça (Vercel)

1. Crie uma conta em vercel.com e conecte seu GitHub
2. Clique em **Add New → Project** e escolha o repositório
3. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env`
4. Clique em **Deploy**

Pronto — o app fica acessível por um link público, atualizado automaticamente
a cada `git push`.

## Estrutura do projeto

```
src/
├── pages/
│   ├── Login.jsx           tela de login
│   ├── Dashboard.jsx       lista de alunos
│   ├── AlunoDetail.jsx     treinos de um aluno
│   ├── TreinoEditor.jsx    montar treino (add/remover exercícios, séries/reps/carga)
│   ├── ExecucaoTreino.jsx  checklist de execução + vídeos
│   └── Exercicios.jsx      banco de exercícios (CRUD + vídeo)
├── components/             Sidebar, Modal, ProtectedRoute
├── context/AuthContext.jsx autenticação (Supabase Auth)
├── utils/video.js          conversão de link → embed (YouTube/Vimeo)
└── styles/global.css       sistema de design do app
```

## Como funciona o fluxo

1. **Cadastrar aluno** → tela inicial, botão "Novo aluno"
2. **Cadastrar exercícios** → menu "Banco de exercícios", com nome, grupo
   muscular, link de vídeo (YouTube/Vimeo) e instruções
3. **Montar treino** → dentro do aluno, "Novo treino", depois "Adicionar
   exercício" escolhendo do banco e definindo séries, repetições, carga e
   descanso
4. **Executar treino** → botão "Iniciar execução" cria uma sessão do dia,
   onde cada exercício tem um check ✓, campo de séries/reps/carga
   realmente feitas e o vídeo demonstrativo disponível para consulta
5. **Finalizar treino** → marca a sessão como concluída

## Próximos passos sugeridos

- Login separado para os alunos acompanharem o próprio treino (hoje só o
  personal tem acesso — dá pra evoluir depois)
- Histórico/gráfico de evolução de carga por exercício
- Notificações por email lembrando o aluno do treino do dia
