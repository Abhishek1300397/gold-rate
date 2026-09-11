
import "dotenv/config";

function required(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

const minRate = Number(required("MIN_RATE"));
const maxRate = Number(required("MAX_RATE"));
const intervalMinutes = Number(
    process.env.CHECK_INTERVAL_MINUTES || 5
);

if (Number.isNaN(minRate)) {
    throw new Error("MIN_RATE must be a number");
}

if (Number.isNaN(maxRate)) {
    throw new Error("MAX_RATE must be a number");
}

if (minRate > maxRate) {
    throw new Error("MIN_RATE cannot be greater than MAX_RATE");
}

if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error(
        "CHECK_INTERVAL_MINUTES must be greater than 0"
    );
}

export const config = {
    sourceUrl:
        "https://bcast.pankajchain.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/pankajchainsilver",

    targetName:
        "18 K GOLD BASIC PRICE  (GST 3% & MAKING APROX 2500 RS PER GM EXTRA)",

    minRate,
    maxRate,

    checkIntervalMs: intervalMinutes * 60 * 1000,

    telegram: { botToken: required("TELEGRAM_BOT_TOKEN"), chatIds: required("TELEGRAM_CHAT_IDS").split(",").map(id => id.trim()).filter(Boolean) },

    sendStartupMessage:
        process.env.SEND_STARTUP_MESSAGE === "true"
};

