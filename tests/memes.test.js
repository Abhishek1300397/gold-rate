import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    TELEGRAM_CAPTION_LIMIT,
    isRegularMemeName,
    resolveMemePaths,
    splitCaption,
    telegramSendForFile
} from "../src/memes.js";

function withTempDir(files, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gold-rate-memes-"));

    try {
        for (const name of files) {
            fs.writeFileSync(path.join(dir, name), Buffer.alloc(0));
        }

        fn(dir);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

test("maps gareeb/hove filename to regular and the other clip to limit", () => {
    withTempDir(
        ["limit-hit.mp4", "jo-gaareeb-hove.mp4", ".hidden.mp4", "notes.txt"],
        (dir) => {
            const resolved = resolveMemePaths(dir);

            assert.equal(
                path.basename(resolved.regular),
                "jo-gaareeb-hove.mp4"
            );
            assert.equal(path.basename(resolved.limit), "limit-hit.mp4");
            assert.equal(resolved.files.length, 2);
        }
    );
});

test("matches misspelled hiove / gareeb names as regular", () => {
    assert.equal(isRegularMemeName("gaareeb-hove.gif"), true);
    assert.equal(isRegularMemeName("jo-hiove.webm"), true);
    assert.equal(isRegularMemeName("limit-hit.mp4"), false);
});

test("uses remaining clip as limit when only one name matches", () => {
    withTempDir(["funny-limit.gif", "gareeb.mp4"], (dir) => {
        const resolved = resolveMemePaths(dir);

        assert.equal(path.basename(resolved.regular), "gareeb.mp4");
        assert.equal(path.basename(resolved.limit), "funny-limit.gif");
    });
});

test("picks telegram method from extension", () => {
    assert.deepEqual(telegramSendForFile("a.gif"), {
        method: "sendAnimation",
        field: "animation",
        mime: "image/gif"
    });
    assert.equal(telegramSendForFile("a.mp4").method, "sendVideo");
    assert.equal(telegramSendForFile("a.webm").method, "sendVideo");
    assert.equal(telegramSendForFile("a.png").method, "sendPhoto");
    assert.equal(telegramSendForFile("a.txt"), null);
});

test("keeps short captions on the media; long captions become follow-up text", () => {
    assert.deepEqual(splitCaption("short"), {
        caption: "short",
        followUp: null
    });

    const long = "x".repeat(TELEGRAM_CAPTION_LIMIT + 1);
    assert.deepEqual(splitCaption(long), {
        caption: null,
        followUp: long
    });
});

test("empty meme dir resolves to missing files", () => {
    withTempDir([], (dir) => {
        const resolved = resolveMemePaths(dir);

        assert.equal(resolved.regular, null);
        assert.equal(resolved.limit, null);
    });
});
