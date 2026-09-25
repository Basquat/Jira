# Kanban (Jira 2.0 no GitHub Pages)

Site estático (`index.html`, `style.css` e `app.js`) no GitHub Pages. Login, dados, permissões e tempo real ficam no Supabase (plano grátis), porque o Pages só serve arquivos e não guarda dados.

## Configurar (uma vez)

1. Crie um projeto em https://supabase.com.
2. **SQL Editor** → cole todo o `schema.sql` → **Run**.
3. **Project Settings → API**: copie a **Project URL** e a chave **anon/publishable** para o topo do `app.js`.
4. **Authentication → URL Configuration**: em **Site URL**, coloque `https://basquat.github.io/Jira/`. Em **Redirect URLs**, adicione `https://basquat.github.io/Jira/**`.
5. (Opcional) **Authentication → Providers → Email**: desligue **Confirm email** para quem se cadastra entrar direto. O email grátis do Supabase envia poucas mensagens por hora, o que afeta a confirmação e o "esqueci a senha". Para mais volume, configure um SMTP próprio.
6. No GitHub: suba os arquivos na branch `main` e vá em **Settings → Pages → Deploy from a branch → `main` / root**.

**Ao atualizar o app:** rode o `schema.sql` de novo. Ele só cria o que falta e não apaga dados.

## Recursos

- Contas com login, cadastro, "esqueci a senha", perfil e tema claro, escuro ou automático.
- Quadros privados, com convite por link. O link pode ser gerado de novo ou desativado, e o dono remove membros.
- Colunas que você cria, renomeia (duplo clique), reordena (arrastando) e marca como "concluído", com limite WIP.
- Cards com sigla (ex.: `MKT-12`), tipo (tarefa, bug, história, épico), prioridade, responsável, data de entrega, pontos, etiquetas, checklist, anexos e comentários. Dá para duplicar e copiar o link direto do card.
- **Backlog e sprints**, na aba "Backlog" de cada quadro: crie sprints, mova cards do backlog pra dentro deles, inicie (um ativo por vez) e conclua (cards não terminados voltam pro backlog). Isso não muda o que aparece no quadro kanban — as duas visões convivem lado a lado.
- **Anexos** nos cards: qualquer arquivo, guardado no Storage do Supabase (mesmo projeto, sem servidor extra). Só quem edita o quadro anexa ou remove; todo membro pode ver e baixar.
- Arrastar e soltar no computador e no celular (no celular, segure o card por um instante antes de arrastar).
- Busca, filtro por pessoa, tipo e prioridade. Atalhos: `/` abre a busca e `c` cria um card.
- Atualização em tempo real entre os membros.
- Tela "Atribuídos a mim" com os seus cards pendentes em todos os quadros, agrupados por prazo (atrasado/hoje/em breve/mais tarde) ou por quadro.
- **Notificação** (som + aviso na tela) quando alguém te atribui um card ou comenta num card seu, mesmo em outro quadro ou na tela inicial.
- **Membros "somente leitura":** o dono de cada quadro escolhe, na aba Membros, se cada pessoa pode editar ou só acompanhar (vê tudo, comenta, mas não move nem edita nada).
- **Claude:** em **Claude / API → Gerar chave**, copie o texto e cole no Claude (por exemplo, no Claude Code). Ele cria, move e comenta cards pela API REST como se fosse você. A chave pode ser revogada quando quiser. (A API não cobre sprints/anexos/papéis — isso fica só pela tela.)

## Limites conhecidos

- No plano grátis, o projeto Supabase **pausa depois de 7 dias sem uso**. Para voltar, é só reativar no painel.
- Se duas pessoas editarem o mesmo campo ao mesmo tempo, vale a última alteração salva.
- Anexos entram no Storage do Supabase, com limite de 1 GB e de até 50 MB por arquivo no plano grátis (dá pra aumentar o limite por arquivo em Project Settings → Storage).
- O som da notificação só toca depois da primeira interação sua na página (regra do próprio navegador).
