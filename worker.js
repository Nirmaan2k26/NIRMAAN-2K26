import { DurableObject } from "cloudflare:workers";

const PLAYER_KEY = "players";
const STATE_KEY = "state";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("WebSocket endpoint", { status: 426 });
      }

      const id = env.AUCTION.idFromName("nirmaan-2k26");
      const room = env.AUCTION.get(id);

      return room.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export class AuctionRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);

    const players = await this.ctx.storage.get(PLAYER_KEY);
    const state = await this.ctx.storage.get(STATE_KEY);

    server.send(
      JSON.stringify({
        type: "snapshot",
        players: players ?? null,
        state: state ?? null
      })
    );

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws, message) {
    try {
      const msg =
        typeof message === "string"
          ? JSON.parse(message)
          : JSON.parse(new TextDecoder().decode(message));

      if (msg.type !== "set") return;

      let storageKey = null;
      let clientKey = null;

      if (
        msg.key === "players" ||
        msg.key === "aa_players_fixed_excel_v2"
      ) {
        storageKey = PLAYER_KEY;
        clientKey = "aa_players_fixed_excel_v2";
      }

      if (
        msg.key === "state" ||
        msg.key === "aa_state_fixed_excel_v2"
      ) {
        storageKey = STATE_KEY;
        clientKey = "aa_state_fixed_excel_v2";
      }

      if (!storageKey) return;

      if (msg.value === null) {
        await this.ctx.storage.delete(storageKey);
      } else {
        await this.ctx.storage.put(storageKey, String(msg.value));
      }

      const outgoing = JSON.stringify({
        type: "set",
        key: clientKey,
        value: msg.value
      });

      for (const peer of this.ctx.getWebSockets()) {
        if (peer === ws) continue;

        try {
          peer.send(outgoing);
        } catch (_) {}
      }
    } catch (_) {}
  }

  async webSocketClose(ws, code, reason, wasClean) {
    try {
      ws.close(code, reason);
    } catch (_) {}
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, "WebSocket error");
    } catch (_) {}
  }
}
