import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { clearSession, saveSession } from "../src/auth/auth-session.ts";
import { createWebSocketStatusStore } from "../src/hooks/web-socket/web-socket-status-store.ts";

class FakeWebSocket {
  static instances = [];
  static failConstruction = false;
  closeCalls = 0;
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;

  constructor(url, protocols) {
    if (FakeWebSocket.failConstruction) throw new Error("Connection unavailable");
    this.url = url;
    this.protocols = protocols;
    FakeWebSocket.instances.push(this);
  }
  open() { this.onopen?.({}); }
  message(data) { this.onmessage?.({ data }); }
  fail() {
    this.onerror?.({});
    this.onclose?.({ code: 1006 });
  }
  close() { this.closeCalls++; }
}

const session = (token = "test-token", expiresAt = Date.now() + 3600000) => ({
  accessToken: token,
  expiresAt: new Date(expiresAt).toISOString(),
  user: { id: "test-user" },
});
let store;
let originals;

beforeEach(t => {
  originals = Object.fromEntries(["window", "sessionStorage", "WebSocket"].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const storage = new Map();
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: new EventTarget() },
    sessionStorage: { configurable: true, value: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    } },
    WebSocket: { configurable: true, value: FakeWebSocket },
  });
  FakeWebSocket.instances = [];
  FakeWebSocket.failConstruction = false;
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1000000 });
  saveSession(session());
  store = createWebSocketStatusStore(() => new URL("ws://localhost:5173/ws"));
});

afterEach(() => {
  store.dispose();
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

test("Strict Mode setup/cleanup/setup opens one socket without interrupting a handshake", t => {
  const cleanup = store.subscribe(() => {});
  cleanup();
  store.subscribe(() => {});
  assert.equal(FakeWebSocket.instances.length, 0);
  t.mock.timers.tick(1);
  assert.equal(FakeWebSocket.instances.length, 1);
  assert.equal(FakeWebSocket.instances[0].closeCalls, 0);
});

test("unmount before deferred startup opens no socket", t => {
  store.subscribe(() => {})();
  t.mock.timers.tick(1);
  assert.equal(FakeWebSocket.instances.length, 0);
});

test("the footer and drive panel share updates and one authenticated connection", t => {
  let footerUpdates = 0;
  let driveUpdates = 0;
  const stopFooter = store.subscribe(() => footerUpdates++);
  store.subscribe(() => driveUpdates++);
  t.mock.timers.tick(1);
  assert.equal(FakeWebSocket.instances.length, 1);
  const socket = FakeWebSocket.instances[0];
  assert.deepEqual(socket.protocols, ["pocketspace", "bearer.test-token"]);
  socket.open();
  socket.message("server-state:Idle");
  assert.deepEqual(store.getSnapshot(), { status: "Connected", serverState: "Idle" });
  assert.equal(footerUpdates, 2);
  assert.equal(driveUpdates, 2);
  stopFooter();
  t.mock.timers.tick(1);
  assert.equal(socket.closeCalls, 0);
});

test("route changes reuse even a still-connecting socket", t => {
  const stop = store.subscribe(() => {});
  t.mock.timers.tick(1);
  stop();
  store.subscribe(() => {});
  t.mock.timers.tick(1);
  assert.equal(FakeWebSocket.instances.length, 1);
  assert.equal(FakeWebSocket.instances[0].closeCalls, 0);
});

test("a real disconnect retries once, backs off, and recovers status", t => {
  store.subscribe(() => {});
  t.mock.timers.tick(1);
  const first = FakeWebSocket.instances[0];
  first.open();
  first.message("server-state:Idle");
  first.fail();
  assert.deepEqual(store.getSnapshot(), { status: "Disconnected", serverState: null });
  assert.equal(first.closeCalls, 0);
  t.mock.timers.tick(999);
  assert.equal(FakeWebSocket.instances.length, 1);
  t.mock.timers.tick(1);
  const second = FakeWebSocket.instances[1];
  second.fail();
  t.mock.timers.tick(1999);
  assert.equal(FakeWebSocket.instances.length, 2);
  t.mock.timers.tick(1);
  const third = FakeWebSocket.instances[2];
  third.open();
  third.message("server-state:Cleaning");
  assert.deepEqual(store.getSnapshot(), { status: "Connected", serverState: "Cleaning" });
  third.fail();
  t.mock.timers.tick(1000);
  assert.equal(FakeWebSocket.instances.length, 4);
});

test("logout closes the shared connection and login uses the new token", t => {
  store.subscribe(() => {});
  t.mock.timers.tick(1);
  const old = FakeWebSocket.instances[0];
  const staleOpen = old.onopen;
  const staleClose = old.onclose;
  old.open();
  clearSession();
  assert.equal(old.closeCalls, 1);
  assert.equal(store.getSnapshot().status, "Disconnected");
  t.mock.timers.tick(30000);
  assert.equal(FakeWebSocket.instances.length, 1);
  saveSession(session("new-token"));
  t.mock.timers.tick(1);
  staleOpen();
  staleClose();
  assert.equal(store.getSnapshot().status, "Disconnected");
  assert.deepEqual(FakeWebSocket.instances[1].protocols, ["pocketspace", "bearer.new-token"]);
  FakeWebSocket.instances[1].open();
  assert.equal(store.getSnapshot().status, "Connected");
});

test("expired sessions do not reconnect", t => {
  saveSession(session("short-lived", Date.now() + 100));
  store.subscribe(() => {});
  t.mock.timers.tick(1);
  FakeWebSocket.instances[0].fail();
  t.mock.timers.tick(30000);
  assert.equal(FakeWebSocket.instances.length, 1);
});

test("final unmount cancels retries and closes the connection", t => {
  const stop = store.subscribe(() => {});
  t.mock.timers.tick(1);
  FakeWebSocket.instances[0].open();
  stop();
  t.mock.timers.tick(1);
  assert.equal(FakeWebSocket.instances[0].closeCalls, 1);
  saveSession(session("next-token"));
  t.mock.timers.tick(30000);
  assert.equal(FakeWebSocket.instances.length, 1);
  assert.equal(store.getSnapshot().status, "Disconnected");
});

test("unmount during a retry cancels it", t => {
  const stop = store.subscribe(() => {});
  t.mock.timers.tick(1);
  FakeWebSocket.instances[0].fail();
  stop();
  t.mock.timers.tick(30000);
  assert.equal(FakeWebSocket.instances.length, 1);
});

test("constructor failures recover without throwing into React", t => {
  FakeWebSocket.failConstruction = true;
  store.subscribe(() => {});
  t.mock.timers.tick(1);
  assert.equal(store.getSnapshot().status, "Disconnected");
  FakeWebSocket.failConstruction = false;
  t.mock.timers.tick(1000);
  assert.equal(FakeWebSocket.instances.length, 1);
});
