export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const id = env.AUCTION.idFromName("nirmaan-2k26");
      return env.AUCTION.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export class AuctionRoom {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket endpoint", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.state.acceptWebSocket(server);

    const snapshot = await this.state.storage.get([
      "players",
      "state"
    ]);

    server.send(
      JSON.stringify({
        type: "snapshot",
        players: snapshot.players ?? null,
        state: snapshot.state ?? null
      })
    );

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws, message) {
    try {
      const msg = JSON.parse(message);

      if (msg.type !== "set") return;

      const allowedKeys = [
        "players",
        "state",
        "aa_players_fixed_excel_v2",
        "aa_state_fixed_excel_v2"
      ];

      if (!allowedKeys.includes(msg.key)) return;

      const key =
        msg.key === "aa_players_fixed_excel_v2"
          ? "players"
          : msg.key === "aa_state_fixed_excel_v2"
            ? "state"
            : msg.key;

      if (msg.value === null) {
        await this.state.storage.delete(key);
      } else {
        await this.state.storage.put(key, String(msg.value));
      }

      const out = JSON.stringify({
        type: "set",
        key:
          key === "players"
            ? "aa_players_fixed_excel_v2"
            : "aa_state_fixed_excel_v2",
        value: msg.value
      });

      for (const peer of this.state.getWebSockets()) {
        if (peer !== ws) {
          try {
            peer.send(out);
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  async webSocketClose() {}

  async webSocketError() {}
}
