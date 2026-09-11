
import { config } from "./config.js";
import { fetchRateData } from "./scraper.js";
import { sendTelegramMessage } from "./telegram.js";

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
<b>📊 18 कैरेट सोने का लाइव भाव</b>

━━━━━━━━━━━━━━━━━━

💰 <b>वर्तमान भाव:</b>
₹${formatCurrency(rateData.rate)} प्रति ग्राम

📈 <b>आज का उच्चतम भाव:</b>
₹${formatCurrency(rateData.high)} प्रति ग्राम

📉 <b>आज का न्यूनतम भाव:</b>
₹${formatCurrency(rateData.low)} प्रति ग्राम

━━━━━━━━━━━━━━━━━━

🎯 <b>आपकी निर्धारित सीमा:</b>

₹${formatCurrency(config.minRate)}
 से ₹${formatCurrency(config.maxRate)}

<b>स्थिति:</b>
${inRange ? "🟢 भाव आपकी निर्धारित सीमा में है" : "⚪ भाव अभी निर्धारित सीमा से बाहर है"}

━━━━━━━━━━━━━━━━━━

<i>अगली जानकारी 15 मिनट बाद मिलेगी।</i>
`.trim();
}


/**
 * ==========================================
 * RANGE में आने पर भेजा जाने वाला ALERT
 * ==========================================
 */
function createRangeAlertMessage(rateData) {

    return `
🚨 <b>18 कैरेट सोने के भाव की सूचना</b> 🚨

━━━━━━━━━━━━━━━━━━

🎯 <b>आपके निर्धारित भाव की सीमा पूरी हो गई है!</b>

💰 <b>वर्तमान भाव:</b>

₹${formatCurrency(rateData.rate)} प्रति ग्राम

━━━━━━━━━━━━━━━━━━

🎯 <b>आपकी निर्धारित सीमा:</b>

₹${formatCurrency(config.minRate)}
 से ₹${formatCurrency(config.maxRate)}

━━━━━━━━━━━━━━━━━━

📈 <b>आज का उच्चतम भाव:</b>
₹${formatCurrency(rateData.high)} प्रति ग्राम

📉 <b>आज का न्यूनतम भाव:</b>
₹${formatCurrency(rateData.low)} प्रति ग्राम

━━━━━━━━━━━━━━━━━━

📌 <b>सोने की श्रेणी:</b>

18 कैरेट सोना

जीएसटी 3% एवं लगभग ₹2,500 प्रति ग्राम
मेकिंग चार्ज अतिरिक्त

━━━━━━━━━━━━━━━━━━

🔔 <b>वर्तमान भाव आपकी निर्धारित सीमा में आ गया है।</b>

कृपया भाव की जांच करें।
`.trim();
}


export async function checkRate() {


    try {

        const rateData = await fetchRateData();

        const rate = rateData.rate;

        const insideRange = isRateInRange(rate);


        const liveMessage =
            createLiveRateMessage(rateData);

        await sendTelegramMessage(liveMessage);



        if (insideRange && !isInsideRange) {

            const alertMessage =
                createRangeAlertMessage(rateData);

            await sendTelegramMessage(alertMessage);
        }



        isInsideRange = insideRange;


    } catch (error) {

        console.error(
            error
        );

    }
}
