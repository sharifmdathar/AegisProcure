import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is enabled by default in Next.js 16; silence build error
  turbopack: {},
  // Midnight JS SDK uses Node.js crypto — polyfill for browser bundles
  webpack: (config, { isServer, webpack }) => {
    // @midnight-ntwrk/compact-runtime ships a malformed exports map
    // ("default" before "types"); webpack rejects it. Alias straight to the
    // dist entry so the exports field is bypassed.
    config.resolve.alias["@midnight-ntwrk/compact-runtime"] = path.resolve(
      "node_modules/@midnight-ntwrk/compact-runtime/dist/index.js"
    );
    // The @midnight-ntwrk/wallet (v5) stack pulls in a nested
    // @midnight-ntwrk/zswap that ships midnight_zswap_wasm_bg.wasm. This is a
    // wasm-bindgen module with its own JS glue, so let webpack load it via the
    // async WebAssembly pipeline instead of treating it as a plain asset.
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });
    if (!isServer) {
      const ledgerShim = path.resolve("src/shims/ledger-v8.browser.mjs");
      
      // Alias all variations of ledger-v8 module resolution to our browser shim
      config.resolve.alias["@midnight-ntwrk/ledger-v8$"] = ledgerShim;
      config.resolve.alias["@midnight-ntwrk/ledger-v8"] = ledgerShim;

      config.resolve.alias["@midnight-ntwrk/onchain-runtime-v3"] = path.resolve(
        "src/shims/onchain-runtime-v3.browser.mjs"
      );
    }
    // midnight-js-indexer-public-data-provider imports { WebSocket } from
    // 'isomorphic-ws', whose entry resolves to the 'ws' npm package that is
    // not installed here. Browsers and Node >= 22 ship a native WebSocket,
    // so point the package at a tiny shim instead.
    config.resolve.alias["isomorphic-ws"] = path.resolve("src/shims/isomorphic-ws.js");
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
