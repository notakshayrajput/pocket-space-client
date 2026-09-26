import type { FileSystemEntry } from "../../types";

export type FileSortField = "name" | "size" | "lastModified" | "createdAt";
export type FileSortDirection = "asc" | "desc";

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const normalize = (value: string) => value.normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

// Allow a small number of typing errors, including a swapped adjacent pair.
function withinDistance(source: string, target: string, limit: number): boolean {
  if (Math.abs(source.length - target.length) > limit) return false;
  const rows = Array.from({ length: source.length + 1 }, () => new Array<number>(target.length + 1).fill(0));
  for (let i = 0; i <= source.length; i++) rows[i][0] = i;
  for (let j = 0; j <= target.length; j++) rows[0][j] = j;

  for (let i = 1; i <= source.length; i++) {
    for (let j = 1; j <= target.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + Number(source[i - 1] !== target[j - 1]),
      );
      if (i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[source.length][target.length] <= limit;
}

export function matchesFileName(name: string, query: string): boolean {
  const normalizedName = normalize(name);
  const words = normalizedName.split(/[\s._-]+/).filter(Boolean);
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);

  return terms.every(term => {
    if (normalizedName.includes(term)) return true;
    if (term.length < 3) return false;
    const limit = term.length >= 6 ? 2 : 1;
    return withinDistance(term, normalizedName, limit) ||
      words.some(word => withinDistance(term, word.slice(0, term.length), limit));
  });
}

const timestamp = (value?: string) => {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function filterAndSortFiles(
  files: FileSystemEntry[], query: string, field: FileSortField, direction: FileSortDirection,
): FileSystemEntry[] {
  const factor = direction === "asc" ? 1 : -1;
  return files.filter(file => matchesFileName(file.name, query)).sort((left, right) => {
    const compared = field === "name" ? nameCollator.compare(left.name, right.name)
      : field === "size" ? (left.size ?? 0) - (right.size ?? 0)
      : timestamp(left[field]) - timestamp(right[field]);
    return factor * compared || nameCollator.compare(left.name, right.name) ||
      left.relativePath.localeCompare(right.relativePath);
  });
}
