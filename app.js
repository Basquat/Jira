import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm'
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.7/+esm'

// Preencha com o seu projeto Supabase (Project Settings → API). A chave anon/publishable é pública por design:
// quem protege os dados são as regras RLS do schema.sql.
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co'
const SUPABASE_KEY = 'SUA-CHAVE-ANON-OU-PUBLISHABLE'

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── utilidades ────────────────────────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
const base = location.href.split('#')[0]
const day = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv') } // AAAA-MM-DD local
const hash = s => [...String(s)].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0) >>> 0, 7)
const norm = s => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
// ponytail: posição = meio entre vizinhos (float); ~50 arrastos no mesmo ponto esgotam a precisão, aí renumerar a coluna.
const between = (a, b) => a == null ? (b == null ? Date.now() / 1000 : b - 1) : b == null ? a + 1 : (a + b) / 2
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const ago = iso => {
  const s = (new Date(iso) - Date.now()) / 1000
  for (const [u, n] of [['year', 31536e3], ['month', 2592e3], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]])
    if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u)
  return 'agora mesmo'
}
const fmtDay = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR',
  { day: 'numeric', month: 'short', ...(d.slice(0, 4) !== day().slice(0, 4) && { year: 'numeric' }) }).replace('.', '')
const store = {
  get: k => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch {} },
}
const ERRORS = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'User already registered': 'Este email já tem uma conta. Use "Entrar".',
  'Email not confirmed': 'Confirme seu email pelo link que enviamos antes de entrar.',
  'Password should be at least': 'A senha precisa ter pelo menos 6 caracteres.',
  'New password should be different': 'A nova senha precisa ser diferente da atual.',
  'Failed to fetch': 'Sem conexão com o servidor. Verifique sua internet.',
  'duplicate key': 'Já existe um registro igual.',
}
const errMsg = e => Object.entries(ERRORS).find(([k]) => e?.message?.includes(k))?.[1] ?? e?.message ?? 'Algo deu errado.'
const ok = ({ data, error }) => { if (error) { toast(errMsg(error), 'error'); throw error } return data }

// ─── ícones e catálogos ────────────────────────────────────────────────────────
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  checklist: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
  cards: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  limit: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  flag: '<path d="M4 3v18M4 4h13l-2 4 2 4H4"/>',
}
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`
const LOGO = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2684ff"/><stop offset="1" stop-color="#6e5dc6"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#lg)"/><rect x="7" y="8" width="5" height="16" rx="1.5" fill="#fff"/><rect x="13.5" y="8" width="5" height="11" rx="1.5" fill="#fff" opacity=".85"/><rect x="20" y="8" width="5" height="7" rx="1.5" fill="#fff" opacity=".7"/></svg>`
const TYPES = {
  tarefa: { label: 'Tarefa', svg: '<rect width="16" height="16" rx="3" fill="#4bade8"/><path d="m4.5 8.3 2.3 2.3 4.7-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  bug: { label: 'Bug', svg: '<rect width="16" height="16" rx="3" fill="#e5493a"/><circle cx="8" cy="8" r="3.2" fill="#fff"/>' },
  historia: { label: 'História', svg: '<rect width="16" height="16" rx="3" fill="#63ba3c"/><path d="M5 3.8h6v8.7l-3-2.1-3 2.1z" fill="#fff"/>' },
  epico: { label: 'Épico', svg: '<rect width="16" height="16" rx="3" fill="#904ee2"/><path d="M9.2 2.8 4.8 9h3.1l-1.1 4.2L11.2 7H8.1z" fill="#fff"/>' },
}
const PRIOS = {
  urgente: { label: 'Urgente', svg: '<path d="m4 8 4-4 4 4M4 12.5l4-4 4 4" stroke="#e5493a"/>' },
  alta: { label: 'Alta', svg: '<path d="m4 10 4-4 4 4" stroke="#f79232"/>' },
  media: { label: 'Média', svg: '<path d="M4 6.5h8M4 10h8" stroke="#e2b203"/>' },
  baixa: { label: 'Baixa', svg: '<path d="m4 6 4 4 4-4" stroke="#2684ff"/>' },
}
const typeIcon = t => `<svg class="ti" viewBox="0 0 16 16" role="img" aria-label="${TYPES[t].label}"><title>${TYPES[t].label}</title>${TYPES[t].svg}</svg>`
const prioIcon = p => `<svg class="pi" viewBox="0 0 16 16" role="img" aria-label="Prioridade ${PRIOS[p].label}"><title>Prioridade ${PRIOS[p].label}</title><g fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PRIOS[p].svg}</g></svg>`
const opts = (o, sel) => Object.entries(o).map(([v, x]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${x.label}</option>`).join('')
const COLORS = ['#0c66e4', '#5e4db2', '#1f845a', '#c9372c', '#e56910', '#0e7c86', '#943d73', '#626f86']
const AVATAR_COLORS = ['#0c66e4', '#5e4db2', '#1f845a', '#ae2e24', '#a54800', '#206a83', '#943d73', '#4c6b1f']
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
const avatar = (p, size = '') => p
  ? `<span class="avatar ${size}" style="background:${AVATAR_COLORS[hash(p.id) % 8]}" title="${esc(p.name)}">${esc(initials(p.name))}</span>`
  : `<span class="avatar empty ${size}" title="Sem responsável">${icon('user')}</span>`
const labelChip = l => `<span class="label" style="--h:${hash(l) % 360}">${esc(l)}</span>`
const field = (label, control) => `<label class="field"><span>${label}</span>${control}</label>`
const detail = (label, control) => `<div class="detail"><span>${label}</span>${control}</div>`
const empty = (ic, title, text) => `<div class="empty">${icon(ic)}<strong>${title}</strong><p>${text}</p></div>`
const closeBtn = `<button type="button" class="btn icon subtle" data-close aria-label="Fechar">${icon('x')}</button>`
const swatches = sel => `<div class="swatches">${COLORS.map(c => `<label style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === sel ? 'checked' : ''} aria-label="Cor ${c}"><span></span></label>`).join('')}</div>`
const keyInput = el => { el.oninput = () => { el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } }
const suggestKey = name => {
  const w = norm(name).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const k = w.length > 1 ? w.map(x => x[0]).join('') : w[0] || ''
  return (/^[A-Z]/.test(k) ? k : 'KB' + k).slice(0, 4).padEnd(2, 'X')
}
const linkify = s => s.replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`)
const grow = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px' }
const fmtBytes = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'
const ROLES = { editor: { label: 'Pode editar' }, viewer: { label: 'Somente leitura' } }

// ─── notificações: toast + som quando alguém te atribui um card ou comenta ─────
// ponytail: janela em memória (perdida ao recarregar a aba) pra não notificar minhas próprias edições; se isso
// incomodar, o jeito correto é o backend dizer quem fez a mudança (ex.: coluna updated_by), não vale a pena agora.
const recentlyMine = new Map()
const markMine = id => recentlyMine.set(id, Date.now() + 4000)
const isMine = id => { const t = recentlyMine.get(id); if (!t) return false; if (t < Date.now()) { recentlyMine.delete(id); return false } return true }
function ding() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 880
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    o.start(); o.stop(ctx.currentTime + 0.3)
  } catch {}
}
const notify = msg => { toast(msg); ding() }

// ─── UI base: toasts, modais, menus, tema ──────────────────────────────────────
function toast(msg, type = '') {
  const box = $('#toasts'), t = document.createElement('div')
  t.className = 'toast ' + type
  t.setAttribute('role', type === 'error' ? 'alert' : 'status')
  t.textContent = msg
  box.append(t)
  try { box.hidePopover() } catch {}
  try { box.showPopover() } catch {} // popover = fica acima de modais abertos
  setTimeout(() => t.classList.add('out'), 3500)
  setTimeout(() => { t.remove(); if (!box.children.length) try { box.hidePopover() } catch {} }, 3900)
}

function modal(html, cls = 'dlg-sm') {
  const d = document.createElement('dialog')
  d.className = cls
  d.innerHTML = html
  document.body.append(d)
  let down
  d.addEventListener('mousedown', e => { down = e.target })
  d.addEventListener('click', e => { if ((e.target === d && down === d) || e.target.closest('[data-close]')) d.close() })
  d.addEventListener('close', () => d.remove())
  d.showModal()
  return d
}

const ask = (title, text, okLabel = 'Excluir', danger = true) => new Promise(res => {
  const d = modal(`<form method="dialog" class="confirm"><h2>${esc(title)}</h2><p>${esc(text)}</p>
    <footer><button value="" class="btn subtle">Cancelar</button><button value="ok" class="btn ${danger ? 'danger-solid' : 'primary'}">${esc(okLabel)}</button></footer></form>`)
  d.addEventListener('close', () => res(d.returnValue === 'ok'))
  $('[value=ok]', d).focus()
})

const formModal = (title, body, submit = 'Salvar') => new Promise(res => {
  const d = modal(`<form><header class="modal-head"><h2>${title}</h2>${closeBtn}</header><div class="modal-body">${body}</div>
    <footer class="modal-foot"><button type="button" class="btn subtle" data-close>Cancelar</button><button class="btn primary">${submit}</button></footer></form>`)
  const f = $('form', d)
  f.onsubmit = e => { e.preventDefault(); res(Object.fromEntries(new FormData(f))); d.close() }
  d.addEventListener('close', () => res(null))
  $('input, select, textarea', f)?.focus()
})

