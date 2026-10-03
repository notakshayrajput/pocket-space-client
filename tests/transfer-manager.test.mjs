import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/services/transfer-manager.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const calls = [];
globalThis.window = new EventTarget();
globalThis.__upload = (file, _path, _token, signal, onProgress) => new Promise((resolve, reject) => {
  const call = { file, signal, onProgress, resolve, reject };
  calls.push(call);
  signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
});
globalThis.__download = (_path, _body, _token, signal) => new Promise((_resolve, reject) => {
  calls.push({ signal });
  signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
});
const prelude = `
const AUTH_CHANGED_EVENT = "auth-changed";
const readSession = () => ({ accessToken: "test-token" });
const clearFileCache = () => ({ type: "clear" });
const store = { dispatch() {} };
const UploadService = { uploadFile: (...args) => globalThis.__upload(...args) };
const transferRequest = (...args) => globalThis.__download(...args);
`;
const { transferManager } = await import(`data:text/javascript;base64,${Buffer.from(prelude + compiled).toString("base64")}`);
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("uploads one file at a time, reports progress, and cancels the next file", async () => {
  calls.length = 0;
  transferManager.clearForAccountChange();
  transferManager.enqueueUploads([new File(["1234567890"], "one.txt"), new File(["abc"], "two.txt")], ".");
  assert.equal(calls.length, 1);
  assert.deepEqual(transferManager.getSnapshot().map(item => item.status), ["active", "queued"]);
  calls[0].onProgress(5, 10);
  assert.equal(transferManager.getSnapshot()[0].percent, 50);
  calls[0].resolve({});
  await flush();
  assert.equal(calls.length, 2);
  assert.deepEqual(transferManager.getSnapshot().map(item => item.status), ["completed", "active"]);
  transferManager.cancel(transferManager.getSnapshot()[1].id);
  await flush();
  assert.equal(calls[1].signal.aborted, true);
  assert.deepEqual(transferManager.getSnapshot().map(item => item.status), ["completed", "cancelled"]);
});

test("cancelling a queued file does not stop the rest of the batch", async () => {
  calls.length = 0;
  transferManager.clearForAccountChange();
  transferManager.enqueueUploads([new File(["a"], "a.txt"), new File(["b"], "b.txt"), new File(["c"], "c.txt")], ".");
  transferManager.cancel(transferManager.getSnapshot()[1].id);
  calls[0].resolve({});
  await flush();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].file.name, "c.txt");
  transferManager.clearFinished();
  assert.equal(transferManager.getSnapshot().length, 3, "keep the batch count while an upload is running");
  calls[1].resolve({});
  await flush();
  transferManager.clearFinished();
  assert.equal(transferManager.getSnapshot().length, 0);
});

test("download can be cancelled while it is preparing", async () => {
  calls.length = 0;
  transferManager.clearForAccountChange();
  transferManager.enqueueDownload(["folder/file.txt"], "file.txt");
  const item = transferManager.getSnapshot()[0];
  assert.equal(item.percent, null);
  transferManager.cancel(item.id);
  await flush();
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(transferManager.getSnapshot()[0].status, "cancelled");
});

test("active transfers warn before refresh and stop warning after completion", async () => {
  calls.length = 0;
  transferManager.clearForAccountChange();
  transferManager.enqueueUploads([new File(["data"], "report.txt")], ".");
  const leaving = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(leaving);
  assert.equal(leaving.defaultPrevented, true);

  const item = transferManager.getSnapshot()[0];
  calls[0].onProgress(10, 10);
  transferManager.cancel(item.id);
  assert.equal(calls[0].signal.aborted, false, "publishing cannot be cancelled after the body is sent");
  calls[0].resolve({});
  await flush();
  const after = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(after);
  assert.equal(after.defaultPrevented, false);
});

test("download reports received bytes before starting the browser save", async t => {
  transferManager.clearForAccountChange();
  let complete;
  let reportProgress;
  const originalDownload = globalThis.__download;
  globalThis.__download = (_path, _body, _token, _signal, onProgress) => {
    reportProgress = onProgress;
    return new Promise(resolve => { complete = resolve; });
  };
  const saved = [];
  const originalDocument = globalThis.document;
  const originalSetTimeout = window.setTimeout;
  globalThis.document = {
    createElement: () => ({ click() { saved.push(this.download); }, remove() {} }),
    body: { appendChild() {} },
  };
  window.setTimeout = () => 0;
  t.mock.method(URL, "createObjectURL", () => "blob:test");
  t.after(() => {
    globalThis.document = originalDocument;
    globalThis.__download = originalDownload;
    window.setTimeout = originalSetTimeout;
  });

  transferManager.enqueueDownload(["report.txt"], "report.txt");
  reportProgress(4, 10);
  assert.equal(transferManager.getSnapshot()[0].percent, 40);
  complete({ getResponseHeader: () => 'attachment; filename="report.txt"', response: new Blob(["content"]) });
  await flush();
  assert.equal(transferManager.getSnapshot()[0].status, "completed");
  assert.deepEqual(saved, ["report.txt"]);
});
