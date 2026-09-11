
# Gold Rate Telegram Monitor

Monitors the Pankaj Chain 18K Gold Basic Price and sends a Telegram
notification when the price enters a configured range.

## Requirements

- Node.js 18+
- Telegram Bot
- Telegram Chat ID

## Installation

Clone/copy the project:

    cd gold-rate-alert

Install dependencies:

    npm install

Create environment file:

    cp .env.example .env

Edit `.env`:

    MIN_RATE=115000
    MAX_RATE=116000

    CHECK_INTERVAL_MINUTES=5

    TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
    TELEGRAM_CHAT_ID=YOUR_CHAT_ID

    SEND_STARTUP_MESSAGE=false

Start:

    npm start

## How alerts work

If the configured range is:

    MIN_RATE=115000
    MAX_RATE=116000

And the rates are:

    114500 -> No alert
    115100 -> ALERT
    115500 -> No additional alert
    115900 -> No additional alert
    116000 -> No additional alert
    116500 -> No alert
    115800 -> ALERT

The application alerts when the rate ENTERS the range.

It does not repeatedly send messages while the rate remains
inside the range.

## Target rate

The application searches for:

18 K GOLD BASIC PRICE
(GST 3% & MAKING APROX 2500 RS PER GM EXTRA)

The current rate is taken from the fourth column.

Example:

6313    18 K GOLD BASIC PRICE (...)    -    115875    116433    115526

Current rate:

115875

High:

116433

Low:

115526
