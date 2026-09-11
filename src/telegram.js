
import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import { config } from "./config.js";
import {
    resolveMemePaths,
    splitCaption,
    telegramSendForFile
} from "./memes.js";

const TELEGRAM_API =
  `https://api.telegram.org/bot${config.telegram.botToken}`;

const REQUEST_HEADERS = {
  "User-Agent": "GoldRateMonitor/1.0"
};


async function postTelegram(chatId, method, body, extraHeaders = {}) {

  const response = await axios.post(
    `${TELEGRAM_API}/${method}`,
    body,
    {
      timeout: method === "sendMessage" ? 15000 : 60000,
      family: 4,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        ...REQUEST_HEADERS,
        ...extraHeaders
      }
    }
  );

  if (!response.data?.ok) {
    throw new Error(JSON.stringify(response.data));
  }

  return response;
}


function logSendFailure(chatId, error) {

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


async function sendTextToChat(chatId, message) {

  await postTelegram(
    chatId,
    "sendMessage",
    {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    },
    { "Content-Type": "application/json" }
  );

}


async function sendMediaToChat(chatId, filePath, bytes, caption) {

  const send = telegramSendForFile(filePath);

  if (!send) {
    throw new Error(`Unsupported meme type: ${filePath}`);
  }

  const filename = path.basename(filePath);
  const form = new FormData();
  const media = new File([bytes], filename, { type: send.mime });

  form.append("chat_id", String(chatId));
  form.append(send.field, media);

  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }

  if (send.method === "sendVideo") {
    form.append("supports_streaming", "true");
  }

  await postTelegram(chatId, send.method, form);

}


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

      await sendTextToChat(chatId, message);

      console.log(
        `[TELEGRAM] ✓ Sent successfully to ${chatId}`
      );


    } catch (error) {

      /*
       * Don't stop other chats if one chat fails.
       */

      logSendFailure(chatId, error);

    }

  }

}


/**
 * Send a local meme (GIF / video / photo) with caption to every chat.
 *
 * kind: "regular" | "limit"
 * Falls back to text if the clip is missing or media send fails.
 */
export async function sendTelegramMeme(kind, caption) {

  const memes = resolveMemePaths();
  const filePath = kind === "limit" ? memes.limit : memes.regular;
  const { caption: mediaCaption, followUp } = splitCaption(caption);

  if (!filePath) {

    console.warn(
      `[TELEGRAM] No ${kind} meme in ${memes.dir}; sending text only`
    );

    await sendTelegramMessage(caption);
    return;

  }

  console.log(
    `[TELEGRAM] Sending ${kind} meme (${path.basename(filePath)}) to ${config.telegram.chatIds.length} chat(s)...`
  );

  const bytes = await fs.readFile(filePath);

  for (const chatId of config.telegram.chatIds) {

    try {

      console.log(
        `[TELEGRAM] Sending ${kind} meme to chat: ${chatId}`
      );

      await sendMediaToChat(chatId, filePath, bytes, mediaCaption);

      if (followUp) {
        await sendTextToChat(chatId, followUp);
      }

      console.log(
        `[TELEGRAM] ✓ ${kind} meme sent to ${chatId}`
      );


    } catch (error) {

      logSendFailure(chatId, error);

      try {

        await sendTextToChat(chatId, caption);

        console.log(
          `[TELEGRAM] ✓ Text fallback sent to ${chatId}`
        );

      } catch (fallbackError) {

        logSendFailure(chatId, fallbackError);

      }

    }

  }

}
