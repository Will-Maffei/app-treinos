-- ============================================================
-- MIGRAÇÃO: Login dos alunos (Portal do Aluno)
-- Rode isso no SQL Editor do Supabase, no projeto já existente.
-- ============================================================

-- 1. Coluna que vincula o aluno a uma conta de login (auth.users)
alter table alunos add column user_id uuid unique references auth.users(id) on delete set null;

-- ============================================================
-- 2. POLÍTICAS DE ACESSO PARA O ALUNO
-- ============================================================

-- Permite que o aluno "reivindique" seu próprio cadastro no primeiro
-- login, casando o email da conta criada com o email cadastrado pelo
-- personal. Só funciona se o cadastro ainda não tiver sido vinculado
-- (user_id nulo), evitando que alguém tome o lugar de outro aluno.
create policy "aluno_reivindica_proprio_cadastro"
  on alunos for update
  using (email = auth.email() and user_id is null)
  with check (user_id = auth.uid());

-- Aluno vê o próprio cadastro depois de vinculado
create policy "aluno_ve_proprio_cadastro"
  on alunos for select
  using (user_id = auth.uid());

-- Aluno vê os próprios treinos
create policy "aluno_ve_proprios_treinos"
  on treinos for select
  using (
    exists (
      select 1 from alunos
      where alunos.id = treinos.aluno_id
      and alunos.user_id = auth.uid()
    )
  );

-- Aluno vê os exercícios dentro dos próprios treinos (séries, reps, carga)
create policy "aluno_ve_itens_dos_proprios_treinos"
  on treino_exercicios for select
  using (
    exists (
      select 1 from treinos
      join alunos on alunos.id = treinos.aluno_id
      where treinos.id = treino_exercicios.treino_id
      and alunos.user_id = auth.uid()
    )
  );

-- Aluno vê os dados (nome, vídeo, instruções) dos exercícios usados
-- nos próprios treinos
create policy "aluno_ve_exercicios_dos_proprios_treinos"
  on exercicios for select
  using (
    exists (
      select 1 from treino_exercicios
      join treinos on treinos.id = treino_exercicios.treino_id
      join alunos on alunos.id = treinos.aluno_id
      where treino_exercicios.exercicio_id = exercicios.id
      and alunos.user_id = auth.uid()
    )
  );

-- Aluno pode criar e ver as próprias execuções de treino (sessões do dia)
create policy "aluno_gerencia_proprias_execucoes"
  on treino_execucoes for all
  using (
    exists (
      select 1 from alunos
      where alunos.id = treino_execucoes.aluno_id
      and alunos.user_id = auth.uid()
    )
  );

-- Aluno pode marcar/atualizar os checks dos próprios exercícios executados
create policy "aluno_gerencia_proprios_checks"
  on execucao_exercicios for all
  using (
    exists (
      select 1 from treino_execucoes
      join alunos on alunos.id = treino_execucoes.aluno_id
      where treino_execucoes.id = execucao_exercicios.execucao_id
      and alunos.user_id = auth.uid()
    )
  );

-- ============================================================
-- OBSERVAÇÕES
-- ============================================================
-- 1. O aluno só consegue "reivindicar" o cadastro se o email da conta
--    de login for IDÊNTICO ao email cadastrado pelo personal na ficha
--    do aluno. Por isso, a partir de agora, cadastre sempre o email
--    correto do aluno.
-- 2. Se o personal errar o email do aluno depois de já cadastrado,
--    pode corrigir editando o registro em alunos, contanto que
--    user_id ainda esteja nulo (aluno ainda não se cadastrou).
