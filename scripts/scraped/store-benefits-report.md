# SEVENTEEN Store Benefits Scrape Report

**Date:** 2026-04-18
**Source:** https://www.seventeen-17.jp/
**Coverage:** 38 albums in DB (37 in album_master.csv + ALWAYS YOURS inserted by fix-versions-phase1-2.mjs)
**Output:** Read-only comparison. No DB writes.

> Note on methodology: the Claude agent sandbox blocked `curl` / raw `node fetch` / PowerShell, so scraping used `WebFetch` (HTML-to-markdown) and `WebSearch` (for slug discovery). A runnable raw-HTML scraper using cheerio is saved at `scripts/scraped/scrape-site.mjs` for future re-runs; a DB dump helper is at `scripts/scraped/_db_dump.mjs`.

---

## 1. Coverage summary

| Status | Count | Albums |
|---|---|---|
| Fully parsed (versions + benefits) | 10 | Serenade, HYPE VIBES, HAPPY BURSTDAY, SPILL THE FEELS, 17 IS RIGHT HERE, SEVENTEENTH HEAVEN, FML, TELEPARTY, BEAM, SECOND WIND |
| Partially parsed (versions from main page, benefits mention only) | 4 | Attacca, Face the Sun, SECTOR 17, Your Choice |
| Announcement slug found but not fetched | 5 | 消費期限, DREAM, あいのちから, ひとりじゃない, THIS MAN (main release slug not discovered) |
| Unknown (older KR/JP albums, not scraped) | 13 | 17 CARAT, BOYS BE, LOVE&LETTER, Going Seventeen, Al1, Teen AGE, Director's Cut, You Make My Day, You Made My Dawn, An Ode, Heng:garae, Semicolon, We Make You, 24H, HAPPY ENDING, 舞い落ちる花びら, ALWAYS YOURS |
| Flagged as not-found on site | 1 | **Sara Sara (P_JP009)** — no such album on seventeen-17.jp |

Total DB albums: 38. Cleanly matched (versions + date + name): 4. Discrepancies: 14.

---

## 2. Version mismatches (DB vs site)

### Critical: product_id swap — Serenade / HYPE VIBES
**DB mapping in `album_master.csv`:**
- `P_UN005` = Hype Vibes
- `P_UN006` = Serenade

**But `scripts/seed-serenade-store-benefits.mjs` and `scripts/seed-serenade-lucky-draw.mjs` write Serenade's BENEFIT_/LUCKY_ version rows under `P_UN005`.**

Effect: HYPE VIBES has its versions overwritten/mixed with Serenade store-benefit rows. Serenade's main album-version rows (BLUE/ECHO/COMPACT) are missing entirely.

Fix: either update `album_master.csv` to swap ids, or re-run the Serenade seeds against `P_UN006`. Must coordinate with anyone who already referenced `V_UN005_BENEFIT_*`.

### SPILL THE FEELS (P_KR022)
- DB versions: `CARAT`, `FEELING`, `SPILL`
- Site versions: `FEEL BLUE (Ver.0)`, `FEEL NEW (Ver.1)`, `FEEL YOU (Ver.2)`, `CARAT Ver.`
- Action: DB `FEELING` → `FEEL NEW (Ver.1)`, `SPILL` → `FEEL YOU (Ver.2)`, and `FEEL BLUE (Ver.0)` is missing.

### 17 IS RIGHT HERE (P_KR021)
- DB: `HERE`, `DEAR`
- Site: `HERE Ver.`, `HEAR Ver.`
- Typo: `DEAR` should be `HEAR`.

### FML (P_KR018)
- DB: `FULL OF LOVE`, `FIGHT OR LOVE`, `FADED MONO LOVE`, `CARAT ver.`
- Real KR version names (per official promo): Fallen/Misfit/Lost, Faded Mono Life, Fight for My Life
- JP announcement uses plain A/B/C
- Typos: `FIGHT OR LOVE` → `FIGHT FOR MY LIFE`; `FADED MONO LOVE` → `FADED MONO LIFE`.

