# Self-hosted fonts

| File | Font | Used for | Licence |
|---|---|---|---|
| `Inter-latin.woff2` | [Inter](https://github.com/rsms/inter) (variable, 100–900, latin) | body text — `--font-inter` | SIL OFL 1.1 — `OFL-Inter.txt` |
| `Caveat-latin.woff2` | [Caveat](https://github.com/googlefonts/caveat) (variable, 400–700, latin) | handwritten slogans | SIL OFL 1.1 — `OFL-Caveat.txt` |

They are loaded in `src/lib/fonts.js` with `next/font/local`. Import `inter` / `script` from there — do not use
`next/font/google` in this project.

## Why not `next/font/google`?

It downloads the font from Google on every `next build`. Next.js then works out the file type from the URL Google
put in its CSS with `/\.(woff|woff2|eot|ttf|otf)$/.exec(url)[1]` and has no null check, so a font URL without an
extension (Google sometimes serves `fonts.gstatic.com/l/font?kit=…` style URLs) makes the whole build fail with
`TypeError: Cannot read properties of null (reading '1')`. Which style comes back depends on the request, so the
failure is intermittent — fine on one machine, failing on another. Local files avoid the network entirely.

## Regenerating / adding a font

The latin subset was taken from Google's CSS API (the block marked `/* latin */`):

    curl -A "Mozilla/5.0 ... Chrome/130 Safari/537.36" \
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap"

Download the `src: url(...woff2)` inside the `/* latin */` block and save it here. The latin subset has no Khmer
or Vietnamese glyphs; those fall back to the system font, exactly as before.
