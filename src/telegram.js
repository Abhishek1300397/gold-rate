
import axios from "axios";
import { config } from "./config.js";

const TELEGRAM_API =
  `https://api.telegram.org/bot${config.telegram.botToken}`;


/**
 * Send message to multiple Telegram chats
 */
export async function sendTelegramMessage(message) {

  console.log(
    `[TELEGRAM] Sending message to ${config.telegram.chatIds.length} chat(s)...`
  );


  for (const chatId of config.telegram.chatIds) {

    try {

      console.log(
        `[TELEGRAM] Sending to chat: ${chatId}`
      );


      const response = await axios.post(
        `${TELEGRAM_API}/sendMessage`,

        {
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true
        },

        {
          timeout: 15000,

          family: 4,

          headers: {
            "Content-Type": "application/json",
            "User-Agent": "GoldRateMonitor/1.0"
          }
        }
      );


      if (!response.data?.ok) {

        throw new Error(
          JSON.stringify(response.data)
        );

      }


      console.log(
        `[TELEGRAM] ✓ Sent successfully to ${chatId}`
      );


    } catch (error) {

      /*
       * Don't stop other chats if one chat fails.
       */

      if (error.response) {

        console.error(
          `[TELEGRAM] ✗ Chat ${chatId} failed:`,
          error.response.data
        );

      } else {

        console.error(
          `[TELEGRAM] ✗ Chat ${chatId} failed:`,
          error.message
        );

      }

    }

  }

}