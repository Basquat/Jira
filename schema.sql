-- Kanban: rode este arquivo inteiro no Supabase → SQL Editor → Run.
-- Pode rodar de novo sempre que o app for atualizado: só cria/atualiza o que falta, sem apagar dados.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text not null
);

create table if not exists api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

-- Usuário atual: sessão do app (JWT) ou chave de API no header x-api-key (usada pelo Claude).
create or replace function app_uid() returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(auth.uid(), (
    select user_id from api_tokens where token_hash = encode(sha256(convert_to(
      nullif(current_setting('request.headers', true), '')::json->>'x-api-key', 'utf8')), 'hex')))
$$;

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name <> ''),
  owner uuid not null default app_uid() references profiles on delete cascade,
  invite_token uuid unique, -- null = sem link de convite (privado)
  seq int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists board_members (
  board_id uuid references boards on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (board_id, user_id)
);
alter table board_members add column if not exists role text not null default 'editor' check (role in ('editor', 'viewer'));

create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards on delete cascade,
  name text not null check (name <> ''),
  position float8 not null default extract(epoch from clock_timestamp()),
  unique (id, board_id)
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards on delete cascade,
  column_id uuid not null,
  number int,
  title text not null check (title <> ''),
  description text not null default '',
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  due_date date,
  assignee uuid references profiles on delete set null,
  position float8 not null default extract(epoch from clock_timestamp()),
  foreign key (column_id, board_id) references columns (id, board_id) on delete cascade
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards on delete cascade,
  author uuid not null default app_uid() references profiles on delete cascade,
  body text not null check (body <> ''),
  created_at timestamptz not null default now()
);

-- v2: sigla e cor do quadro, limite WIP e coluna "concluído", tipo/etiquetas/pontos/checklist do card.
alter table boards
  add column if not exists key text not null default 'KB' check (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  add column if not exists color text not null default '#0c66e4' check (color ~ '^#[0-9a-fA-F]{6}$');
alter table columns
  add column if not exists wip_limit int check (wip_limit > 0),
  add column if not exists done boolean not null default false;
alter table cards
  add column if not exists type text not null default 'tarefa' check (type in ('tarefa', 'bug', 'historia', 'epico')),
  add column if not exists labels text[] not null default '{}',
  add column if not exists points int check (points between 0 and 999),
  add column if not exists checklist jsonb not null default '[]' check (jsonb_typeof(checklist) = 'array'),
  add column if not exists created_by uuid default app_uid() references profiles on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- v3: sprints separados do quadro (não mudam o que aparece no kanban), papel "somente leitura", anexos.
create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards on delete cascade,
  name text not null check (name <> ''),
  status text not null default 'planned' check (status in ('planned', 'active', 'closed')),
  created_at timestamptz not null default now()
);
create unique index if not exists one_active_sprint_per_board on sprints (board_id) where status = 'active';
alter table cards add column if not exists sprint_id uuid references sprints on delete set null;
-- sem isso, o "old" de um UPDATE só traz a chave primária, e o app não consegue ver que o assignee mudou.
alter table cards replica identity full;

create or replace function is_member(b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from board_members where board_id = b and user_id = app_uid())
$$;

-- editor: dono, ou membro com role='editor'. Membro 'viewer' só lê (comentar continua liberado).
create or replace function is_editor(b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from board_members where board_id = b and user_id = app_uid() and role = 'editor')
      or exists (select 1 from boards where id = b and owner = app_uid())
$$;

create or replace function shares_board(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from board_members a join board_members m using (board_id) where a.user_id = app_uid() and m.user_id = u)
$$;

-- Gatilhos: perfil no cadastro, dono + colunas padrão no quadro novo, número do card (KEY-1, KEY-2...), data de edição.
create or replace function on_signup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)));
  return new;
end $$;
create or replace trigger on_signup after insert on auth.users for each row execute function on_signup();
insert into profiles (id, email, name) select id, email, split_part(email, '@', 1) from auth.users on conflict do nothing;

create or replace function on_board_created() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into board_members values (new.id, new.owner);
  insert into columns (board_id, name, position, done)
  values (new.id, 'A fazer', 1, false), (new.id, 'Em andamento', 2, false), (new.id, 'Concluído', 3, true);
  return new;
end $$;
create or replace trigger on_board_created after insert on boards for each row execute function on_board_created();

create or replace function next_card_number() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update boards set seq = seq + 1 where id = new.board_id returning seq into new.number;
  return new;
