/**
 * Browser entry for @midnight-ntwrk/onchain-runtime-v3.
 * Same strategy as ledger-v8.browser.mjs — see that file for rationale.
 */
import * as bg from "../../node_modules/@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.js";
import { WASM_BASE64 } from "./generated/onchain-runtime-wasm-base64.mjs";

export * from "../../node_modules/@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.js";

(function instantiateSync() {
  const binary = Uint8Array.from(atob(WASM_BASE64), (c) => c.charCodeAt(0));
  const mod = new WebAssembly.Module(binary);
  const imports = {};
  for (const imp of WebAssembly.Module.imports(mod)) {
    if (imp.module !== "./midnight_onchain_runtime_wasm_bg.js") {
      throw new Error(`Unmapped WASM import namespace: ${imp.module}`);
    }
    const exported = bg[imp.name];
    if (typeof exported !== "function") {
      throw new Error(`Missing WASM import ${imp.name}`);
    }
    (imports[imp.module] ??= {})[imp.name] = exported;
  }
  const instance = new WebAssembly.Instance(mod, imports);
  bg.__wbg_set_wasm(instance.exports);
  if (typeof instance.exports.__wbindgen_start === "function") {
    instance.exports.__wbindgen_start();
  }
})();
