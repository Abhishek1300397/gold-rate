
import { config } from "./config.js";
import { checkRate } from "./monitor.js";
import { sendTelegramMessage } from "./telegram.js";




let isRunning = true;


/**
 * Run the monitoring loop.
 */
async function monitorLoop() {

  while (isRunning) {

    const startTime = Date.now();

  
    try {

      await checkRate();

    } catch (error) {

    }


    if (!isRunning) {
      break;
    }



    /*
     * Wait 5 minutes before the next check.
     */
    await sleep(config.checkIntervalMs);
  }
}


/**
 * Sleep helper.
 */
function sleep(milliseconds) {

  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });

}


/**
 * Optional startup Telegram notification.
 */
async function sendStartupMessage() {

  if (!config.sendStartupMessage) {
    return;
  }

  try {

    await sendTelegramMessage(`
<b>🟢 GOLD RATE MONITOR STARTED</b>

<b>Product:</b>
18K GOLD BASIC PRICE

<b>Target Range:</b>
₹${config.minRate.toLocaleString("en-IN")}
 - ₹${config.maxRate.toLocaleString("en-IN")}

<b>Check Interval:</b>
Every ${config.checkIntervalMs / 60000} minutes

<b>Started:</b>
${new Date().toLocaleString("en-IN")}
`.trim());

  } catch (error) {

    console.error(
      `[TELEGRAM] Startup message failed: ${error.message}`
    );

  }
}


/**
 * Graceful shutdown.
 */
function shutdown(signal) {

  console.log(`\nReceived ${signal}`);

  isRunning = false;

  console.log("Stopping monitor...");

  /*
   * Give pending operations a moment to finish.
   */
  setTimeout(() => {
    process.exit(0);
  }, 500);

}


process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});


/**
 * Start application.
 */
async function start() {

  console.log(
    `[${new Date().toLocaleString("en-IN")}] Application started`
  );

  await sendStartupMessage();

  /*
   * Start monitoring.
   *
   * First check happens immediately.
   */
  await monitorLoop();

}


start().catch(error => {

  console.error(
    "[FATAL]",
    error
  );

  process.exit(1);

});