function menu(anchor, items) {
  closeMenu()
  const m = document.createElement('div')
  m.id = 'popover'
  m.className = 'popover'
  m.setAttribute('role', 'menu')
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.head ? `<div class="pop-head">${it.head}</div>`
    : `<button role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}">${icon(it.icon)}${esc(it.label)}</button>`).join('')
  ;(anchor.closest('dialog') || document.body).append(m) // dentro do modal, para ficar acima dele
  const r = anchor.getBoundingClientRect()
  m.style.top = (r.bottom + 4 + m.offsetHeight > innerHeight ? Math.max(8, r.top - m.offsetHeight - 4) : r.bottom + 4) + 'px'
  m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px'
  m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { closeMenu(); items[b.dataset.i].action() } }
  $('button', m)?.focus()
}
const closeMenu = () => $('#popover')?.remove()
addEventListener('pointerdown', e => { if (!e.target.closest?.('#popover')) closeMenu() }, true)

function applyTheme() {
  const p = store.get('theme') || 'auto'
  document.documentElement.dataset.theme = p === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p
}
const setTheme = p => { store.set('theme', p); applyTheme() }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); renderTop() })

// ─── estado e navegação ────────────────────────────────────────────────────────
let me, profile, board, channel, openCardId, recovering = false, nav = 0, dragging = false, justDragged = 0, reloadTimer
let sortables = [], boardView = 'kanban' // 'kanban' | 'backlog', reseta ao trocar de quadro
const filters = { q: '', people: new Set(), type: '', prio: '' }
const card = id => board?.cards.find(c => c.id === id)
const member = id => board?.members.find(m => m.id === id)
const canEdit = () => !board || board.owner === me.id || member(me.id)?.role === 'editor'

sb.auth.onAuthStateChange((event, session) => {
  const u = session?.user ?? null
  if (event === 'PASSWORD_RECOVERY') recovering = true
  else if (me !== undefined && u?.id === me?.id) return // refresh de token / foco na aba
  me = u
  profile = null
  setTimeout(route) // não chamar o supabase dentro do callback de auth
})
addEventListener('hashchange', () => me !== undefined && route())
addEventListener('visibilitychange', () => !document.hidden && board && scheduleReload())

async function route() {
  const n = ++nav
  closeMenu()
  const join = location.hash.match(/^#\/join\/([\w-]+)/)
  if (join) store.set('join', join[1]) // sobrevive ao login/cadastro/confirmação de email
  renderTop()
  if (!me) { board = null; channel = null; sb.removeAllChannels(); return showAuth() }
  if (recovering) return showNewPassword()
  profile ??= (await sb.from('profiles').select('*').eq('id', me.id).maybeSingle()).data ?? { id: me.id, name: me.email, email: me.email }
  channel ??= subscribe()
  const pending = store.get('join')
  if (pending) {
    store.set('join', null)
    const { data, error } = await sb.rpc('join_board', { token: pending })
    if (error) toast(errMsg(error), 'error')
    else toast('Convite aceito! Bem-vindo ao quadro.')
    history.replaceState(null, '', data ? '#/b/' + data : '#/')
  }
  if (n !== nav) return
  renderTop()
  const m = location.hash.match(/^#\/b\/([\w-]+)(?:\/(\d+))?/)
  m ? loadBoard(m[1], m[2] && +m[2]) : showHome()
}

function setPage(name) {
  sortables.forEach(s => s.destroy())
  sortables = []
  $('#app').className = 'page-' + name
  $('#app').dataset.board = ''
}

function renderTop() {
  const top = $('#top')
  top.hidden = !me || recovering
  if (top.hidden) return
  top.innerHTML = `<a href="#/" class="logo">${LOGO}<span>Kanban</span></a>
    <a href="#/" class="nav-link ${board ? '' : 'active'}">${icon('home')}<span class="hide-sm">Início</span></a>
    <span class="grow"></span>
    <button class="btn subtle" data-top="api">${icon('sparkles')}<span class="hide-sm">Claude / API</span></button>
    <button class="btn icon subtle" data-top="theme" aria-label="Alternar tema claro/escuro" title="Alternar tema">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
    <button class="avatar-btn" data-top="user" aria-label="Menu da conta">${avatar(profile)}</button>`
}
$('#top').onclick = e => {
  const b = e.target.closest('[data-top]')
  if (!b) return
  const a = b.dataset.top
  if (a === 'api') openApi()
  if (a === 'theme') { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); renderTop() }
  if (a === 'user') menu(b, [
    { head: `<strong>${esc(profile?.name)}</strong><small>${esc(me.email)}</small>` },
    { icon: 'user', label: 'Perfil, senha e tema', action: openProfile },
    { icon: 'sparkles', label: 'Claude / API', action: openApi },
    '-',
    { icon: 'logout', label: 'Sair', action: () => sb.auth.signOut() },
  ])
}

// ─── tempo real ────────────────────────────────────────────────────────────────
function subscribe() {
  const ch = sb.channel('kanban')
  for (const table of ['boards', 'board_members', 'columns', 'cards', 'comments', 'sprints'])
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, p => onRealtime(table, p))
  return ch.subscribe()
}
async function onRealtime(table, { new: n, old: o }) {
  if (table === 'cards' && n?.assignee === me.id && o?.assignee !== me.id && !isMine(n.id))
    notify(`Você foi atribuído a "${n.title}".`)
  if (table === 'comments' && !o && n?.author !== me.id && openCardId !== n?.card_id) {
    const info = card(n.card_id) ?? (await sb.from('cards').select('assignee, created_by, title').eq('id', n.card_id).maybeSingle()).data
    if (info && (info.assignee === me.id || info.created_by === me.id)) notify(`Novo comentário em "${info.title}".`)
  }
  if (table === 'comments' && openCardId && (n?.card_id === openCardId || $(`[data-comment="${o?.id}"]`))) loadComments()
  if (!board) return
  const ids = new Set([board.id, ...board.cols.map(c => c.id), ...board.cards.map(c => c.id), ...board.sprints.map(s => s.id)])
  if ([n?.board_id, n?.id, n?.card_id, o?.board_id, o?.id].some(x => ids.has(x))) scheduleReload()
}
function scheduleReload() {
  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => {
    if (!board) return
    if (dragging) return scheduleReload()
    loadBoard(board.id)
  }, 300)
}
async function patch(table, id, values) {
  if (table === 'cards' && 'assignee' in values) markMine(id) // senão o eco em tempo real da minha própria mudança vira notificação
  const { error } = await sb.from(table).update(values).eq('id', id)
  if (error) toast(errMsg(error), 'error')
  scheduleReload()
  return !error
}

// ─── autenticação ──────────────────────────────────────────────────────────────
function showAuth(mode = 'in', email = '') {
  setPage('auth')
  const invite = store.get('join')
  $('#app').innerHTML = `<div class="auth">
    <aside class="auth-brand">
      <div class="logo">${LOGO}<span>Kanban</span></div>
      <h1>Organize o trabalho do seu time, do seu jeito.</h1>
      <ul>${['Quadros privados ou compartilhados por link', 'Arraste cards no computador e no celular', 'Atualização em tempo real para todo o time', 'API para o Claude criar e mover cards']
        .map(t => `<li>${icon('check')}${t}</li>`).join('')}</ul>
      <div class="auth-art" aria-hidden="true"><div><i></i><i></i><i class="s"></i></div><div><i class="s"></i><i></i></div><div><i></i><i class="s"></i><i></i></div></div>
    </aside>
    <section class="auth-main"><form id="auth" class="auth-card">
      ${mode === 'reset' ? `<button type="button" class="link" data-mode="in">${icon('left')}Voltar para o login</button>`
        : `<div class="seg"><button type="button" data-mode="in" class="${mode === 'in' ? 'active' : ''}">Entrar</button><button type="button" data-mode="up" class="${mode === 'up' ? 'active' : ''}">Criar conta</button></div>`}
      <div><h2>${{ in: 'Bem-vindo de volta', up: 'Crie sua conta', reset: 'Recuperar senha' }[mode]}</h2>
        <p class="muted">${{ in: 'Entre para ver seus quadros.', up: 'Leva menos de um minuto.', reset: 'Enviaremos um link para você criar uma nova senha.' }[mode]}</p></div>
      ${invite ? `<p class="note">${icon('users')}Você foi convidado para um quadro. ${mode === 'up' ? 'Crie sua conta' : 'Entre'} para aceitar.</p>` : ''}
      ${mode === 'up' ? field('Nome', '<input name="name" required maxlength="60" autocomplete="name" placeholder="Como você quer ser chamado">') : ''}
      ${field('Email', `<input name="email" type="email" required autocomplete="email" placeholder="voce@email.com" value="${esc(email)}">`)}
      ${mode === 'reset' ? '' : field('Senha', `<div class="pw"><input name="password" type="password" minlength="6" required autocomplete="${mode === 'up' ? 'new-password' : 'current-password'}" placeholder="Mínimo 6 caracteres"><button type="button" class="btn icon subtle sm" data-eye aria-label="Mostrar senha">${icon('eye')}</button></div>`)}
      ${mode === 'in' ? '<button type="button" class="link end" data-mode="reset">Esqueci minha senha</button>' : ''}
      <button class="btn primary lg block">${{ in: 'Entrar', up: 'Criar conta', reset: 'Enviar link' }[mode]}</button>
      <p id="authMsg" class="form-msg" role="status"></p>
    </form></section></div>`
  const f = $('#auth')
  f.onclick = e => {
    const m = e.target.closest('[data-mode]')
    if (m) return showAuth(m.dataset.mode, f.elements.email.value)
    if (e.target.closest('[data-eye]')) { const p = f.elements.password; p.type = p.type === 'password' ? 'text' : 'password' }
  }
  f.onsubmit = async e => {
    e.preventDefault()
    const { email, password, name } = Object.fromEntries(new FormData(f)), btn = $('button.primary', f), msg = $('#authMsg')
    btn.disabled = true
    const { data, error } = await (mode === 'in' ? sb.auth.signInWithPassword({ email, password })
      : mode === 'up' ? sb.auth.signUp({ email, password, options: { data: { name: name.trim() }, emailRedirectTo: base } })
      : sb.auth.resetPasswordForEmail(email, { redirectTo: base }))
    btn.disabled = false
    msg.className = 'form-msg ' + (error ? 'error' : 'success')
    msg.textContent = error ? errMsg(error)
      : mode === 'reset' ? 'Pronto! Se o email tiver conta, você vai receber o link em instantes.'
      : mode === 'up' && !data.session ? 'Conta criada! Confirme pelo link que enviamos ao seu email e depois entre.' : ''
  }
  $('input', f).focus()
}