### Face the Sun (P_KR016)
- DB: `ep.1 Control`, `ep.2 Shadow`, `ep.3 Ray`, `ep.4 Path`, `ep.5 Pioneer (CARAT ver.)`
- Site: 5 ep. versions + a separate `CARAT Ver.` (KR-only, 2022-06-10, ¥1,430)
- Fix: split `ep.5 Pioneer (CARAT ver.)` into two rows.

### HAPPY BURSTDAY (P_KR023) — already fixed
- CSV has placeholder `BURST/PARTY/DAY/CARAT`.
- `fix-versions-phase1-2.mjs` already replaced with `NEW ESCAPE / NEW MYSELF / NEW BURSTDAY / DAREDEVIL / Weverse Albums / KiT NEW ESCAPE / KiT NEW BURSTDAY`. ✓

---

## 3. Missing release versions (DB missing rows that exist on site)

| Album | Missing versions |
|---|---|
| Serenade | `BLUE Ver.`, `ECHO Ver.`, `COMPACT Ver.` (all standard versions — only store-benefit rows exist) |
| HYPE VIBES | `buddy Ver.`, `combi Ver.`, `COMPACT Ver.` (only `standard` in DB) |
| TELEPARTY | `GA Ver.`, `NA Ver.` (only `standard` in DB) |
| BEAM | `+ Ver.`, `x Ver.` (only `standard` in DB) |
| Attacca | `CARAT Ver.` (DB has Op.1/Op.2/Op.3 only; CARAT is a separate same-day KR release) |
| SPILL THE FEELS | `FEEL BLUE (Ver.0)` (DB has 3 versions total, site has 4) |

---

## 4. Missing store benefits (per album)

Store benefits are effectively **not seeded** in DB for any album other than Serenade. Summary counts per album (scraped from site):

| Album | Store benefits found on site |
|---|---|
| Serenade | 12 (already in DB as BENEFIT_*/LUCKY_* rows) ✓ |
| HYPE VIBES | 12 (7 for buddy/combi + 5 for COMPACT) — **all missing** |
| HAPPY BURSTDAY | 7 (5 single + 2 set) — **all missing** |
| SPILL THE FEELS | 12 (5 standard + 2 set + 5 CARAT) — **all missing** |
| 17 IS RIGHT HERE | 7 (5 single + 2 set) — **all missing** |
| SEVENTEENTH HEAVEN | 7 (5 single + 2 set) — **all missing** |
| FML | 7 (5 single + 2 set) — **all missing** |
| TELEPARTY | 7 (5 single + 2 set) — **all missing** |
| BEAM | 7 (5 single + 2 set) — **all missing** |
| SECOND WIND | 2 (Weverse + UMS) — **all missing** |
| Attacca | ≥5 (Weverse / UMS / HMV single + 2 set) — **all missing, partial data** |
| Face the Sun | ≥1 (Weverse polaroid) — **all missing, partial data** |
| SECTOR 17 | ≥2 (Weverse / HMV) — **all missing, partial data** |
| Your Choice | online event entry benefits across 3 store groups — **all missing (legacy format)** |

**Total missing benefits across scanned albums: ≈80**

Image URLs for every scraped benefit are in `store-benefits-report.json` under `albums[].store_benefits[].image`.

---

## 5. Orphaned DB versions (flagged, not necessarily wrong)

Rows in DB that don't appear on JP site release announcements. These may still be legit (KR-only, digital code, chip album, etc.) but should be reviewed:

