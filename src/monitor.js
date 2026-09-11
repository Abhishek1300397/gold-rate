
import { config } from "./config.js";
import { fetchRateData } from "./scraper.js";
import { sendTelegramMeme } from "./telegram.js";

let isInsideRange = false;

function formatIndianDateTime(date) {
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(date);
}

/**
 * रुपये में नंबर format करें
 */
function formatCurrency(value) {
    if (value === null || value === undefined) {
        return "उपलब्ध नहीं";
    }

    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(value);
}


/**
 * Check करें कि भाव आपकी निर्धारित सीमा में है या नहीं
 */
function isRateInRange(rate) {
    return (
        rate >= config.minRate &&
        rate <= config.maxRate
    );
}


function createLiveRateMessage(rateData) {

    const inRange = isRateInRange(rateData.rate);

    return `
Jo Gaareeb hove hai na wo apni soch se gareeb hove hai

💰 <b>18K सोना:</b> ₹${formatCurrency(rateData.rate)} प्रति ग्राम
📈 High: ₹${formatCurrency(rateData.high)}
📉 Low: ₹${formatCurrency(rateData.low)}

🎯 Range: ₹${formatCurrency(config.minRate)} – ₹${formatCurrency(config.maxRate)}
${inRange ? "🟢 भाव range में है" : "⚪ भाव अभी range से बाहर है"}
`.trim();
}


/**
 * ==========================================
 * RANGE में आने पर भेजा जाने वाला ALERT
 * ==========================================
 */
function createRangeAlertMessage(rateData) {

    return `
🚨 <b>LIMIT HIT</b> 🚨
अबे सुन! भाव तेरी range में घुस गया है 🔥

💰 <b>18K सोना:</b> ₹${formatCurrency(rateData.rate)} प्रति ग्राम
🎯 सीमा पूरी: ₹${formatCurrency(config.minRate)} – ₹${formatCurrency(config.maxRate)}
📈 High: ₹${formatCurrency(rateData.high)} | 📉 Low: ₹${formatCurrency(rateData.low)}

कृपया भाव चेक कर ले।
`.trim();
}


export async function checkRate() {


    try {

        const rateData = await fetchRateData();

        const rate = rateData.rate;

        const insideRange = isRateInRange(rate);


        const liveMessage =
            createLiveRateMessage(rateData);

        await sendTelegramMeme("regular", liveMessage);



        if (insideRange && !isInsideRange) {

            const alertMessage =
                createRangeAlertMessage(rateData);

            await sendTelegramMeme("limit", alertMessage);
        }



        isInsideRange = insideRange;


    } catch (error) {

        console.error(
            error
        );

    }
}
