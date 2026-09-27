import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/request-notifications.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { registerRequestNotifications, notifyRequestError, notifyRequestSuccess,
  notifyUnreportedRequestError } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('request errors keep their action title and server detail until dismissed', () => {
  const errors = [];
  const successes = [];
  const unregister = registerRequestNotifications({ error: config => errors.push(config), success: config => successes.push(config) });

  const failure = new Error('The seven-day restore period has ended.');
  notifyRequestError('POST', '/space/trash/item-1/restore', {}, failure);
  assert.deepEqual(errors[0], {
    key: undefined,
    message: 'Could not restore item',
    description: 'The seven-day restore period has ended.',
    duration: 0,
  });
  notifyUnreportedRequestError('POST', '/space/trash/item-1/restore', {}, failure);
  assert.equal(errors.length, 1);

  notifyRequestSuccess('DELETE', '/space/trash/item-1');
  assert.deepEqual(successes[0], { message: 'Item permanently deleted', duration: 3 });
  notifyRequestSuccess('GET', '/space/trash');
  notifyRequestSuccess('POST', '/download');
  assert.equal(successes.length, 1);
  unregister();
});

test('favorite errors use the requested action and read failures share a key', () => {
  const errors = [];
  const unregister = registerRequestNotifications({ error: config => errors.push(config) });
  notifyRequestError('PUT', '/space/files/abc/favorite', { isFavorite: false }, new Error('File not found.'));
  notifyRequestError('GET', '/space/folder-info?relativePath=photos', undefined, new Error('Folder not found.'));
  assert.equal(errors[0].message, 'Could not remove from favorites');
  assert.equal(errors[1].key, 'GET:/space/folder-info?relativePath=photos');
  assert.equal(errors[1].duration, 0);
  unregister();
});
