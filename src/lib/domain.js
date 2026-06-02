// ============================================================================
//  Famies Publiceringsbord — domain model
//  Canonical keys live here. Human labels are resolved per-language in i18n.
// ============================================================================

// ---- Publication types ----------------------------------------------------
export const ITEM_TYPES = ['brevlada', 'video', 'event'];

export const TYPE_META = {
  brevlada: { color: 'var(--c-pink)', soft: 'var(--c-pink-soft)', icon: 'Mail' },
  video: { color: 'var(--c-violet)', soft: 'var(--c-violet-soft)', icon: 'Video' },
  event: { color: 'var(--c-green)', soft: 'var(--c-green-soft)', icon: 'CalendarHeart' },
};

// ---- Publication workflow status ------------------------------------------
export const ITEM_STATUSES = ['utkast', 'vantar', 'godkand', 'publicerad'];

export const STATUS_META = {
  utkast: { color: 'var(--c-sand)', bg: 'var(--c-sand-soft)' },
  vantar: { color: 'var(--c-amber)', bg: 'var(--c-amber-soft)' },
  godkand: { color: 'var(--c-cyan)', bg: 'var(--c-cyan-soft)' },
  publicerad: { color: 'var(--c-green)', bg: 'var(--c-green-soft)' },
};

// ---- Sales pipeline stages -------------------------------------------------
export const LEAD_STAGES = ['ny', 'kontaktad', 'mote', 'offert', 'vunnen', 'forlorad', 'pausad'];

// stages that flow left→right on the kanban (won/lost/paused are terminal columns too)
export const PIPELINE_COLUMNS = ['ny', 'kontaktad', 'mote', 'offert', 'vunnen', 'forlorad', 'pausad'];

export const STAGE_META = {
  ny: { color: 'var(--c-slate)', bg: 'var(--c-slate-soft)' },
  kontaktad: { color: 'var(--c-cyan)', bg: 'var(--c-cyan-soft)' },
  mote: { color: 'var(--c-violet)', bg: 'var(--c-violet-soft)' },
  offert: { color: 'var(--c-amber)', bg: 'var(--c-amber-soft)' },
  vunnen: { color: 'var(--c-green)', bg: 'var(--c-green-soft)' },
  forlorad: { color: 'var(--c-red)', bg: 'var(--c-red-soft)' },
  pausad: { color: 'var(--c-sand)', bg: 'var(--c-sand-soft)' },
};

// ---- Video library categories ---------------------------------------------
export const VIDEO_CATEGORIES = ['plats', 'event', 'kund', 'tipsa', 'beratta', 'fraga', 'some'];

export const CATEGORY_COLOR = {
  plats: { bg: '#dbeafe', fg: '#1d4ed8' },
  event: { bg: '#ccfbf1', fg: '#0d9488' },
  kund: { bg: '#ffe5ed', fg: '#e11d6b' },
  tipsa: { bg: '#fef3c7', fg: '#b45309' },
  beratta: { bg: '#ede9fe', fg: '#6d28d9' },
  fraga: { bg: '#cffafe', fg: '#0891b2' },
  some: { bg: '#fce7f3', fg: '#be185d' },
};

// ---- Customer types & packages --------------------------------------------
export const CUSTOMER_TYPES = ['lokal', 'stor', 'aktivitet', 'kommun', 'upplevelse'];
export const PACKAGES = ['standard', 'storkund', 'kommun', 'upplevelse', 'anpassat'];

// ---- Team (seed defaults — editable at runtime) ---------------------------
export const DEFAULT_TEAM = ['Albin', 'Ezra', 'Samuel', 'Tåve', 'Ilja', 'Injamul', 'Tayyab'];

// ---- Stockholm-area municipalities (kommuner) Famies serves ---------------
export const CITIES = [
  'Stockholm', 'Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge', 'Järfälla',
  'Lidingö', 'Nacka', 'Norrtälje', 'Nykvarn', 'Nynäshamn', 'Österåker', 'Salem',
  'Sigtuna', 'Sollentuna', 'Solna', 'Södertälje', 'Sundbyberg', 'Täby', 'Tyresö',
  'Upplands-Bro', 'Upplands Väsby', 'Uppsala', 'Vallentuna', 'Värmdö', 'Vaxholm',
];

// ---- Helpers ---------------------------------------------------------------
export function isAfterStatus(a, b) {
  return ITEM_STATUSES.indexOf(a) > ITEM_STATUSES.indexOf(b);
}

export function nextStatus(s) {
  const i = ITEM_STATUSES.indexOf(s);
  return i < 0 || i === ITEM_STATUSES.length - 1 ? s : ITEM_STATUSES[i + 1];
}