function showNewPassword() {
  setPage('auth')
  $('#app').innerHTML = `<div class="auth single"><section class="auth-main"><form id="auth" class="auth-card">
    <div class="logo">${LOGO}<span>Kanban</span></div>
    <div><h2>Crie uma nova senha</h2><p class="muted">Depois disso você já entra direto.</p></div>
    ${field('Nova senha', '<input name="password" type="password" minlength="6" required autocomplete="new-password" placeholder="Mínimo 6 caracteres">')}
    <button class="btn primary lg block">Salvar senha</button></form></section></div>`
  $('#auth').onsubmit = async e => {
    e.preventDefault()
    ok(await sb.auth.updateUser({ password: new FormData(e.target).get('password') }))
    recovering = false
    toast('Senha alterada!')
    route()
  }
}

// ─── início ────────────────────────────────────────────────────────────────────
const DUE_GROUPS = [
  { label: 'Atrasado', test: c => c.due_date && c.due_date < day() },
  { label: 'Hoje', test: c => c.due_date === day() },
  { label: 'Em breve', test: c => c.due_date > day() && c.due_date <= day(7) },
  { label: 'Mais tarde', test: c => c.due_date > day(7) },
  { label: 'Sem data', test: c => !c.due_date },
]
function groupMyCards(open, mode) {
  if (mode !== 'quadro') return DUE_GROUPS.map(g => ({ label: g.label, items: open.filter(g.test) })).filter(g => g.items.length)
  const byBoard = new Map()
  for (const c of open) byBoard.set(c.boards.name, [...(byBoard.get(c.boards.name) ?? []), c])
  return [...byBoard].sort((a, b) => a[0].localeCompare(b[0])).map(([label, items]) => ({ label, items }))
}
const myCardRow = c => `<a class="row" href="#/b/${c.board_id}/${c.number}">
  ${typeIcon(c.type)}<span class="key">${esc(c.boards.key)}-${c.number}</span><span class="title">${esc(c.title)}</span>
  <span class="chip" style="--c:${esc(c.boards.color)}">${esc(c.boards.name)}</span><span class="status">${esc(c.columns?.name)}</span>
  ${dueChip(c.due_date)}${prioIcon(c.priority)}</a>`
const renderMyCards = open => !open.length ? empty('check', 'Nada pendente', 'Cards atribuídos a você em qualquer quadro aparecem aqui.')
  : groupMyCards(open, store.get('myGroup') || 'prazo').map(g => `<h3 class="section-title">${esc(g.label)} <span class="count">${g.items.length}</span></h3>
      <div class="list">${g.items.map(myCardRow).join('')}</div>`).join('')

async function showHome() {
  const n = nav
  board = null
  setPage('home')
  renderTop()
  $('#app').innerHTML = `<div class="home"><div class="sk" style="height:56px;width:min(360px,100%)"></div>
    <div class="board-grid">${'<div class="sk" style="height:150px"></div>'.repeat(4)}</div></div>`
  const [boards, mine] = (await Promise.all([
    sb.from('boards').select('id, name, key, color, owner, board_members(count), cards(count)').order('created_at'),
    sb.from('cards').select('id, number, title, type, priority, due_date, board_id, boards(key, name, color), columns(name, done)')
      .eq('assignee', me.id).order('due_date', { ascending: true, nullsFirst: false }),
  ])).map(ok)
  if (n !== nav) return
  const open = mine.filter(c => !c.columns?.done), late = open.filter(c => c.due_date && c.due_date < day()).length
  $('#app').innerHTML = `<div class="home">
    <header class="home-head"><div><h1>Olá, ${esc(profile.name.split(' ')[0])}!</h1>
      <p class="muted">${open.length ? `Você tem ${open.length} ${open.length === 1 ? 'card pendente' : 'cards pendentes'}${late ? `, <b class="late-txt">${late} ${late === 1 ? 'atrasado' : 'atrasados'}</b>` : ''}.` : 'Tudo em dia por aqui.'}</p></div>
      <button class="btn primary" data-home="new">${icon('plus')}Criar quadro</button></header>
    <section><h2 class="section-title">Seus quadros <span class="count">${boards.length}</span></h2>
      <div class="board-grid">${boards.map(b => `<a class="board-tile" href="#/b/${b.id}" style="--c:${esc(b.color)}">
        <div class="band"><span class="key">${esc(b.key)}</span>${b.owner === me.id ? '' : '<span class="tag">Compartilhado</span>'}</div>
        <div class="tile-body"><strong>${esc(b.name)}</strong><span class="tile-meta"><span>${icon('cards')}${b.cards[0]?.count ?? 0} cards</span><span>${icon('users')}${b.board_members[0]?.count ?? 0}</span></span></div></a>`).join('')}
        <button class="board-tile new" data-home="new">${icon('plus')}Criar quadro</button></div></section>
    <section><div class="section-title-row"><h2 class="section-title">Atribuídos a mim <span class="count">${open.length}</span></h2>
        <select id="myGroupMode" class="select-sm" aria-label="Agrupar por" ${open.length ? '' : 'hidden'}>
          <option value="prazo">Agrupar por prazo</option><option value="quadro">Agrupar por quadro</option></select></div>
      <div id="myCards">${renderMyCards(open)}</div></section></div>`
  $('#myGroupMode').value = store.get('myGroup') || 'prazo'
  $('#myGroupMode').onchange = e => { store.set('myGroup', e.target.value); $('#myCards').innerHTML = renderMyCards(open) }
}

function openNewBoard() {
  const d = modal(`<form><header class="modal-head"><h2>Criar quadro</h2>${closeBtn}</header><div class="modal-body">
    ${field('Nome do quadro', '<input name="name" required maxlength="80" placeholder="Ex.: Marketing, App mobile, Sprint 12">')}
    ${field('Sigla <small>(prefixo dos cards, ex.: MKT-12)</small>', '<input name="key" required pattern="[A-Z][A-Z0-9]{1,9}" maxlength="10" placeholder="MKT" title="2 a 10 letras/números, começando com letra">')}
    <div class="field"><span>Cor</span>${swatches(COLORS[0])}</div>
    </div><footer class="modal-foot"><button type="button" class="btn subtle" data-close>Cancelar</button><button class="btn primary">Criar quadro</button></footer></form>`, 'dlg-md')
  const f = $('form', d), { name, key } = f.elements
  let touched = false
  name.oninput = () => { if (!touched) key.value = suggestKey(name.value) }
  keyInput(key)
  key.addEventListener('input', () => { touched = true })
  name.focus()
  f.onsubmit = async e => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(f))
    const b = ok(await sb.from('boards').insert({ name: v.name.trim(), key: v.key, color: v.color }).select('id').single())
    d.close()
    location.hash = '#/b/' + b.id
  }
}

// ─── quadro ────────────────────────────────────────────────────────────────────
async function loadBoard(id, cardNumber) {
  const n = nav, first = board?.id !== id
  if (first) {
    board = null
    setPage('board')
    renderTop()
    $('#app').innerHTML = `<div class="board-page"><div class="board-head"><div class="sk" style="height:44px;width:260px"></div></div>
      <div class="board">${'<div class="col sk-col"><div class="sk"></div><div class="sk"></div><div class="sk"></div></div>'.repeat(3)}</div></div>`
  }
  let b, cols, cards, mem, sprints
  try {
    [b, cols, cards, mem, sprints] = (await Promise.all([
      sb.from('boards').select('*').eq('id', id).maybeSingle(),
      sb.from('columns').select('*').eq('board_id', id).order('position'),
      sb.from('cards').select('*, comments(count)').eq('board_id', id).order('position'),
      sb.from('board_members').select('user_id, role, profiles(id, name, email)').eq('board_id', id),
      sb.from('sprints').select('*').eq('board_id', id).order('created_at'),
    ])).map(ok)
  } catch { if (first && n === nav) location.hash = '#/'; return }
  if (n !== nav) return // usuário já navegou pra outra tela
  if (!b) { toast('Quadro não encontrado ou você não tem mais acesso.', 'error'); board = null; return location.hash = '#/' }
  if (first) { Object.assign(filters, { q: '', type: '', prio: '' }); filters.people.clear(); boardView = 'kanban' }
  board = {
    ...b, cols, sprints,
    cards: cards.map(({ comments, ...c }) => ({ ...c, ncomments: comments?.[0]?.count ?? 0 })),
    members: mem.map(m => ({ ...(m.profiles ?? { id: m.user_id, name: '?', email: '' }), role: m.role }))
      .sort((x, y) => (y.id === b.owner) - (x.id === b.owner) || x.name.localeCompare(y.name)),
  }
  renderBoard()
  if (openCardId && !card(openCardId)) { $('dialog.dlg-card')?.close(); toast('Este card foi excluído.') }
  if (cardNumber) {
    const k = board.cards.find(c => c.number === cardNumber)
    k ? openCardModal(k.id) : toast('Card não encontrado.', 'error')
  }
}

