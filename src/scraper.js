
import axios from "axios";
import { config } from "./config.js";


/**
 * Fetch live gold rate
 */
export async function fetchRateData() {

  const url = `${config.sourceUrl}?_=${Date.now()}`;

  try {

    console.log(
      `[SCRAPER] Fetching live rate...`
    );


    const response = await axios.get(url, {

      timeout: 15000,

      family: 4,

      headers: {
        "Accept": "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }

    });


    if (response.status !== 200) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const text = response.data;


    if (!text || !text.trim()) {

      throw new Error(
        "Empty response received"
      );

    }


    return parseResponse(text);

  } catch (error) {

    if (error.code === "ECONNABORTED") {

      throw new Error(
        "Pankaj Chain request timed out"
      );

    }


    if (error.response) {

      throw new Error(
        `Pankaj Chain HTTP ${error.response.status}`
      );

    }


    throw new Error(
      `Pankaj Chain connection failed: ${error.message}`
    );

  }
}


/**
 * Parse Pankaj Chain response
 */
function parseResponse(text) {

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);


  const targetName = normalize(
    config.targetName
  );


  for (const line of lines) {

    const columns = line.split(/\t+/);


    if (columns.length < 6) {
      continue;
    }


    const id = columns[0].trim();
    const name = columns[1].trim();


    if (
      normalize(name) !== targetName
    ) {
      continue;
    }


    /*
     * Source format:
     *
     * ID
     * NAME
     * -
     * CURRENT RATE
     * HIGH
     * LOW
     */

    const rate = parseNumber(columns[3]);
    const high = parseNumber(columns[4]);
    const low = parseNumber(columns[5]);


    if (rate === null) {

      throw new Error(
        `Invalid current rate: ${line}`
      );

    }


    return {

      id,

      name,

      rate,

      high,

      low,

      rawLine: line,

      checkedAt: new Date()

    };

  }


  throw new Error(
    `Target rate not found: ${config.targetName}`
  );
}


/**
 * Normalize text
 */
function normalize(value) {

  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

}


/**
 * Convert string to number
 */
function parseNumber(value) {

  if (!value) {
    return null;
  }


  const cleaned = value.trim();


  if (cleaned === "-") {
    return null;
  }


  const number = Number(cleaned);


  return Number.isFinite(number)
    ? number
    : null;

}
