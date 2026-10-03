import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/services/thumbnail-service.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
let fetches = 0;
globalThis.window = new EventTarget();
globalThis.createImageBitmap = async () => ({ width: 1200, height: 800, close() {} });
globalThis.document = { createElement: () => ({
  getContext: () => ({ drawImage() {} }),
  toDataURL: () => "data:image/webp;base64,small-thumbnail",
}) };
const prelude = `
const AUTH_CHANGED_EVENT = "auth-changed";
const previewKind = () => "image";
const visualBlob = async () => { globalThis.__fetches(); return new Blob(["image"]); };
`;
globalThis.__fetches = () => { fetches++; };
const { cachedThumbnail, loadThumbnail } = await import(`data:text/javascript;base64,${Buffer.from(prelude + compiled).toString("base64")}`);

test("thumbnail survives a card remount without loading its photo again", async () => {
  const file = { name: "photo.jpg", relativePath: "album/photo.jpg", size: 5, lastModified: "today" };
  const first = await loadThumbnail(file);
  assert.equal(cachedThumbnail(file), first);
  assert.equal(await loadThumbnail(file), first);
  assert.equal(fetches, 1);
  window.dispatchEvent(new Event("auth-changed"));
  assert.equal(cachedThumbnail(file), undefined);
  await loadThumbnail(file);
  assert.equal(fetches, 2);
});