function renderBoard() {
  if ($('#app').dataset.board !== board.id) {
    setPage('board')
    $('#app').dataset.board = board.id
    renderTop()
    $('#app').innerHTML = `<div class="board-page">
      <header class="board-head" id="boardHead"></header>
      <nav class="tabs board-tabs"><button data-view="kanban">Quadro</button><button data-view="backlog">Backlog</button></nav>
      <div class="toolbar" id="toolbar">
        <label class="search">${icon('search')}<input id="q" type="search" placeholder="Buscar cards" aria-label="Buscar cards" autocomplete="off"><kbd class="kbd">/</kbd></label>
        <div class="people" id="people"></div>
        <select id="fType" class="select-sm" aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>${opts(TYPES)}</select>
        <select id="fPrio" class="select-sm" aria-label="Filtrar por prioridade"><option value="">Qualquer prioridade</option>${opts(PRIOS)}</select>
        <button class="btn subtle sm" id="clearF" hidden>${icon('x')}Limpar filtros</button>
      </div>
      <div class="board" id="board"></div>
      <div class="backlog" id="backlog" hidden></div></div>`
    Object.assign($('#q'), { value: filters.q, oninput: e => { filters.q = e.target.value; renderColumns() } })
    Object.assign($('#fType'), { value: filters.type, onchange: e => { filters.type = e.target.value; renderColumns() } })
    Object.assign($('#fPrio'), { value: filters.prio, onchange: e => { filters.prio = e.target.value; renderColumns() } })
    $('#clearF').onclick = () => {
      Object.assign(filters, { q: '', type: '', prio: '' })
      filters.people.clear()
      $('#q').value = $('#fType').value = $('#fPrio').value = ''
      renderPeople()
      renderColumns()
    }
    $('.board-tabs').onclick = e => {
      const b = e.target.closest('[data-view]')
      if (b) { boardView = b.dataset.view; renderView() }
    }
  }
  const extra = board.members.length - 5
  $('#boardHead').innerHTML = `<div class="board-title"><span class="board-icon" style="--c:${esc(board.color)}">${esc(board.key.slice(0, 3))}</span>
      <div class="min0"><nav class="crumb"><a href="#/">Quadros</a><span>/</span>${esc(board.key)}</nav><h1>${esc(board.name)}</h1></div></div>
    <div class="head-actions">
      <div class="avatar-stack" title="${board.members.length} membros">${board.members.slice(0, 5).map(m => avatar(m)).join('')}${extra > 0 ? `<span class="avatar more">+${extra}</span>` : ''}</div>
      <button class="btn" data-act="invite">${icon('userPlus')}<span class="hide-sm">Convidar</span></button>
      <button class="btn icon" data-act="settings" aria-label="Configurações do quadro" title="Configurações do quadro">${icon('settings')}</button></div>`
  renderPeople()
  renderView()
  $('dialog.dlg-settings')?.refresh?.()
}

function renderView() {
  $$('.board-tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === boardView))
  $('#toolbar').hidden = $('#board').hidden = boardView !== 'kanban'
  $('#backlog').hidden = boardView !== 'backlog'
  boardView === 'kanban' ? renderColumns() : renderBacklog()
}

function renderPeople() {
  $('#people').innerHTML = board.members.map(m => `<button class="person ${filters.people.has(m.id) ? 'on' : ''}" data-person="${m.id}"
    aria-pressed="${filters.people.has(m.id)}" title="Filtrar por ${esc(m.name)}">${avatar(m)}</button>`).join('')
}
const filtersOn = () => !!(filters.q.trim() || filters.people.size || filters.type || filters.prio)
const matches = k => (!filters.q.trim() || norm(`${board.key}-${k.number} ${k.title} ${k.labels.join(' ')}`).includes(norm(filters.q.trim())))
  && (!filters.people.size || filters.people.has(k.assignee)) && (!filters.type || k.type === filters.type) && (!filters.prio || k.priority === filters.prio)

function dueChip(d, done) {
  if (!d) return ''
  const cls = done ? 'ok' : d < day() ? 'late' : d <= day(1) ? 'soon' : ''
  return `<span class="due ${cls}" title="Entrega">${icon('calendar')}${d === day() ? 'Hoje' : d === day(1) ? 'Amanhã' : fmtDay(d)}</span>`
}

function cardHtml(k) {
  const a = member(k.assignee), done = board.cols.find(c => c.id === k.column_id)?.done, cl = k.checklist || [], ck = cl.filter(i => i.done).length
  return `<article class="card" data-card="${k.id}" tabindex="0">
    ${k.labels.length ? `<div class="labels">${k.labels.map(labelChip).join('')}</div>` : ''}
    <p class="card-title">${esc(k.title)}</p>
    <div class="card-foot">${typeIcon(k.type)}<span class="key ${done ? 'done' : ''}">${esc(board.key)}-${k.number}</span>
      ${dueChip(k.due_date, done)}
      ${cl.length ? `<span class="meta ${ck === cl.length ? 'ok' : ''}" title="Checklist">${icon('checklist')}${ck}/${cl.length}</span>` : ''}
      ${k.ncomments ? `<span class="meta" title="Comentários">${icon('comment')}${k.ncomments}</span>` : ''}
      <span class="grow"></span>
      ${k.points != null ? `<span class="points" title="Pontos">${k.points}</span>` : ''}${prioIcon(k.priority)}${a ? avatar(a, 'sm') : ''}</div></article>`
}

const addCardBtn = `<button class="btn subtle block add-card" data-act="addCard">${icon('plus')}Criar card</button>`
const addColBtn = `<button class="btn add-col-btn" data-act="addCol">${icon('plus')}Adicionar coluna</button>`

function renderColumns() {
  const el = $('#board')
  if (!el || !board) return
  // preserva rolagem e o que estiver sendo digitado (o quadro é redesenhado a cada mudança)
  const keepX = el.scrollLeft, keepY = Object.fromEntries($$('.col', el).map(c => [c.dataset.col, $('.cards', c).scrollTop]))
  const comp = $('.composer', el), cta = comp && $('textarea', comp)
  const draft = comp && { col: comp.closest('[data-col]').dataset.col, value: cta.value, type: $('select', comp).value, focus: comp.contains(document.activeElement), sel: [cta.selectionStart, cta.selectionEnd] }
  const colInput = $('#addCol input'), colDraft = colInput && { value: colInput.value, sel: [colInput.selectionStart, colInput.selectionEnd] }
  const ren = $('.inline-input', el), renDraft = ren && { col: ren.closest('[data-col]').dataset.col, value: ren.value, sel: [ren.selectionStart, ren.selectionEnd] }
  if (ren) ren.onblur = null
  sortables.forEach(s => s.destroy())
  sortables = []
  const vis = board.cards.filter(matches), editable = canEdit()
  el.innerHTML = board.cols.map(c => {
    const total = board.cards.filter(k => k.column_id === c.id).length
    return `<section class="col ${c.done ? 'done' : ''} ${c.wip_limit && total > c.wip_limit ? 'over' : ''}" data-col="${c.id}">
      <header class="col-head">${c.done ? `<span class="done-ico" title="Coluna de concluído">${icon('check')}</span>` : ''}
        <h3 title="${editable ? 'Clique duas vezes para renomear' : ''}">${esc(c.name)}</h3>
        <span class="count" title="${c.wip_limit ? 'Cards / limite WIP' : 'Cards'}">${total}${c.wip_limit ? ' / ' + c.wip_limit : ''}</span>
        ${editable ? `<button class="btn icon subtle sm" data-act="colMenu" aria-label="Opções da coluna ${esc(c.name)}">${icon('more')}</button>` : ''}</header>
      <div class="cards">${vis.filter(k => k.column_id === c.id).map(cardHtml).join('')}</div>
      <footer class="col-foot">${editable ? addCardBtn : ''}</footer></section>`
  }).join('') + (editable ? `<div class="add-col" id="addCol">${addColBtn}</div>` : '')
  el.scrollLeft = keepX
  for (const c of $$('.col', el)) $('.cards', c).scrollTop = keepY[c.dataset.col] ?? 0
  if (draft) {
    openComposer(draft.col, draft.value, draft.type, draft.focus)
    if (draft.focus) $('.composer textarea', el)?.setSelectionRange(...draft.sel)
  }
  if (colDraft) openAddCol(colDraft.value)?.setSelectionRange(...colDraft.sel)
  const renCol = renDraft && board.cols.find(c => c.id === renDraft.col)
  if (renCol) renameColInline(renCol, renDraft.value)?.setSelectionRange(...renDraft.sel)
  $('#clearF').hidden = !filtersOn()
  if (!editable) return // somente leitura: sem arrastar, sem editar coluna
  const common = { animation: 160, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 4, delay: 200, delayOnTouchOnly: true,
    onStart: () => { dragging = true; closeMenu() } }
  for (const list of $$('.cards', el))
    sortables.push(Sortable.create(list, { ...common, group: 'cards', ghostClass: 'ghost', dragClass: 'drag', fallbackClass: 'drag', onEnd: onCardDrop }))
  sortables.push(Sortable.create(el, { ...common, draggable: '.col', handle: '.col-head', filter: 'button, input', preventOnFilter: false,
    ghostClass: 'ghost-col', dragClass: 'drag', fallbackClass: 'drag', onEnd: onColDrop }))
}

function onCardDrop(e) {
  dragging = false
  justDragged = Date.now()
  if (e.from === e.to && e.oldIndex === e.newIndex) return
  const k = card(e.item.dataset.card), col = board.cols.find(c => c.id === e.to.closest('[data-col]').dataset.col)
  const pos = el => card(el?.dataset.card)?.position
  Object.assign(k, { column_id: col.id, position: between(pos(e.item.previousElementSibling), pos(e.item.nextElementSibling)) })
  board.cards.sort((a, b) => a.position - b.position)
  setTimeout(renderColumns) // depois que o Sortable terminar
  if (col.wip_limit && board.cards.filter(c => c.column_id === col.id).length > col.wip_limit) toast(`"${col.name}" passou do limite WIP (${col.wip_limit}).`, 'warn')
  patch('cards', k.id, { column_id: col.id, position: k.position })
}

function onColDrop(e) {
  dragging = false
  justDragged = Date.now()
  if (e.oldIndex === e.newIndex) return
  const col = board.cols.find(c => c.id === e.item.dataset.col), pos = el => board.cols.find(c => c.id === el?.dataset.col)?.position
  setTimeout(() => updateCol(col, { position: between(pos(e.item.previousElementSibling), pos(e.item.nextElementSibling)) }))
}

function openComposer(colId, value = '', type = 'tarefa', focus = true) {
  closeComposer()
  const foot = $(`[data-col="${colId}"] .col-foot`)
  if (!foot) return
  foot.innerHTML = `<form class="composer"><textarea rows="2" maxlength="200" placeholder="O que precisa ser feito?" aria-label="Título do novo card">${esc(value)}</textarea>
    <div class="composer-row"><select class="select-sm" aria-label="Tipo">${opts(TYPES, type)}</select><span class="grow"></span>
    <button type="button" class="btn subtle sm" data-cancel>Cancelar</button><button class="btn primary sm">Criar</button></div></form>`
  const f = $('form', foot), ta = $('textarea', f)
  if (focus) { ta.focus(); ta.setSelectionRange(value.length, value.length) }
  ta.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit() }
    else if (e.key === 'Escape') closeComposer()
  }
  $('[data-cancel]', f).onclick = closeComposer
  f.onsubmit = async e => {
    e.preventDefault()
    const title = ta.value.trim()
    if (!title) return ta.focus()
    ta.value = ''
    const { data, error } = await sb.from('cards').insert({ board_id: board.id, column_id: colId, title, type: $('select', f).value }).select('*').single()
    if (error) { ta.value = title; return toast(errMsg(error), 'error') }
    board.cards.push({ ...data, ncomments: 0 })
    renderColumns()
    const list = $(`[data-col="${colId}"] .cards`)
    list.scrollTop = list.scrollHeight
  }
}
const closeComposer = () => $$('.composer').forEach(f => { f.closest('.col-foot').innerHTML = addCardBtn })

