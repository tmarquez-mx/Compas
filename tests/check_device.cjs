"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { functionSource } = require("./support/source.cjs");
const html = fs.readFileSync(
    process.argv[2] || path.resolve(__dirname, "../dist/index.html"),
    "utf8",
  ),
  core = html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1],
  ui = html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1],
  unit = {};
vm.createContext(unit);
vm.runInContext(functionSource(ui, "isHandheld"), unit);
function detected(device) {
  unit.device = device;
  return vm.runInContext("isHandheld(device)", unit);
}
let count = 0;
function check(label, fn) {
  fn();
  count++;
  console.log("OK " + label);
}
const phoneAgents = [
  {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    platform: "iPhone",
    maxTouchPoints: 5,
  },
  {
    userAgent:
      "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
  },
  {
    userAgent:
      "Mozilla/5.0 (Linux; Android 15; Tablet) AppleWebKit/537.36 Chrome/140.0",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
  },
  {
    userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)",
    platform: "iPad",
    maxTouchPoints: 5,
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 5,
  },
  {
    userAgent: "A browser with hints",
    userAgentData: { mobile: true },
    platform: "unknown",
    maxTouchPoints: 0,
  },
];
const desktops = [
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) Chrome/140.0",
    platform: "MacIntel",
    maxTouchPoints: 0,
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0",
    platform: "Win32",
    maxTouchPoints: 10,
    userAgentData: { mobile: false },
  },
  {
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0",
    platform: "Linux x86_64",
    maxTouchPoints: 0,
  },
];
check(
  "Teléfonos y tabletas se identifican por dispositivo, incluido iPadOS con agente de Mac",
  () => {
    for (const agent of phoneAgents)
      assert.equal(detected(agent), true, agent.userAgent);
  },
);
check(
  "Computadoras con pantalla táctil o ventana estrecha siguen admitidas",
  () => {
    for (const agent of desktops)
      assert.equal(detected(agent), false, agent.userAgent);
    assert.equal(
      detected({ ...desktops[0], innerWidth: 390, screen: { width: 390 } }),
      false,
    );
    assert.equal(detected({}), false);
  },
);
check(
  "Arranque real en móvil muestra instrucciones antes de acceder a almacenamiento o fotos",
  () => {
    for (const navigator of phoneAgents) {
      const calls = [],
        document = {
          body: { innerHTML: "Pantalla de la aplicación anterior" },
          title: "Compás",
        },
        context = {
          navigator,
          document,
          TextEncoder,
          TextDecoder,
          Uint8Array,
          DataView,
          Date,
          Math,
          Set,
          Map,
          JSON,
          Intl,
        };
      context.window = context;
      for (const name of ["localStorage", "indexedDB"])
        Object.defineProperty(context, name, {
          get() {
            calls.push(name);
            throw new Error("No debe acceder a " + name);
          },
        });
      Object.defineProperty(navigator, "locks", {
        configurable: true,
        get() {
          calls.push("locks");
          throw new Error("No debe solicitar edición");
        },
      });
      vm.createContext(context);
      vm.runInContext(core, context);
      const originalStart = context.CompasStorage.startStorage;
      context.CompasStorage.startStorage = (...args) => {
        calls.push("startStorage");
        return originalStart(...args);
      };
      vm.runInContext(ui, context);
      assert.deepEqual(calls, []);
      assert(document.body.innerHTML.includes('class="device-notice"'));
      assert(
        document.body.innerHTML.includes("Compás se usa en una computadora"),
      );
      assert(document.body.innerHTML.includes("Compas.html"));
      assert(document.body.innerHTML.includes(".json"));
      assert(document.body.innerHTML.includes("no sincroniza"));
      assert(!document.body.innerHTML.includes("<button"));
      assert.equal(document.title, "Compás · abre en una computadora");
    }
  },
);
check(
  "Arranque real de computadora estrecha continúa hacia la bitácora",
  () => {
    const calls = [],
      marker = new Error("Arranque de computadora alcanzado"),
      context = {
        navigator: desktops[0],
        innerWidth: 390,
        document: {
          querySelector() {
            return { content: "0.3.7" };
          },
          body: { innerHTML: "Original" },
        },
        CompasCore: {
          demo() {
            return { project: { id: "example" } };
          },
        },
        CompasStorage: {
          startStorage() {
            calls.push("startStorage");
            throw marker;
          },
        },
      };
    context.window = context;
    Object.defineProperty(context, "localStorage", {
      get() {
        calls.push("localStorage");
        return null;
      },
    });
    vm.createContext(context);
    assert.throws(
      () => vm.runInContext(ui, context),
      (error) => error === marker,
    );
    assert.deepEqual(calls, ["localStorage", "startStorage"]);
    assert.equal(context.document.body.innerHTML, "Original");
  },
);
console.log(count + " comprobaciones de uso en computadora superadas.");
