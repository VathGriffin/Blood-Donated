# Interface language (EN / KH / VN)

One app-wide language setting. Changing it in the navbar (or the dashboard top bar or the phone menu)
updates every translated screen at once. The floating chatbot has its own EN / KH / VN choice,
saved separately as `bloodlife_chat_language` (`components/chat/useChatLanguage.js`): it never
changes the website language, and the website language never changes it.

## How it works

| Piece | File | Role |
|---|---|---|
| Languages | `config.js` | `LOCALES` (en, km, vi), `normalizeLang` (anything else → English) |
| Provider | `I18nProvider.jsx` | Holds the language; saves it to `localStorage` and the `bloodlife-lang` cookie; sets `<html lang>` |
| First paint | `app/layout.jsx` | Reads the cookie on the server, so pages render in the saved language with no English flash |
| Translations | `messages/<namespace>.js` | `{ en, km, vi }` side by side; registered in `messages/index.js` |
| Formatting | `format.js`, `lib/format.js` | Relative times, dates and numbers in the selected language (browser `Intl`) |
| Picker | `components/layout/LanguageSwitcher.jsx` | Navbar / top bar dropdown |
| Fonts | `lib/fonts.js` | Inter + Inter Vietnamese subset + Noto Sans Khmer (self-hosted) |
| Tab titles | `server.js` | `pageTitle('key')` → `generateMetadata` that reads the cookie (`titles.*`) |
| API messages | `lib/api-error.js` | `apiErrorMessage(err, fallback)` / `translateServerMessage(text)` match the API's English text against `messages/server.js` |
| Notifications | `lib/feed-text.js` | The API adds `i18n: { title, body }` (a key + raw values) to each bell item; `feed.*` builds the sentence |
| Status words | `messages/status.js`, `components/ui/StatusBadge.jsx` | `statusLabel(t, 'Pending')`; stored values stay English in the database |

## Using it in a component

```jsx
import { useI18n } from '@/i18n/I18nProvider';

const { t, rich, formatNumber, formatRelative } = useI18n();
t('nav.home');                                   // "Home" / "ទំព័រដើម" / "Trang chủ"
t('home.hero.availableNow', { count: 7 });       // fills {count}; picks the one/other plural
rich('home.supply.lowLead', { types: <b>O-</b> }); // React elements inside a sentence
formatDate(date);                                // lib/format.js, follows the language
```

Rules:
- Never hard-code user-facing text in a component; add a key to a namespace file in all three languages.
- Do not translate blood type codes, IDs, emails, phone numbers, or anything users or staff typed
  (names, reasons, hospital names, admin-written profiles). Show them as stored.
- API error and success messages: always go through `apiErrorMessage` (never `err.response.data.message`
  directly). A new backend message needs its English text added to `messages/server.js`.
- Lists defined outside a component (tabs, options, steps) hold keys or use getters that read
  `translate(currentLang(), …)`, so they follow the language when rendered.

`messages.test.js` fails when a language is missing a key, a `{placeholder}` differs, Khmer text has no
Khmer letters, or Vietnamese text is identical to English. `language-switching.test.jsx` renders real
pages and fails if any English phrase is left on screen in Khmer or Vietnamese. `keys-used.test.js` scans
the source and fails if any literal `t('…')` key does not exist.

## Coverage

Every screen is translated in English, Khmer and Vietnamese.

| Area | Routes | Status |
|---|---|---|
| Shared frame | navbar, phone menu, footer, cookie notice, site search, notification bell, account menu, 404, loading | Translated |
| Public | `/`, `/about`, `/donate`, `/donate/thank-you`, `/appointments`, `/appointments/confirmed`, `/map`, `/donors`, `/assistant`, `/contact`, `/privacy`, `/terms` | Translated |
| Sign-in | `/login`, `/register`, `/forgot-password`, `/hospital/login`, `/hospital/forgot-password`, `/hospital/reset-password`, `/admin/login` | Translated (language picker on every sign-in page) |
| Donor | `/profile`, `/qr-card`, `/my-appointments`, `/my-requests`, `/requests`, `/notification`, `/donor-directory` | Translated |
| Hospital | `/dashboard/hospital` + inventory, requests, appointments, scan, profile | Translated |
| Admin | `/dashboard/admin` + donors, hospitals, inventory, requests, appointments, analytics, contacts, settings (incl. About editor) | Translated |
| Chatbot | floating widget and `/assistant` | Widget: its own chat language; `/assistant` page: follows the site language |
| Server text | API errors/confirmations, notification bell items, browser-tab titles | Translated |

Left as stored on purpose: names, addresses, emails, phones, blood types, IDs, hospital names,
anything users or admins typed (reasons, notes, messages, About-page text an admin customised),
and map labels from OpenStreetMap. Backend messages not listed in `messages/server.js` show the
caller's translated fallback in Khmer/Vietnamese. The social-share image (`app/opengraph-image.jsx`)
is a single English image.
