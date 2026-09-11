# Gold Rate Telegram Monitor

Node.js process that polls Pankaj Chain live rates for **18 K GOLD BASIC PRICE** and sends Telegram messages in Hindi.

On every successful poll it posts a live-rate update. When the current rate **enters** the configured min/max band (inclusive), it also posts a one-shot range alert. It does not send that extra alert again while the rate stays inside the band.

This is not a web app. There is no HTTP server and no listen port.

## Requirements

- Node.js 18.11 or later (`npm run dev` uses `node --watch`)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- One or more Telegram chat IDs the bot can message

## Setup

```bash
git clone https://github.com/Abhishek1300397/gold-rate.git
cd gold-rate
npm install
```

Create a `.env` file in the project root (there is no `.env.example` in the repo). dotenv loads this file automatically via `src/config.js`.

```bash
MIN_RATE=115000
MAX_RATE=116000
CHECK_INTERVAL_MINUTES=5
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_IDS=123456789,987654321
SEND_STARTUP_MESSAGE=false
```

`.env` is gitignored. Do not commit tokens.

## Usage

```bash
npm start
```

The first poll runs immediately. After that, the loop sleeps `CHECK_INTERVAL_MINUTES` (default 5). SIGINT and SIGTERM stop the loop and exit after 500ms.

For local iteration with auto-restart on file changes:

```bash
npm run dev
```

Startup logs look like:

```text
[11/9/2026, 10:00:00 am] Application started
[SCRAPER] Fetching live rate...
[TELEGRAM] Sending message to 2 chat(s)...
```

## Configuration

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MIN_RATE` | yes | — | Inclusive lower bound. Must be a number and ≤ `MAX_RATE`. |
| `MAX_RATE` | yes | — | Inclusive upper bound. |
| `CHECK_INTERVAL_MINUTES` | no | `5` | Must be a number greater than 0. Converted to milliseconds in `src/config.js`. |
| `TELEGRAM_BOT_TOKEN` | yes | — | Bot API token. |
| `TELEGRAM_CHAT_IDS` | yes | — | Comma-separated chat IDs. Empty segments after split/trim are dropped. Each chat is sent independently; one failure does not skip the others. |
| `SEND_STARTUP_MESSAGE` | no | unset / false | Set to the string `true` to send an English HTML startup message before the first poll. Any other value is treated as off. |

## Meme clips

Regular poll and range-hit alerts send a local GIF/video (with the rate in
the caption) instead of a text-only message.

Drop two files into `src/meme/` (or `src/memes/`):

    src/meme/jo-gaareeb-hove.mp4   # regular live-rate poll
    src/meme/limit-hit.mp4         # range / limit reached

The gareeb / gaareeb / hove / hiove filename is the regular clip. The other
file in that folder is the limit alert. GIF, MP4, and WebM are sent as
animation/video; images use photo. Clips are not required in git — if a file
is missing, the bot still sends the caption as text.

## How alerts work

Source URL and product name are hardcoded in `src/config.js`, not env vars:

- URL: `https://bcast.pankajchain.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/pankajchainsilver`
- Target name: `18 K GOLD BASIC PRICE  (GST 3% & MAKING APROX 2500 RS PER GM EXTRA)` (matched after whitespace/case normalization)

The scraper uses IPv4 (`family: 4`) and a 15s Axios timeout. A cache-busting `?_=<timestamp>` query is appended on each request.

### Rate feed format

The response is tab-separated text, one product per line. The monitor looks for the target name and reads:

| Column | Meaning |
| --- | --- |
| 0 | Product ID |
| 1 | Product name |
| 2 | Unused (`-` in samples) |
| 3 | Current rate |
| 4 | High |
| 5 | Low |

Example line:

```text
6313    18 K GOLD BASIC PRICE (...)    -    115875    116433    115526
```

Current rate `115875` is what range checks use.

### Alert behavior

Assume `MIN_RATE=115000` and `MAX_RATE=116000`.

| Current rate | Live update | Range alert |
| --- | --- | --- |
| 114500 | yes | no (outside band) |
| 115100 | yes | yes (entered band) |
| 115500 | yes | no (still inside) |
| 116500 | yes | no (left band) |
| 115800 | yes | yes (entered again) |

`isInsideRange` starts as `false`, so if the first poll is already inside the band, both messages are sent.

The live Telegram copy currently says the next update is in 15 minutes. That string is hardcoded in `src/monitor.js` and is not tied to `CHECK_INTERVAL_MINUTES`.

## Testing

There are no test files and no `npm test` script.

## Project structure

```text
src/index.js      Entry point: optional startup Telegram, poll loop, SIGINT/SIGTERM
src/config.js     dotenv + env validation; source URL and target product name
src/scraper.js    HTTP fetch and tab-separated parse
src/monitor.js    Range check, Hindi live + alert messages, Telegram send
src/telegram.js   Bot API sendMessage (HTML) to each chat ID
package.json      ESM (`"type": "module"`); axios, dotenv
```