function openAddCol(value = '') {
  const w = $('#addCol')
  w.innerHTML = `<form class="add-col-form"><input maxlength="40" placeholder="Nome da coluna" aria-label="Nome da nova coluna" value="${esc(value)}">
    <div class="composer-row"><button class="btn primary sm">Adicionar</button><button type="button" class="btn subtle sm" data-cancel>Cancelar</button></div></form>`
  const f = $('form', w), input = $('input', f), close = () => { w.innerHTML = addColBtn }
  input.focus()
  input.onkeydown = e => e.key === 'Escape' && close()
  $('[data-cancel]', f).onclick = close
  f.onsubmit = async e => {
    e.preventDefault()
    const name = input.value.trim()
    if (!name) return
    input.value = ''
    const { data, error } = await sb.from('columns').insert({ board_id: board.id, name }).select('*').single()
    if (error) { input.value = name; return toast(errMsg(error), 'error') }
    board.cols.push(data)
    renderColumns()
    $('#board').scrollLeft = 1e6
  }
  return input
}

function renameColInline(col, value = col.name) {
  const h = $(`[data-col="${col.id}"] h3`)
  if (!h) return
  const input = Object.assign(document.createElement('input'), { className: 'inline-input', value, maxLength: 40 })
  h.replaceWith(input)
  input.focus()
  input.select()
  let done = false
  const finish = save => {
    if (done) return
    done = true
    const name = input.value.trim()
    if (save && name && name !== col.name) { col.name = name; patch('columns', col.id, { name }) }
    input.className = '' // senão o renderColumns reabre a edição
    renderColumns()
  }
  input.onkeydown = e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false) }
  input.onblur = () => finish(true)
  return input
}

function updateCol(col, values) {
  Object.assign(board.cols.find(c => c.id === col.id) ?? col, values) // o quadro pode ter recarregado desde o clique
  board.cols.sort((a, b) => a.position - b.position)
  renderColumns()
  patch('columns', col.id, values)
}

function colMenu(anchor, col) {
  const i = board.cols.indexOf(col), c = board.cols
  menu(anchor, [
    { icon: 'edit', label: 'Renomear', action: () => renameColInline(col) },
    { icon: 'limit', label: col.wip_limit ? `Limite WIP: ${col.wip_limit}` : 'Definir limite WIP', action: () => setWip(col) },
    { icon: 'check', label: col.done ? 'Desmarcar como concluído' : 'Marcar como coluna de concluído', action: () => updateCol(col, { done: !col.done }) },
    i > 0 && { icon: 'left', label: 'Mover para a esquerda', action: () => updateCol(col, { position: between(c[i - 2]?.position, c[i - 1].position) }) },
    i < c.length - 1 && { icon: 'right', label: 'Mover para a direita', action: () => updateCol(col, { position: between(c[i + 1].position, c[i + 2]?.position) }) },
    '-',
    { icon: 'trash', label: 'Excluir coluna', danger: true, action: () => deleteCol(col) },
  ].filter(Boolean))
}

async function setWip(col) {
  const v = await formModal(`Limite WIP · ${esc(col.name)}`, `<p class="muted">Máximo de cards nesta coluna. Acima disso ela fica vermelha, sinal de gargalo. Deixe vazio para não ter limite.</p>
    ${field('Limite', `<input name="wip" type="number" min="1" max="999" value="${col.wip_limit ?? ''}" placeholder="Sem limite">`)}`)
  if (v) updateCol(col, { wip_limit: v.wip ? +v.wip : null })
}

async function deleteCol(col) {
  const n = board.cards.filter(k => k.column_id === col.id).length
  if (n) return toast(`Mova ou exclua ${n === 1 ? 'o card' : `os ${n} cards`} de "${col.name}" antes.`, 'error')
  if (!await ask('Excluir coluna?', `A coluna "${col.name}" será removida do quadro.`)) return
  board.cols = board.cols.filter(c => c.id !== col.id)
  renderColumns()
  const { error } = await sb.from('columns').delete().eq('id', col.id)
  if (error) toast(errMsg(error), 'error')
  scheduleReload()
}

