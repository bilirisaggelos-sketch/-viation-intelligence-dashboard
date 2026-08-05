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
  every 30 minutes by the `Update Intelligence` GitHub Action — **but
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

## Planned Sources

- Telegram OSINT
- UKMTO
- Reuters
- EASA
- ICAO
- EUROCONTROL

## License

Internal project – Aviation Security Research