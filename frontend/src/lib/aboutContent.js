import API_BASE from '@/lib/config';

// Built-in text of the public About page. Admins override any field in Settings → About Page;
// a blank or missing field falls back to the text here. Field limits come from the API
// (GET /api/about → limits), defined once in Backend/src/about/about.sections.js.
const DEFAULT_SECTIONS = {
  hero: {
    eyebrow: 'People · Community · A Healthier Cambodia',
    title: 'About',
    titleAccent: 'Blood Donated',
    headline: 'Revolutionizing Blood Donation Across Cambodia',
    intro: 'We are a community-driven platform connecting donors, hospitals, and patients — built by Vith Vath as an individual graduation project at Hanoi University of Science and Technology (HUST), to make blood donation more accessible, transparent, and impactful.',
  },
  values: [
    { title: 'Trusted Platform', subtitle: 'Safe, secure, and transparent' },
    { title: 'Connecting Communities', subtitle: 'Donors, hospitals, and patients' },
    { title: 'Saving Lives', subtitle: 'A stronger, healthier Cambodia' },
  ],
  purpose: {
    eyebrow: 'Our Purpose',
    title: 'A Healthier Cambodia Through Blood Donation',
    text: 'We believe that everyone has the power to save lives. Our platform bridges the gap between donors, hospitals, and patients to create a stronger, healthier Cambodia.',
    quote: 'A stronger Cambodia is built by people who care.',
  },
  pillars: [
    { title: 'Our Mission', desc: 'To make blood donation easier, safer, and more accessible for everyone in Cambodia using technology and community support.' },
    { title: 'Our Vision', desc: 'A Cambodia where no patient suffers due to a lack of blood, and where voluntary blood donation becomes a regular part of life.' },
    { title: 'Our Impact', desc: 'Connecting people, supporting hospitals, and helping save lives across Cambodia through innovation and collaboration.' },
  ],
  stats: [
    { label: 'Registered Donors', caption: 'People in our community' },
    { label: 'Total Donations', caption: 'Contributions to save lives' },
    { label: 'Partner Hospitals', caption: 'Working across Cambodia' },
    { label: 'Blood Requests Fulfilled', caption: 'Patients received help' },
  ],
  team: {
    name: 'Vith Vath',
    position: 'Full-stack Developer & System Designer',
    bio: 'Designed and developed BloodLife AI as an individual graduation project, combining modern web technologies and AI to create a practical solution supporting blood donors, hospitals, and healthcare communities.',
  },
  cta: {
    title: 'Be Part of a Stronger, Healthier Cambodia',
    text: 'Whether you’re a donor, hospital, or supporter — together we can save more lives.',
    button: 'Join Us Today',
  },
};

const DEFAULT_IMAGES = {
  heroImage: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
  purposeImage: 'https://images.unsplash.com/photo-1565687363630-7a81809a199c?auto=format&fit=crop&w=1200&q=80',
};

const pick = (saved, fallback) => (typeof saved === 'string' && saved.trim() ? saved : fallback);
const mergeFields = (saved, defaults) =>
  Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, pick(saved?.[k], v)]));

// Saved sections (possibly partial) → complete sections, defaults filling every gap.
export function mergeSections(saved = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_SECTIONS).map(([name, def]) => [
    name,
    Array.isArray(def)
      ? def.map((item, i) => mergeFields(saved?.[name]?.[i], item))
      : mergeFields(saved?.[name], def),
  ]));
}

// Complete sections → only the fields that differ from the defaults, so built-in text that is
// later improved in code still reaches pages the admin never customised.
export function overridesOnly(sections) {
  const strip = (value, def) => Object.fromEntries(
    Object.entries(def).flatMap(([k, d]) => {
      const v = (value?.[k] ?? '').trim();
      return v && v !== d ? [[k, v]] : [];
    }),
  );
  return Object.fromEntries(Object.entries(DEFAULT_SECTIONS).map(([name, def]) => [
    name,
    Array.isArray(def) ? def.map((d, i) => strip(sections[name]?.[i], d)) : strip(sections[name], def),
  ]));
}

// Stored "/uploads/…" path → absolute URL; falls back to the built-in image for that slot
// (none for creatorPhoto, where the page shows initials instead).
export const aboutImageUrl = (path, slot) => (path ? `${API_BASE}${path}` : DEFAULT_IMAGES[slot] || null);