// ─── backlog e sprints (não muda o que aparece no quadro kanban) ───────────────
function backlogRow(k, editable) {
  return `<div class="row" data-card="${k.id}">${typeIcon(k.type)}<span class="key">${esc(board.key)}-${k.number}</span><span class="title">${esc(k.title)}</span>
    ${dueChip(k.due_date)}${prioIcon(k.priority)}
    ${editable ? `<select class="select-sm" data-move="${k.id}" aria-label="Mover \"${esc(k.title)}\"">
      <option value="">Backlog</option>${board.sprints.filter(s => s.status !== 'closed').map(s => `<option value="${s.id}" ${s.id === k.sprint_id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
    </select>` : ''}</div>`
}
function renderBacklog() {
  const el = $('#backlog')
  if (!el || !board) return
  const editable = canEdit()
  const active = board.sprints.find(s => s.status === 'active')
  const open = [active, ...board.sprints.filter(s => s.status === 'planned')].filter(Boolean)
  const backlogCards = board.cards.filter(c => !c.sprint_id)
  const sprintSection = s => {
    const cards = board.cards.filter(c => c.sprint_id === s.id)
    return `<section class="sprint" data-sprint="${s.id}"><div class="sprint-head"><h3 class="section-title">${esc(s.name)}
        <span class="badge ${s.status === 'active' ? '' : 'muted'}">${s.status === 'active' ? 'Ativo' : 'Planejado'}</span> <span class="count">${cards.length}</span></h3>
        ${editable ? `<div class="row-actions">
          ${s.status === 'planned' && !active ? `<button class="btn subtle sm" data-act="sprintStart">${icon('flag')}Iniciar sprint</button>` : ''}
          ${s.status === 'active' ? `<button class="btn subtle sm" data-act="sprintComplete">${icon('check')}Concluir sprint</button>` : ''}
          <button class="btn icon subtle sm" data-act="sprintDelete" aria-label="Excluir sprint ${esc(s.name)}">${icon('trash')}</button></div>` : ''}</div>
      ${cards.length ? `<div class="list">${cards.map(k => backlogRow(k, editable)).join('')}</div>` : '<p class="muted small">Nenhum card neste sprint ainda.</p>'}</section>`
  }
  el.innerHTML = `${editable ? `<div class="backlog-actions"><button class="btn primary" data-act="sprintNew">${icon('plus')}Criar sprint</button></div>` : ''}
    ${open.length ? open.map(sprintSection).join('') : '<p class="muted">Nenhum sprint criado ainda.</p>'}
    <section class="sprint"><div class="sprint-head"><h3 class="section-title">Backlog <span class="count">${backlogCards.length}</span></h3></div>
      ${backlogCards.length ? `<div class="list">${backlogCards.map(k => backlogRow(k, editable)).join('')}</div>` : empty('cards', 'Backlog vazio', 'Cards sem sprint aparecem aqui.')}</section>`
}
$('#app').addEventListener('change', e => {
  const id = e.target.dataset.move
  if (!id) return
  const sprint_id = e.target.value || null
  card(id).sprint_id = sprint_id
  patch('cards', id, { sprint_id })
  renderBacklog()
})

async function newSprint() {
  const v = await formModal('Criar sprint', field('Nome', '<input name="name" required maxlength="60" placeholder="Ex.: Sprint 1">'), 'Criar')
  if (!v?.name.trim()) return
  const { data, error } = await sb.from('sprints').insert({ board_id: board.id, name: v.name.trim() }).select('*').single()
  if (error) return toast(errMsg(error), 'error')
  board.sprints.push(data)
  renderBacklog()
}
async function startSprint(s) {
  const { error } = await sb.from('sprints').update({ status: 'active' }).eq('id', s.id)
  if (error) return toast(errMsg(error), 'error')
  s.status = 'active'
  renderBacklog()
}
async function completeSprint(s) {
  if (!await ask('Concluir sprint?', `Cards não concluídos de "${s.name}" voltam pro backlog.`, 'Concluir', false)) return
  const doneCols = new Set(board.cols.filter(c => c.done).map(c => c.id))
  const unfinished = board.cards.filter(c => c.sprint_id === s.id && !doneCols.has(c.column_id))
  if (unfinished.length) {
    ok(await sb.from('cards').update({ sprint_id: null }).in('id', unfinished.map(c => c.id)))
    unfinished.forEach(c => { c.sprint_id = null })
  }
  ok(await sb.from('sprints').update({ status: 'closed' }).eq('id', s.id))
  s.status = 'closed'
  renderBacklog()
}
async function deleteSprint(s) {
  if (!await ask('Excluir sprint?', `"${s.name}" será excluído; os cards voltam pro backlog.`)) return
  const { error } = await sb.from('sprints').delete().eq('id', s.id)
  if (error) return toast(errMsg(error), 'error')
  board.sprints = board.sprints.filter(x => x.id !== s.id)
  board.cards.forEach(c => { if (c.sprint_id === s.id) c.sprint_id = null })
  renderBacklog()
}

// cliques, duplo clique e teclado no quadro/início
$('#app').addEventListener('click', e => {
  if (e.target.closest('select, input, textarea')) return // controle de formulário dentro de uma linha não deve "abrir o card"
  const t = e.target.closest('[data-act], [data-card], [data-person], [data-home]')
  if (!t || Date.now() - justDragged < 250) return
  if (t.dataset.home) return openNewBoard()
  if (!board) return
  if (t.dataset.card) return openCardModal(t.dataset.card)
  if (t.dataset.person) {
    const p = t.dataset.person
    filters.people.has(p) ? filters.people.delete(p) : filters.people.add(p)
    renderPeople()
    return renderColumns()
  }
  const col = board.cols.find(c => c.id === t.closest('[data-col]')?.dataset.col)
  const sprint = board.sprints.find(s => s.id === t.closest('[data-sprint]')?.dataset.sprint)
  const acts = {
    invite: () => openSettings('membros'), settings: () => openSettings(), addCol: () => openAddCol(), addCard: () => openComposer(col.id), colMenu: () => colMenu(t, col),
    sprintNew: newSprint, sprintStart: () => startSprint(sprint), sprintComplete: () => completeSprint(sprint), sprintDelete: () => deleteSprint(sprint),
  }
  acts[t.dataset.act]?.()
})
$('#app').addEventListener('dblclick', e => {
  const h = e.target.closest('.col-head h3')
  if (h && board && canEdit()) renameColInline(board.cols.find(c => c.id === h.closest('[data-col]').dataset.col))
})
$('#app').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches?.('[data-card]')) openCardModal(e.target.dataset.card) })
addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu()
  if (!board || e.target.closest?.('input, textarea, select') || $('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === '/') { e.preventDefault(); $('#q')?.focus() }
  else if (e.key === 'c' && canEdit() && board.cols[0]) { e.preventDefault(); openComposer(board.cols[0].id) }
})

// ─── card (detalhes) ───────────────────────────────────────────────────────────
function openCardModal(id) {
  const k0 = card(id)
  if (!k0) return
  $('dialog.dlg-card')?.close()
  openCardId = id
  history.replaceState(null, '', `#/b/${board.id}/${k0.number}`)
  const creator = member(k0.created_by), editable = canEdit()
  const dis = editable ? '' : 'disabled'
  const d = modal(`<header class="cm-head">
      <div class="cm-crumb"><span id="cmType">${typeIcon(k0.type)}</span><span>${esc(board.key)}-${k0.number}</span><small id="saveState" role="status"></small></div>
      <div class="cm-actions">
        <button class="btn icon subtle" data-cm="link" aria-label="Copiar link do card" title="Copiar link">${icon('link')}</button>
        ${editable ? `<button class="btn icon subtle" data-cm="more" aria-label="Mais ações" title="Mais ações">${icon('more')}</button>` : ''}${closeBtn}</div></header>
    <div class="cm-grid">
      <textarea class="cm-title" data-f="title" rows="1" maxlength="200" aria-label="Título" ${editable ? '' : 'readonly'}>${esc(k0.title)}</textarea>
      <aside class="cm-side">
        <div class="details"><h4>Detalhes</h4>
          ${detail('Status', `<select data-f="column_id" aria-label="Status" ${dis}>${board.cols.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`)}
          ${detail('Responsável', `<select data-f="assignee" aria-label="Responsável" ${dis}><option value="">Sem responsável</option>${board.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>`)}
          ${editable ? detail('', '<button type="button" class="link small" data-cm="me">Atribuir a mim</button>') : ''}
          ${detail('Prioridade', `<select data-f="priority" aria-label="Prioridade" ${dis}>${opts(PRIOS)}</select>`)}
          ${detail('Tipo', `<select data-f="type" aria-label="Tipo" ${dis}>${opts(TYPES)}</select>`)}
          ${detail('Entrega', `<input type="date" data-f="due_date" aria-label="Data de entrega" ${dis}>`)}
          ${detail('Pontos', `<input type="number" data-f="points" min="0" max="999" placeholder="Nenhum" aria-label="Pontos" ${dis}>`)}
          ${detail('Etiquetas', '<div class="labels-edit" id="labelsEdit"></div>')}
        </div>
        <p class="cm-meta">${creator ? `Criado por ${esc(creator.name)} ` : 'Criado '}${ago(k0.created_at)}<br>Atualizado ${ago(k0.updated_at)}</p>
      </aside>
      <div class="cm-main">
        <section><h4>Descrição</h4><textarea class="cm-desc" data-f="description" placeholder="Adicione detalhes, critérios de aceite, links…" aria-label="Descrição" ${editable ? '' : 'readonly'}>${esc(k0.description)}</textarea></section>
        <section><h4>${icon('paperclip')}Anexos</h4>
          ${editable ? `<input type="file" id="fileInput" multiple hidden><button type="button" class="btn subtle sm" id="attachBtn">${icon('paperclip')}Anexar arquivo</button>` : ''}
          <ul class="member-list" id="attachments"><li><div class="spinner"></div></li></ul></section>
        <section><h4>${icon('checklist')}Checklist <small id="clCount"></small></h4>
          <div class="progress" id="clBar"><span></span></div><ul class="checklist" id="checklist"></ul>
          ${editable ? '<form class="inline-form" id="clAdd"><input placeholder="Adicionar item" maxlength="200" aria-label="Novo item do checklist"><button class="btn sm">Adicionar</button></form>' : ''}</section>
        <section><h4>${icon('comment')}Comentários</h4>
          <form class="comment-add" id="cAdd">${avatar(profile)}<div><textarea rows="2" placeholder="Escreva um comentário… (Ctrl+Enter envia)" aria-label="Novo comentário"></textarea><button class="btn primary sm">Comentar</button></div></form>
          <ul class="comments" id="comments"><li><div class="spinner"></div></li></ul></section>
      </div></div>`, 'dlg-card')
  const F = n => $(`[data-f="${n}"]`, d), cur = () => card(id)
  const FIELDS = ['column_id', 'assignee', 'priority', 'type', 'due_date', 'points']
  for (const n of FIELDS) F(n).value = k0[n] ?? ''

  const save = async values => {
    const k = cur()
    if (!k) return
    Object.assign(k, values)
    renderColumns()
    const s = $('#saveState', d)
    s.textContent = 'Salvando…'
    s.textContent = await patch('cards', id, values) ? 'Salvo ✓' : ''
    setTimeout(() => { if (s.textContent === 'Salvo ✓') s.textContent = '' }, 2000)
  }
  for (const n of FIELDS) F(n).onchange = () => {
    const v = F(n).value
    save({ [n]: n === 'points' ? (v === '' ? null : Math.max(0, Math.min(999, Math.round(+v)))) : v || null,
      ...(n === 'column_id' && { position: Date.now() / 1000 }) }) // mudou de status → vai pro fim da coluna
    if (n === 'type') $('#cmType', d).innerHTML = typeIcon(v)
  }

  const title = F('title'), desc = F('description')
  for (const ta of [title, desc]) { ta.addEventListener('input', () => grow(ta)); requestAnimationFrame(() => grow(ta)) }
  title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); title.blur() } }
  title.onblur = () => { const v = title.value.trim(); if (!v) title.value = cur()?.title ?? ''; else if (v !== cur()?.title) save({ title: v }) }
  desc.onblur = () => { if (cur() && desc.value !== cur().description) save({ description: desc.value }) }

  const renderCl = () => {
    const cl = cur()?.checklist ?? [], done = cl.filter(i => i.done).length, bar = $('#clBar', d)
    $('#clCount', d).textContent = cl.length ? `${done}/${cl.length}` : ''
    bar.hidden = !cl.length
    bar.classList.toggle('full', cl.length > 0 && done === cl.length)
    $('span', bar).style.width = (cl.length ? done / cl.length * 100 : 0) + '%'
    $('#checklist', d).innerHTML = cl.map((it, i) => `<li class="${it.done ? 'done' : ''}"><label><input type="checkbox" data-cl="${i}" ${it.done ? 'checked' : ''} ${dis}><span>${esc(it.text)}</span></label>
      ${editable ? `<button type="button" class="btn icon subtle sm" data-cl-del="${i}" aria-label="Remover item">${icon('x')}</button>` : ''}</li>`).join('')
  }
  const setCl = cl => { save({ checklist: cl }); renderCl() }
  $('#checklist', d).onchange = e => { const i = +e.target.dataset.cl; setCl(cur().checklist.map((it, j) => j === i ? { ...it, done: e.target.checked } : it)) }
  const clForm = $('#clAdd', d)
  if (clForm) clForm.onsubmit = e => {
    e.preventDefault()
    const input = $('input', e.target), text = input.value.trim()
    if (!text) return
    input.value = ''
    setCl([...cur().checklist, { text, done: false }])
  }

  const renderLabels = () => {
    const ls = cur()?.labels ?? [], sug = [...new Set(board.cards.flatMap(c => c.labels))].filter(l => !ls.includes(l))
    $('#labelsEdit', d).innerHTML = ls.map((l, i) => `<span class="label" style="--h:${hash(l) % 360}">${esc(l)}${editable ? `<button type="button" data-lbl-del="${i}" aria-label="Remover etiqueta ${esc(l)}">×</button>` : ''}</span>`).join('')
      + (editable ? `<input list="lblSug" maxlength="30" placeholder="${ls.length ? '' : 'Adicionar…'}" aria-label="Nova etiqueta"><datalist id="lblSug">${sug.map(l => `<option value="${esc(l)}">`).join('')}</datalist>` : '')
    const input = $('#labelsEdit input', d)
    if (!input) return
    input.onkeydown = e => {
      if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) { e.preventDefault(); addLabel(input.value) }
      else if (e.key === 'Backspace' && !input.value && ls.length) setLabels(ls.slice(0, -1))
    }
    input.onchange = () => input.value.trim() && addLabel(input.value)
  }
  const setLabels = ls => { save({ labels: ls }); renderLabels(); $('#labelsEdit input', d).focus() }
  const addLabel = v => {
    const l = v.replace(/,/g, '').trim().slice(0, 30), ls = cur().labels
    if (l && !ls.includes(l)) setLabels([...ls, l])
    else $('#labelsEdit input', d).value = ''
  }

  const cta = $('#cAdd textarea', d)
  cta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#cAdd', d).requestSubmit() }
  $('#cAdd', d).onsubmit = async e => {
    e.preventDefault()
    const body = cta.value.trim(), btn = $('#cAdd button', d)
    if (!body) return cta.focus()
    btn.disabled = true
    const { error } = await sb.from('comments').insert({ card_id: id, body })
    btn.disabled = false
    if (error) return toast(errMsg(error), 'error')
    cta.value = ''
    loadComments()
    const k = cur()
    if (k) { k.ncomments++; renderColumns() }
  }

  const attachPrefix = `${board.id}/${id}` // caminho no bucket: <board_id>/<card_id>/<uuid>__<nome original>
  async function loadAttachments() {
    const { data: files, error } = await sb.storage.from('attachments').list(attachPrefix)
    if (id !== openCardId) return
    if (error || !files?.length) return $('#attachments', d).innerHTML = error
      ? '<li class="muted small">Não foi possível carregar os anexos.</li>' : '<li class="muted small">Nenhum anexo ainda.</li>'
    const signed = await Promise.all(files.map(f => sb.storage.from('attachments').createSignedUrl(`${attachPrefix}/${f.name}`, 3600)))
    if (id !== openCardId) return
    $('#attachments', d).innerHTML = files.map((f, i) => `<li><span class="key-ico">${icon('paperclip')}</span><div>
        <strong><a href="${signed[i].data?.signedUrl ?? '#'}" target="_blank" rel="noopener noreferrer">${esc(f.name.replace(/^[0-9a-f-]{36}__/, ''))}</a></strong>
        <small>${fmtBytes(f.metadata?.size ?? 0)}</small></div>
      ${editable ? `<button class="btn subtle sm danger" data-attach-del="${esc(f.name)}">Remover</button>` : ''}</li>`).join('')
  }
  $('#attachBtn', d)?.addEventListener('click', () => $('#fileInput', d).click())
  $('#fileInput', d)?.addEventListener('change', async e => {
    const files = [...e.target.files]
    e.target.value = ''
    for (const file of files) {
      const { error } = await sb.storage.from('attachments').upload(`${attachPrefix}/${crypto.randomUUID()}__${file.name}`, file)
      if (error) toast(errMsg(error), 'error')
    }
    loadAttachments()
  })

  d.addEventListener('click', async e => {
    const t = e.target.closest('[data-cm], [data-cl-del], [data-lbl-del], [data-c-del], [data-attach-del]'), k = cur()
    if (!t || !k) return
    if (t.dataset.clDel) return setCl(k.checklist.filter((_, i) => i !== +t.dataset.clDel))
    if (t.dataset.lblDel) return setLabels(k.labels.filter((_, i) => i !== +t.dataset.lblDel))
    if (t.dataset.cDel) {
      if (!await ask('Excluir comentário?', 'Esta ação não pode ser desfeita.')) return
      ok(await sb.from('comments').delete().eq('id', t.dataset.cDel))
      loadComments()
      k.ncomments = Math.max(0, k.ncomments - 1)
      return renderColumns()
    }
    if (t.dataset.attachDel) {
      if (!await ask('Remover anexo?', 'Esta ação não pode ser desfeita.')) return
      const { error } = await sb.storage.from('attachments').remove([`${attachPrefix}/${t.dataset.attachDel}`])
      if (error) return toast(errMsg(error), 'error')
      return loadAttachments()
    }
    const a = t.dataset.cm
    if (a === 'me') { F('assignee').value = me.id; F('assignee').onchange() }
    if (a === 'link') { await navigator.clipboard.writeText(`${base}#/b/${board.id}/${k.number}`); toast('Link do card copiado.') }
    if (a === 'more') menu(t, [
      { icon: 'copy', label: 'Duplicar card', action: () => duplicateCard(k) },
      '-',
      { icon: 'trash', label: 'Excluir card', danger: true, action: () => deleteCard(k, d) },
    ])
  })
  d.addEventListener('close', () => {
    if (openCardId === id) openCardId = null
    if (board && location.hash.startsWith(`#/b/${board.id}/`)) history.replaceState(null, '', '#/b/' + board.id)
  })
  renderCl()
  renderLabels()
  loadComments()
  loadAttachments()
}

