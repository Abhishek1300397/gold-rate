import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TELEGRAM_CAPTION_LIMIT = 1024;

const MEDIA_EXTENSIONS = new Set([
    ".gif",
    ".mp4",
    ".webm",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
]);

const REGULAR_NAME_PATTERN = /ga+reeb|h[io]ove/i;

/**
 * Local meme clips for Telegram alerts.
 *
 * Put files here (or in src/memes/):
 *   jo-gaareeb-hove.mp4  — regular live-rate poll (name matches gareeb/gaareeb/hove/hiove)
 *   limit-hit.mp4        — range/limit-reached alert (the other clip)
 *
 * Binaries are optional in git; the monitor still runs and falls back to text
 * if a clip is missing.
 */
export function getMemeDir() {
    for (const name of ["meme", "memes"]) {
        const dir = path.join(__dirname, name);

        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            return dir;
        }
    }

    return path.join(__dirname, "meme");
}

function listMediaFiles(dir) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return [];
    }

    return fs
        .readdirSync(dir)
        .filter((name) => {
            if (name.startsWith(".")) {
                return false;
            }

            return MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase());
        })
        .map((name) => path.join(dir, name))
        .sort((a, b) =>
            path.basename(a).localeCompare(path.basename(b), "en")
        );
}

export function isRegularMemeName(filename) {
    return REGULAR_NAME_PATTERN.test(path.basename(filename));
}

/**
 * Map on-disk clips: gareeb/hove name → regular poll; remaining file → limit.
 */
export function resolveMemePaths(dir = getMemeDir()) {
    const files = listMediaFiles(dir);
    const namedRegular = files.filter((file) => isRegularMemeName(file));
    const others = files.filter((file) => !isRegularMemeName(file));

    let regular = null;
    let limit = null;

    if (namedRegular.length >= 1) {
        regular = namedRegular[0];
        limit = others[0] || namedRegular[1] || null;
    } else if (files.length >= 2) {
        regular = files[0];
        limit = files[1];
    } else if (files.length === 1) {
        regular = files[0];
    }

    return {
        dir,
        regular,
        limit,
        files
    };
}

export function telegramSendForFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".gif") {
        return {
            method: "sendAnimation",
            field: "animation",
            mime: "image/gif"
        };
    }

    if (ext === ".mp4") {
        return {
            method: "sendVideo",
            field: "video",
            mime: "video/mp4"
        };
    }

    if (ext === ".webm") {
        return {
            method: "sendVideo",
            field: "video",
            mime: "video/webm"
        };
    }

    if (ext === ".png") {
        return {
            method: "sendPhoto",
            field: "photo",
            mime: "image/png"
        };
    }

    if (ext === ".webp") {
        return {
            method: "sendPhoto",
            field: "photo",
            mime: "image/webp"
        };
    }

    if (ext === ".jpg" || ext === ".jpeg") {
        return {
            method: "sendPhoto",
            field: "photo",
            mime: "image/jpeg"
        };
    }

    return null;
}

export function splitCaption(caption) {
    const text = caption ?? "";

    if (text.length <= TELEGRAM_CAPTION_LIMIT) {
        return { caption: text, followUp: null };
    }

    return { caption: null, followUp: text };
}
