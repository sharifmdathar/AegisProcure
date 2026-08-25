/**
 * Browser entry for @midnight-ntwrk/ledger-v8.
 *
 * webpack's @webassemblyjs parser cannot parse these rustc binaries, so the
 * static `import *.wasm` entry is unusable in browser bundles. Unlike the
 * onchain-runtime shim this init must be ASYNC: Chromium forbids synchronous
 * WebAssembly compilation of buffers > 8 MB on the main thread and the binary
 * is ~10 MB. Nothing in the SDK or app touches ledger state at module-eval
 * time — first use is always a user-triggered transaction — so consumers
 * should `await whenLedgerReady()` before their first Transaction call.
 *
 * Import wiring mirrors what webpack would generate: __wbg_* helpers come
 * from the glue, snippet class-thunks resolve to plain WASM exports.
 *
 * Server builds keep the package's Node entry and are unaffected.
 */
import * as bg from "../../node_modules/@midnight-ntwrk/ledger-v8/midnight_ledger_wasm_bg.js";

export * from "../../node_modules/@midnight-ntwrk/ledger-v8/midnight_ledger_wasm_bg.js";

const WASM_URL = "/managed/wasm/midnight_ledger_wasm_bg.wasm";

let readyPromise = null;
let instance;

function startInit() {
  // Never initialized during SSR — the shim is browser-only.
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Ledger WASM shim used outside the browser"));
  }
  if (!readyPromise) {
    readyPromise = (async () => {
      const res = await fetch(WASM_URL);
      if (!res.ok) throw new Error(`Failed to load Midnight ledger WASM (${res.status})`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const mod = await WebAssembly.compile(bytes);
      const imports = {};
      for (const imp of WebAssembly.Module.imports(mod)) {
        let value;
        if (imp.module.endsWith("midnight_ledger_wasm_bg.js")) {
          value = bg[imp.name];
        } else {
          // Snippet namespaces wrap plain WASM exports; bind lazily — the
          // import value must exist before instantiation, the export only after.
          value = function lazyWasmExport() {
            return instance.exports[imp.name];
          };
        }
        if (typeof value !== "function") {
          throw new Error(`Missing WASM import ${imp.module} :: ${imp.name}`);
        }
        (imports[imp.module] ??= {})[imp.name] = value;
      }
      instance = await WebAssembly.instantiate(mod, imports);
      bg.__wbg_set_wasm(instance.exports);
      if (typeof instance.exports.__wbindgen_start === "function") {
        instance.exports.__wbindgen_start();
      }
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

/** Resolves once the ledger runtime is instantiated and usable. */
export function whenLedgerReady() {
  return startInit();
}