async function loadComments() {
  const id = openCardId, d = $('dialog.dlg-card')
  if (!id || !d) return
  const { data: cs, error } = await sb.from('comments').select('id, body, created_at, author, profiles(id, name)').eq('card_id', id).order('created_at', { ascending: false })
  if (error || id !== openCardId) return
  $('#comments', d).innerHTML = cs.map(c => `<li data-comment="${c.id}">${avatar(c.profiles)}<div>
      <div class="c-head"><strong>${esc(c.profiles?.name ?? 'Ex-membro')}</strong><small title="${new Date(c.created_at).toLocaleString('pt-BR')}">${ago(c.created_at)}</small>
        ${c.author === me.id ? `<button type="button" class="link danger small" data-c-del="${c.id}">Excluir</button>` : ''}</div>
      <p>${linkify(esc(c.body))}</p></div></li>`).join('') || '<li class="muted small">Nenhum comentário ainda.</li>'
}

async function duplicateCard(k) {
  const { column_id, description, type, priority, labels, checklist, points, due_date, assignee } = k
  const { data, error } = await sb.from('cards').insert({ board_id: board.id, column_id, title: `${k.title} (cópia)`.slice(0, 200), description, type, priority, labels, checklist, points, due_date, assignee }).select('*').single()
  if (error) return toast(errMsg(error), 'error')
  if (assignee) markMine(data.id) // já nasce atribuído; não é uma atribuição nova pra notificar
  board.cards.push({ ...data, ncomments: 0 })
  renderColumns()
  toast(`${board.key}-${data.number} criado.`)
}

async function deleteCard(k, d) {
  if (!await ask('Excluir card?', `${board.key}-${k.number} "${k.title}" e seus comentários serão apagados para todos.`)) return
  const { error } = await sb.from('cards').delete().eq('id', k.id)
  if (error) return toast(errMsg(error), 'error')
  d.close()
  board.cards = board.cards.filter(c => c.id !== k.id)
  renderColumns()
  toast(`${board.key}-${k.number} excluído.`)
  scheduleReload()
}

// ─── configurações do quadro, perfil e API ─────────────────────────────────────
function openSettings(tab = 'geral') {
  const d = modal(`<header class="modal-head"><h2>Configurações do quadro</h2>${closeBtn}</header>
    <nav class="tabs"><button data-tab="geral">Geral</button><button data-tab="membros">Membros e convite</button></nav>
    <div class="modal-body" id="setBody"></div>`, 'dlg-md dlg-settings')
  const show = t => {
    tab = t
    $$('[data-tab]', d).forEach(b => b.classList.toggle('active', b.dataset.tab === t))
    $('#setBody', d).innerHTML = t === 'geral' ? settingsGeneral() : settingsMembers()
    const f = $('#boardForm', d)
    if (!f) return
    keyInput(f.elements.key)
    f.onsubmit = async e => {
      e.preventDefault()
      const v = Object.fromEntries(new FormData(f)), values = { name: v.name.trim(), key: v.key, color: v.color }
      const { error } = await sb.from('boards').update(values).eq('id', board.id)
      if (error) return toast(errMsg(error), 'error')
      Object.assign(board, values)
      renderBoard()
      toast('Quadro atualizado.')
    }
  }
  d.refresh = () => tab === 'membros' && show('membros')
  d.addEventListener('change', async e => {
    const id = e.target.dataset.role
    if (!id) return
    ok(await sb.from('board_members').update({ role: e.target.value }).eq('board_id', board.id).eq('user_id', id))
    await loadBoard(board.id)
    show('membros')
    toast('Papel atualizado.')
  })
  d.addEventListener('click', async e => {
    const t = e.target.closest('[data-tab], [data-set]')
    if (!t) return
    if (t.dataset.tab) return show(t.dataset.tab)
    const a = t.dataset.set, who = member(t.dataset.arg)
    if (a === 'copy') { await navigator.clipboard.writeText($('#inviteLink', d).value); return toast('Link copiado! Envie para quem você quer convidar.') }
    if (a === 'invite' || a === 'invite-off') {
      const had = board.invite_token
      ok(await sb.from('boards').update({ invite_token: a === 'invite' ? crypto.randomUUID() : null }).eq('id', board.id))
      await loadBoard(board.id)
      show('membros')
      return toast(a === 'invite-off' ? 'Link desativado. O quadro voltou a ser privado.' : had ? 'Novo link gerado. O anterior parou de funcionar.' : 'Link de convite gerado.')
    }
    if (a === 'remove' && await ask('Remover membro?', `${who?.name} perde o acesso a este quadro.`, 'Remover')) {
      ok(await sb.from('board_members').delete().eq('board_id', board.id).eq('user_id', who.id))
      await loadBoard(board.id)
      return show('membros')
    }
    if (a === 'leave' && await ask('Sair do quadro?', 'Você perde o acesso até ser convidado de novo.', 'Sair do quadro')) {
      ok(await sb.from('board_members').delete().eq('board_id', board.id).eq('user_id', me.id))
      d.close(); board = null; location.hash = '#/'
    }
    if (a === 'delete' && await ask('Excluir quadro?', `"${board.name}", com todas as colunas, cards e comentários, será apagado para todos os membros. Não dá para desfazer.`, 'Excluir quadro')) {
      ok(await sb.from('boards').delete().eq('id', board.id))
      d.close(); board = null; location.hash = '#/'
      toast('Quadro excluído.')
    }
  })
  show(tab)
}

