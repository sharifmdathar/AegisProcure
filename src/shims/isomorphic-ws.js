/** Browser/Node shim for isomorphic-ws using the runtime's native WebSocket. */
const WS = globalThis.WebSocket;

if (!WS) {
  throw new Error("No native WebSocket implementation available");
}

module.exports = WS;
module.exports.WebSocket = WS;
module.exports.default = WS;
