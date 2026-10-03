import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/services/rtf-to-text.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { rtfToText } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("RTF preview keeps readable text and omits formatting tables", () => {
  const source = String.raw`{\rtf1\ansi{\fonttbl{\f0 Arial;}}Hello \b bold\b0  world.\par Second line.}`;
  assert.equal(rtfToText(source), "Hello bold world.\nSecond line.");
});

test("RTF preview handles encoded and Unicode characters", () => {
  const source = String.raw`{\rtf1\ansi Caf\'e9 \u8212? done}`;
  assert.equal(rtfToText(source), "Café — done");
});
