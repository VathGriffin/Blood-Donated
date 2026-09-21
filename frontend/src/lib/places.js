// Cambodian places: an offline table of all 25 provinces/municipalities (instant
// suggestions, no network) plus a real OpenStreetMap geocoder for everything else
// (districts, towns, villages, Khmer spellings). `pos` is the provincial capital's
// [lat, lng] — an approximate centre, good enough to rank nearby hospitals.

export const PROVINCES = [
  { name: 'Banteay Meanchey', pos: [13.5867, 102.9736], aliases: ['serei saophoan', 'sisophon'] },
  { name: 'Battambang',       pos: [13.0957, 103.2022], aliases: ['battambong'] },
  { name: 'Kampong Cham',     pos: [11.9936, 105.4635], aliases: ['kompong cham'] },
  { name: 'Kampong Chhnang',  pos: [12.2500, 104.6667], aliases: ['kompong chhnang'] },
  { name: 'Kampong Speu',     pos: [11.4530, 104.5200], aliases: ['kompong speu', 'chbar mon'] },
  { name: 'Kampong Thom',     pos: [12.7111, 104.8887], aliases: ['kompong thom', 'stung saen'] },
  { name: 'Kampot',           pos: [10.5939, 104.1625], aliases: [] },
  { name: 'Kandal',           pos: [11.2168, 104.9478], aliases: ['ta khmau'] },
  { name: 'Kep',              pos: [10.4829, 104.3167], aliases: [] },
  { name: 'Koh Kong',         pos: [11.6153, 102.9830], aliases: [] },
  { name: 'Kratie',           pos: [12.4887, 106.0187], aliases: ['kracheh'] },
  { name: 'Mondulkiri',       pos: [12.4577, 107.1887], aliases: ['mondol kiri', 'senmonorom'] },
  { name: 'Oddar Meanchey',   pos: [14.1819, 103.5175], aliases: ['otdar meanchey', 'samraong'] },
  { name: 'Pailin',           pos: [12.8489, 102.6093], aliases: [] },
  { name: 'Phnom Penh',       pos: [11.5564, 104.9282], aliases: [] },
  { name: 'Preah Sihanouk',   pos: [10.6238, 103.5228], aliases: ['sihanoukville', 'sihanouk ville', 'kampong som'] },
  { name: 'Preah Vihear',     pos: [13.8064, 104.9803], aliases: ['tbeng meanchey'] },
  { name: 'Prey Veng',        pos: [11.4833, 105.3250], aliases: [] },
  { name: 'Pursat',           pos: [12.5388, 103.9191], aliases: ['poursat'] },
  { name: 'Ratanakiri',       pos: [13.7298, 106.9873], aliases: ['rattanakiri', 'ratanak kiri', 'banlung'] },
  { name: 'Siem Reap',        pos: [13.3671, 103.8448], aliases: ['siemreap', 'siem reab'] },
  { name: 'Stung Treng',      pos: [13.5239, 105.9674], aliases: [] },
  { name: 'Svay Rieng',       pos: [11.0878, 105.7998], aliases: [] },
  { name: 'Takeo',            pos: [10.9801, 104.7995], aliases: ['doun kaev'] },
  { name: 'Tbong Khmum',      pos: [11.9147, 105.6547], aliases: ['tboung khmum', 'suong'] },
];

// Lowercase, strip accents/punctuation and the generic words people add
// ("Siem Reap Province", "Phnom Penh City, Cambodia") so they still match.
const FILLER = new Set(['province', 'city', 'municipality', 'krong', 'khet', 'cambodia', 'kingdom', 'of']);
const normalize = (text) =>
  String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
    .join(' ');

const keysOf = (p) => [normalize(p.name), ...p.aliases.map(normalize)];
const INDEX = PROVINCES.map((p) => ({ province: p, keys: keysOf(p) }));

// Resolves free text to a province, or null when it isn't confidently one:
//   "Siem Reap Province" / "sihanoukville"  → exact name or alias
//   "Sen Sok, Phnom Penh"                   → text that contains exactly one province name
//   "siem", "batt"                          → prefix that matches exactly one province
// Ambiguous input ("kampong") returns null so the caller can geocode it instead.
export function findProvince(text) {
  const q = normalize(text);
  if (!q) return null;

  const exact = INDEX.find(({ keys }) => keys.includes(q));
  if (exact) return exact.province;

  const padded = ` ${q} `;
  const contained = INDEX.filter(({ keys }) => keys.some((k) => padded.includes(` ${k} `)));
  if (contained.length === 1) return contained[0].province;

  if (q.length >= 3) {
    const prefixed = INDEX.filter(({ keys }) => keys.some((k) => k.startsWith(q)));
    if (prefixed.length === 1) return prefixed[0].province;
  }
  return null;
}

// Real geocoding via OpenStreetMap Nominatim, limited to Cambodia. Call it on submit
// (one request per search), not per keystroke — Nominatim's usage policy forbids
// autocomplete-style traffic. Returns { pos: [lat, lng], label } or null if nothing matches.
export async function geocodePlace(query, signal) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=kh&accept-language=en' +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [hit] = await res.json();
  if (!hit) return null;
  return {
    pos: [Number(hit.lat), Number(hit.lon)],
    label: hit.display_name.split(',').slice(0, 2).join(',').trim(),
  };
}
