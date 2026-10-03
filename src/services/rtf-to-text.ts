// A text-only RTF preview. Formatting and embedded objects are intentionally omitted.
export function rtfToText(input: string): string {
  const hiddenDestinations = new Set(["fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header", "footer", "fldinst"]);
  const output: string[] = [];
  const states: Array<{ hidden: boolean; fallback: number }> = [];
  let hidden = false;
  let fallback = 1;
  let skipFallback = 0;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === "{") { states.push({ hidden, fallback }); continue; }
    if (character === "}") {
      const previous = states.pop();
      hidden = previous?.hidden ?? false;
      fallback = previous?.fallback ?? 1;
      continue;
    }
    if (character === "\r" || character === "\n") continue;
    if (character !== "\\") {
      if (skipFallback) skipFallback--;
      else if (!hidden) output.push(character);
      continue;
    }
    const next = input[++index];
    if (!next) break;
    if (next === "'" && /^[0-9a-fA-F]{2}$/.test(input.slice(index + 1, index + 3))) {
      const byte = Number.parseInt(input.slice(index + 1, index + 3), 16);
      index += 2;
      if (skipFallback) skipFallback--;
      else if (!hidden) output.push(new TextDecoder("windows-1252").decode(new Uint8Array([byte])));
      continue;
    }
    if (!/[a-zA-Z]/.test(next)) {
      if (next === "*") hidden = true;
      else if (next === "~" && !hidden) output.push("\u00a0");
      else if (next === "-" && !hidden) output.push("\u00ad");
      else if (next === "_" && !hidden) output.push("\u2011");
      else if ((next === "\\" || next === "{" || next === "}") && !hidden) output.push(next);
      continue;
    }
    let end = index;
    while (end < input.length && /[a-zA-Z]/.test(input[end])) end++;
    const word = input.slice(index, end);
    let numberEnd = end;
    if (input[numberEnd] === "-") numberEnd++;
    while (numberEnd < input.length && /[0-9]/.test(input[numberEnd])) numberEnd++;
    const number = numberEnd > end ? Number(input.slice(end, numberEnd)) : undefined;
    index = numberEnd - 1;
    if (input[numberEnd] === " ") index++;
    if (hiddenDestinations.has(word)) hidden = true;
    else if (word === "uc" && number !== undefined) fallback = Math.max(0, Math.min(number, 10));
    else if (word === "u" && number !== undefined) {
      if (!hidden) output.push(String.fromCharCode((number + 65536) % 65536));
      skipFallback = fallback;
    } else if (!hidden && (word === "par" || word === "line")) output.push("\n");
    else if (!hidden && word === "tab") output.push("\t");
  }
  return output.join("").replace(/\n{3,}/g, "\n\n").trim();
}
