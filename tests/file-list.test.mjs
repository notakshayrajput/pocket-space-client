import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortFiles, matchesFileName } from '../src/components/file-explorer/file-list.ts';

const entry = (name, size, lastModified, createdAt) => ({
  id: name,
  name,
  relativePath: name,
  isFolder: false,
  isFavorite: false,
  recentAt: createdAt,
  size,
  lastModified,
  createdAt,
});

test('filename search accepts substrings, accents, and small typing errors', () => {
  assert.equal(matchesFileName('Report-final.pdf', 'port fin'), true);
  assert.equal(matchesFileName('Report-final.pdf', 'repotr finl'), true);
  assert.equal(matchesFileName('Report.pdf', 'repotr.pdf'), true);
  assert.equal(matchesFileName('Résumé.pdf', 'resume'), true);
  assert.equal(matchesFileName('Report-final.pdf', 'holiday'), false);
  assert.equal(matchesFileName('Report-final.pdf', 'r'), true);
});

test('filter and sort uses each field and direction without changing source order', () => {
  const files = [
    entry('a10.txt', 20, '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z'),
    entry('z.txt', 5, '2026-01-03T00:00:00Z', '2026-01-04T00:00:00Z'),
    entry('a2.txt', 10, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
  ];
  const names = (field, direction, query = '') => filterAndSortFiles(files, query, field, direction).map(file => file.name);

  assert.deepEqual(names('name', 'asc'), ['a2.txt', 'a10.txt', 'z.txt']);
  assert.deepEqual(names('name', 'desc'), ['z.txt', 'a10.txt', 'a2.txt']);
  assert.deepEqual(names('size', 'desc'), ['a10.txt', 'a2.txt', 'z.txt']);
  assert.deepEqual(names('lastModified', 'desc'), ['z.txt', 'a10.txt', 'a2.txt']);
  assert.deepEqual(names('createdAt', 'asc'), ['a10.txt', 'a2.txt', 'z.txt']);
  assert.deepEqual(names('name', 'asc', 'a'), ['a2.txt', 'a10.txt']);
  assert.deepEqual(files.map(file => file.name), ['a10.txt', 'z.txt', 'a2.txt']);
});