const settingsGeneral = () => board.owner !== me.id
  ? `<p class="muted">Só o dono (${esc(member(board.owner)?.name)}) pode alterar nome, sigla e cor.</p>
    <div class="danger-zone"><div><strong>Sair do quadro</strong><p>Você perde o acesso até ser convidado de novo.</p></div><button class="btn danger" data-set="leave">Sair</button></div>`
  : `<form id="boardForm" class="stack">
      ${field('Nome', `<input name="name" required maxlength="80" value="${esc(board.name)}">`)}
      ${field('Sigla dos cards', `<input name="key" required pattern="[A-Z][A-Z0-9]{1,9}" maxlength="10" value="${esc(board.key)}" title="2 a 10 letras/números, começando com letra">`)}
      <div class="field"><span>Cor</span>${swatches(board.color)}</div>
      <div><button class="btn primary">Salvar alterações</button></div></form>
    <div class="danger-zone"><div><strong>Excluir quadro</strong><p>Apaga colunas, cards e comentários para todos.</p></div><button class="btn danger" data-set="delete">Excluir</button></div>`

function settingsMembers() {
  const mine = board.owner === me.id, link = board.invite_token && `${base}#/join/${board.invite_token}`
  return `${!mine ? `<p class="muted">Para convidar pessoas, peça o link ao dono do quadro (${esc(member(board.owner)?.name)}).</p>`
    : `<div class="invite-box"><div class="invite-head">${icon('link')}<div><strong>Convidar por link</strong><p>Quem abrir o link e entrar (ou criar conta) vira membro deste quadro.</p></div></div>
      ${link ? `<div class="copy-row"><input id="inviteLink" readonly value="${esc(link)}" onfocus="this.select()" aria-label="Link de convite"><button class="btn primary" data-set="copy">${icon('copy')}Copiar</button></div>
        <div class="row-actions"><button class="btn subtle sm" data-set="invite">${icon('refresh')}Gerar novo link</button><button class="btn subtle sm danger" data-set="invite-off">Desativar link</button></div>`
      : `<div><button class="btn primary" data-set="invite">${icon('link')}Gerar link de convite</button></div><p class="muted small">Sem link ativo, o quadro é privado: só os membros abaixo acessam.</p>`}</div>`}
    <h4 class="section-title">Membros <span class="count">${board.members.length}</span></h4>
    <ul class="member-list">${board.members.map(m => `<li>${avatar(m, 'lg')}<div><strong>${esc(m.name)}${m.id === me.id ? ' <small>(você)</small>' : ''}</strong><small>${esc(m.email)}</small></div>
      ${m.id === board.owner ? '<span class="badge">Dono</span>'
        : mine ? `<select class="select-sm" data-role="${m.id}" aria-label="Papel de ${esc(m.name)}">${opts(ROLES, m.role)}</select><button class="btn subtle sm danger" data-set="remove" data-arg="${m.id}">Remover</button>`
        : `<span class="badge muted">${esc(ROLES[m.role]?.label ?? 'Membro')}</span>`}</li>`).join('')}</ul>`
}

function openProfile() {
  const theme = store.get('theme') || 'auto'
  const d = modal(`<form><header class="modal-head"><h2>Seu perfil</h2>${closeBtn}</header><div class="modal-body">
    <div class="profile-top">${avatar(profile, 'xl')}<div><strong>${esc(profile.name)}</strong><small>${esc(me.email)}</small></div></div>
    ${field('Nome', `<input name="name" required maxlength="60" value="${esc(profile.name)}">`)}
    ${field('Tema', `<select name="theme">${[['auto', 'Automático (igual ao sistema)'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => `<option value="${v}" ${v === theme ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
    ${field('Nova senha <small>(deixe em branco para manter)</small>', '<input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">')}
    </div><footer class="modal-foot"><button type="button" class="btn subtle" data-close>Cancelar</button><button class="btn primary">Salvar</button></footer></form>`)
  const f = $('form', d)
  f.onsubmit = async e => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(f)), name = v.name.trim()
    if (name !== profile.name) { ok(await sb.from('profiles').update({ name }).eq('id', me.id)); profile.name = name }
    if (v.password) ok(await sb.auth.updateUser({ password: v.password }))
    setTheme(v.theme)
    d.close()
    renderTop()
    toast('Perfil atualizado.')
    if (board) scheduleReload()
  }
}

function openApi() {
  const d = modal(`<header class="modal-head"><h2>${icon('sparkles')}Claude / API</h2>${closeBtn}</header><div class="modal-body" id="apiBody"><div class="spinner"></div></div>`, 'dlg-md')
  const render = async token => {
    const ts = ok(await sb.from('api_tokens').select('id, name, created_at').order('created_at'))
    $('#apiBody', d).innerHTML = `<p class="muted">Gere uma chave e cole o texto no Claude (Claude Code ou qualquer Claude que faça requisições HTTP).
      Ele passa a criar, mover e comentar cards nos seus quadros como se fosse você.</p>
      ${token ? `<div class="callout success"><strong>${icon('check')}Chave criada. Copie agora: ela não aparece de novo.</strong>
        <textarea class="code" readonly rows="10" aria-label="Instruções para o Claude">${esc(claudePrompt(token))}</textarea>
        <div><button class="btn primary" data-copy>${icon('copy')}Copiar texto para o Claude</button></div></div>` : ''}
      <form class="inline-form" id="newToken"><input name="name" required maxlength="40" placeholder="Nome da chave (ex.: Claude Code)" aria-label="Nome da chave"><button class="btn primary">${icon('key')}Gerar chave</button></form>
      <h4 class="section-title">Chaves ativas <span class="count">${ts.length}</span></h4>
      ${ts.length ? `<ul class="member-list">${ts.map(t => `<li><span class="key-ico">${icon('key')}</span><div><strong>${esc(t.name)}</strong><small>criada ${ago(t.created_at)}</small></div>
        <button class="btn subtle sm danger" data-revoke="${t.id}">Revogar</button></li>`).join('')}</ul>` : '<p class="muted small">Nenhuma chave ainda.</p>'}`
    $('#newToken', d).onsubmit = async e => {
      e.preventDefault()
      render(ok(await sb.rpc('create_api_token', { p_name: new FormData(e.target).get('name').trim() })))
    }
  }
  d.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy], [data-revoke]')
    if (!b) return
    if (b.dataset.revoke) {
      if (!await ask('Revogar chave?', 'Quem estiver usando esta chave perde o acesso na hora.', 'Revogar')) return
      ok(await sb.from('api_tokens').delete().eq('id', b.dataset.revoke))
      render()
      return toast('Chave revogada.')
    }
    await navigator.clipboard.writeText($('textarea', d).value)
    toast('Copiado! Agora cole no Claude.')
  })
  render()
}

const claudePrompt = token => `Você tem acesso ao meu Kanban (estilo Jira) por uma API REST (Supabase/PostgREST). Use curl.
Base: ${SUPABASE_URL}/rest/v1
Envie SEMPRE estes headers:
  apikey: ${SUPABASE_KEY}
  x-api-key: ${token}
  Content-Type: application/json
  Prefer: return=representation

Endpoints (filtros no padrão PostgREST, ex.: ?board_id=eq.<id>):
  GET    /boards?select=id,name,key                      meus quadros
  POST   /boards {"name":"...","key":"SIGLA"}            cria quadro (sigla: 2-10 letras/números maiúsculos; já vem com A fazer / Em andamento / Concluído)
  GET    /columns?board_id=eq.<id>&order=position        colunas (status); "done": true = coluna de concluído
  POST   /columns {"board_id":"...","name":"...","wip_limit":5}
  GET    /cards?board_id=eq.<id>&order=position          cards (a chave visível é SIGLA-number)
  POST   /cards {"board_id":"...","column_id":"...","title":"...","description":"...",
                 "type":"tarefa|bug|historia|epico","priority":"baixa|media|alta|urgente",
                 "labels":["..."],"points":3,"due_date":"AAAA-MM-DD","assignee":"<user_id>",
                 "checklist":[{"text":"...","done":false}]}
  PATCH  /cards?id=eq.<id> {campos a mudar}              editar; mover = trocar column_id
  DELETE /cards?id=eq.<id>                               excluir card
  GET    /board_members?board_id=eq.<id>&select=user_id,profiles(name,email)   membros (para assignee)
  GET    /comments?card_id=eq.<id>&select=body,created_at,profiles(name)
  POST   /comments {"card_id":"...","body":"..."}

Exemplo:
curl -s "${SUPABASE_URL}/rest/v1/boards?select=id,name,key" -H "apikey: ${SUPABASE_KEY}" -H "x-api-key: ${token}"`
