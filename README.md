# Aviation Intelligence Dashboard

An aviation-focused intelligence platform for monitoring security, geopolitical and operational events affecting civil aviation.

## Features

- Live FAA Temporary Flight Restrictions (TFR)
- NOAA Space Weather Alerts
- UKMTO Maritime Security (in progress)
- CZIB Security Advisories
- Intelligence normalization
- Event scoring and filtering
- Interactive map
- Aviation-focused dashboard

## Project Structure

```
collectors/
    official/
        faa.py
        noaa.py
        ukmto.py

    telegram/
        client.py

    instagram/
        base.py
        template.py

    trusted/

processors/
models/
scripts/
config/
data/
js/
css/
```

## Installation

```bash
git clone https://github.com/bilirisaggelos-sketch/-viation-intelligence-dashboard.git

cd -viation-intelligence-dashboard

pip install -r requirements.txt
```

## Run Intelligence Collection

```bash
python scripts/fetch_intel.py
```

## Dashboard

Serve the project locally:

```bash
python -m http.server 8000
```

Open:

```
http://localhost:8000
```

## Keeping Data Fresh

The dashboard only ever displays what's currently saved in
`data/live-intel.json` and `data/czib-live.json` — it does not talk to
Telegram/FAA/NOAA/Instagram live from the browser. Something has to run
the collectors and update those files periodically.

- `data/czib-live.json` is refreshed automatically every 6 hours by the
  `Update CZIB` GitHub Action.
- `data/live-intel.json` (FAA, NOAA, Telegram, Instagram) is refreshed
  every 15 minutes by the `Update Intelligence` GitHub Action — **but
  only once you've added these repo secrets** (Settings → Secrets and
  variables → Actions):
  - `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`
  - `TELEGRAM_SESSION` — generate once locally with
    `python scripts/generate_telegram_session.py` and paste the output
  - `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` (only if you enable an
    Instagram source)

  Without those secrets the workflow will fail at the collector step
  (or, before this fix, wasn't scheduled at all and only refreshed data
  when someone opened the Actions tab and clicked "Run workflow" by
  hand — which is why the feed could sit weeks out of date).

Running locally instead is always an option too:

```bash
python scripts/fetch_intel.py
```

## Current Official Sources

- FAA TFR
- NOAA Space Weather

## OSINT / Telegram Sources

- Middle East Spectator, OSINT Defender, Clash Report, Our Wars Today,
  Alsaa Plus EN, Mediterranean Man, CASELS, Geopolitics Prime
- OSINTtechnical, Faytuks News, Calibre Obscura

## Trusted / RSS Sources

- **ISW** (Institute for the Study of War) - working public RSS, enabled by default
- **BBC World** - working public RSS, enabled by default. Used as a
  substitute for Reuters, since Reuters no longer publishes a reliable
  official public RSS feed (their remaining "feeds" are third-party
  unofficial scrapers). If you find/build a working Reuters feed later,
  `collectors/trusted/bbc_world.py` is a two-line change.
- **Middle East Eye** - working RSS, **disabled by default**. Rated
  Left/Left-Center leaning but "Mostly Factual" by independent bias
  checkers - worth knowing before you enable it for something feeding
  security decisions, though a biased source reporting a real event is
  still useful signal, and adds another independent voice for the
  verification/dedup system to cross-check against.
- **ACLED** - real collector, but needs a free account. ACLED uses OAuth
  (email + password, not a static key) - register at
  https://acleddata.com/register, then add to `.env`:
  ```
  ACLED_USERNAME=the_email_you_registered_with
  ACLED_PASSWORD=your_acled_password
  ```
  Enable it in `config/sources.json` once those are set.
- **ACLED** - real collector using ACLED's current OAuth flow (email +
  password -> short-lived access token; the old static-API-key system
  was retired in 2025). Register at https://acleddata.com/register, then
  add to `.env`:
  ```
  ACLED_USERNAME=the_email_you_registered_with
  ACLED_PASSWORD=your_acled_password
  ```
  Enable it in `config/sources.json` once those are set.
- **LiveUAMap** - **confirmed no free access.** Tried directly: `/rss`
  and similar paths just redirect to the normal cookie-consent + map
  page, not an XML feed. Their only programmatic access is a paid
  subscription (https://liveuamap.com/promo/api). The collector files
  (`liveuamap_middle_east.py`, `liveuamap_syria.py`, `liveuamap_iran.py`,
  `liveuamap_redsea.py`, `liveuamap_ukraine.py`) are left as ready-to-fill
  shells for if you ever get a paid key - until then they're disabled
  and intentionally do nothing.

## Not Yet Implemented (documented stubs)

These have no confirmed simple public API/feed - each file explains
exactly what's needed if you want to build it out:

- EUROCONTROL (`collectors/official/eurocontrol.py`) - needs B2B API access
- UK CAA (`collectors/official/uk_caa.py`) - needs a scraper built against the live site
- FAA NOTAM, general (`collectors/official/faa_notam.py`) - security TFRs are already covered separately
- Maritime Security Center (`collectors/official/maritime_security_center.py`)

## Instagram Sources

Add a `.env` entry with your Instagram login:

```
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password
```

Then add one file per account under `collectors/instagram/` (copy
`example_source.py`) and register it in `config/sources.json` under
`"instagram"` with `"enabled": true`. Only public profile captions are
read — nothing behind a login-only account.

## Planned / Not Yet Sourced

- ICAO
- Reuters (see the "Trusted / RSS Sources" note above - using BBC World as a substitute for now)

## License

Internal project – Aviation Security Research