end $$;
create or replace trigger next_card_number before insert on cards for each row execute function next_card_number();

create or replace function touch_card() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create or replace trigger touch_card before update on cards for each row execute function touch_card();

-- RPCs chamadas pelo app.
create or replace function join_board(token uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  select id into b from boards where invite_token = token;
  if b is null or auth.uid() is null then raise exception 'Convite inválido ou desativado'; end if;
  insert into board_members values (b, auth.uid()) on conflict do nothing;
  return b;
end $$;

create or replace function create_api_token(p_name text) returns text language plpgsql security definer set search_path = public as $$
declare t text := 'kb_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then raise exception 'Faça login'; end if;
  insert into api_tokens (user_id, name, token_hash) values (auth.uid(), p_name, encode(sha256(convert_to(t, 'utf8')), 'hex'));
  return t; -- só é mostrada uma vez; o banco guarda apenas o hash
end $$;

-- Permissões (RLS): cada um só vê/edita quadros dos quais é membro. Recriadas a cada execução.
alter table profiles enable row level security;
alter table api_tokens enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;
alter table comments enable row level security;
alter table sprints enable row level security;

do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('profiles', 'api_tokens', 'boards', 'board_members', 'columns', 'cards', 'comments', 'sprints') loop
    execute format('drop policy %I on %I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "perfis de quem divide quadro" on profiles for select using (id = app_uid() or shares_board(id));
create policy "editar meu perfil" on profiles for update using (id = app_uid()) with check (id = app_uid());
create policy "minhas chaves" on api_tokens for select using (user_id = auth.uid());
create policy "revogar minhas chaves" on api_tokens for delete using (user_id = auth.uid());
-- ponytail: membros também leem invite_token (podem repassar o link); dono troca/desativa o link se precisar.
create policy "ver quadros" on boards for select using (owner = app_uid() or is_member(id));
create policy "criar quadro" on boards for insert with check (owner = app_uid());
create policy "dono edita quadro" on boards for update using (owner = app_uid());
create policy "dono exclui quadro" on boards for delete using (owner = app_uid());
create policy "ver membros" on board_members for select using (is_member(board_id));
create policy "dono muda o papel de um membro" on board_members for update using (
  exists (select 1 from boards b where b.id = board_id and b.owner = app_uid() and b.owner <> user_id))
  with check (exists (select 1 from boards b where b.id = board_id and b.owner = app_uid() and b.owner <> user_id));
create policy "dono remove, membro sai" on board_members for delete using (
  exists (select 1 from boards b where b.id = board_id and b.owner <> user_id and app_uid() in (b.owner, user_id)));
-- select: qualquer membro (inclusive "somente leitura"). insert/update/delete: só editor ou dono.
create policy "ver colunas" on columns for select using (is_member(board_id));
create policy "editores escrevem colunas" on columns for all using (is_editor(board_id)) with check (is_editor(board_id));
create policy "ver cards" on cards for select using (is_member(board_id));
create policy "editores escrevem cards" on cards for all using (is_editor(board_id)) with check (is_editor(board_id));
create policy "ver sprints" on sprints for select using (is_member(board_id));
create policy "editores gerenciam sprints" on sprints for all using (is_editor(board_id)) with check (is_editor(board_id));
create policy "ver comentarios" on comments for select using (exists (select 1 from cards where id = card_id));
create policy "comentar" on comments for insert with check (author = app_uid() and exists (select 1 from cards where id = card_id));
create policy "apagar meu comentario" on comments for delete using (author = app_uid());

-- Tempo real: o app recebe as mudanças dos outros membros na hora (respeitando o RLS acima).
do $$ declare t text; begin
  foreach t in array array['boards', 'board_members', 'columns', 'cards', 'comments', 'sprints'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- Anexos: bucket privado, um arquivo por caminho "<board_id>/<card_id>/<nome>". Só a UI usa (não a API do Claude).
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict (id) do nothing;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname in ('anexos: ver', 'anexos: enviar', 'anexos: remover') loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
create policy "anexos: ver" on storage.objects for select
  using (bucket_id = 'attachments' and is_member((storage.foldername(name))[1]::uuid));
create policy "anexos: enviar" on storage.objects for insert
  with check (bucket_id = 'attachments' and is_editor((storage.foldername(name))[1]::uuid));
create policy "anexos: remover" on storage.objects for delete
  using (bucket_id = 'attachments' and is_editor((storage.foldername(name))[1]::uuid));
