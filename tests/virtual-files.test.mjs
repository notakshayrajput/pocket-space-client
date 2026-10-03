import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const source = await readFile(new URL("../src/components/file-explorer/virtual-files.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { virtualFileRange } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("large photo grids mount only nearby rows and preserve the full scroll height", () => {
  const range = virtualFileRange(2000, 660, "grid", 21600, 22300);
  assert.equal(range.columns, 3);
  assert.ok(range.endRow - range.startRow <= 11);
  assert.equal(range.paddingTop + (range.endRow - range.startRow) * range.rowHeight + range.paddingBottom,
    Math.ceil(2000 / 3) * 216);
});

test("grid reflow and list mode keep the visible file in range", () => {
  const narrow = virtualFileRange(500, 430, "grid", 2100, 2600);
  const wide = virtualFileRange(500, 860, "grid", 2100, 2600);
  const list = virtualFileRange(500, 430, "list", 2100, 2600);
  assert.equal(narrow.columns, 1);
  assert.equal(wide.columns, 3);
  assert.equal(list.columns, 1);
  for (const range of [narrow, wide, list]) {
    assert.ok(range.startRow * range.rowHeight <= 2100);
    assert.ok(range.endRow * range.rowHeight >= 2600);
  }
});