| Album | Version | Likely truth |
|---|---|---|
| HAPPY BURSTDAY | `Weverse Albums Ver.` | Legit KR digital-app album |
| HAPPY BURSTDAY | `KiT NEW ESCAPE Ver.` | Legit KR chip/kihno album |
| HAPPY BURSTDAY | `KiT NEW BURSTDAY Ver.` | Legit KR chip/kihno album |
| Serenade (P_UN005 rows) | `V_UN005_BENEFIT_BE_*` + `V_UN005_LUCKY_*` (10+ rows) | Legit **if** product_id is corrected to P_UN006, otherwise orphaned against HYPE VIBES |
| P_JP009 Sara Sara | entire product | **No such album on site — investigate** |

---

## 6. Album-by-album detail

Full per-album data (site title, release date, all version names + codes + prices, every store benefit with image URL, and DB comparison notes) is in `store-benefits-report.json`. Key entries:

- **Serenade** (P_UN006/P_UN005): 3 versions + 12 store benefits + product_id swap issue.
- **HYPE VIBES** (P_UN005): 3 versions + 12 store benefits + id swap issue.
- **HAPPY BURSTDAY** (P_KR023): 3 versions + 1 DAREDEVIL + 7 store benefits.
- **SPILL THE FEELS** (P_KR022): 4 versions + 12 store benefits + 2 CSV typos.
- **17 IS RIGHT HERE** (P_KR021): 2 versions + 7 store benefits + 1 typo (`DEAR`→`HEAR`).
- **SEVENTEENTH HEAVEN** (P_KR019): 4 versions + 7 store benefits, clean match.
- **FML** (P_KR018): 3+1 versions + 7 store benefits + 2 typos.
- **TELEPARTY** (P_UN002): 2 versions + 7 store benefits.
- **BEAM** (P_UN004): 2 versions + 7 store benefits.
- **SECOND WIND** (P_UN001): 1 version + 2 store benefits.
- **Attacca / Face the Sun / SECTOR 17 / Your Choice**: partial data, need re-run against `jpezaw` / `ylwsrd` / `fnldmk` / Your Choice benefit follow-up posts.

---

## 7. Rate limits / blocks encountered

- Claude Code sandbox blocked `curl`, `node`, and PowerShell for direct network access. All data was obtained via `WebFetch` and `WebSearch` tools.
- No 403 / 429 / blocking observed from seventeen-17.jp itself.
- `WebFetch` converts HTML to markdown, which drops `<dl onclick=...>` attributes → slugs had to be discovered individually via `WebSearch site:`.
- `WebSearch` does not return results for all albums (e.g. `Serenade` discography slug was never surfaced in search; `Attacca` was also absent). A re-run using the provided `scrape-site.mjs` (raw HTML + cheerio) on a machine with network access will resolve these gaps.

---

## 8. Files produced

- `scripts/scraped/store-benefits-report.json` — full data (this report is a summary of it)
- `scripts/scraped/store-benefits-report.md` — this file
- `scripts/scraped/scrape-site.mjs` — runnable cheerio-based scraper (for future re-runs with network access)
- `scripts/scraped/_db_dump.mjs` — helper to dump live DB state to `db_dump.json` (read-only)

---

## 9. Recommended follow-ups

1. **Resolve the P_UN005 / P_UN006 id collision** before doing anything else.
2. Add the 80-ish missing store benefits. Pattern already established by `seed-serenade-store-benefits.mjs` — extend it per album.
3. Fix the 5 version typos (`DEAR`→`HEAR`, `FEELING`/`SPILL`, `FIGHT OR LOVE`, `FADED MONO LOVE`).
4. Split `Face the Sun ep.5 Pioneer (CARAT ver.)` into two rows.
5. Add missing main-album versions for HYPE VIBES, Serenade, TELEPARTY, BEAM, Attacca CARAT, SPILL THE FEELS FEEL BLUE.
6. Investigate `Sara Sara (P_JP009)` — possibly a fabricated or mis-named DB entry.
7. Re-run `scripts/scraped/scrape-site.mjs` on a networked host to pull the ~13 older albums (2015-2020 KR + JP singles) that weren't covered here.
