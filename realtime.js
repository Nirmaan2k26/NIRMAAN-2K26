(() => {
  const PLAYER_KEY = "aa_players_fixed_excel_v2";
  const STATE_KEY = "aa_state_fixed_excel_v2";

  const isTeamViewer =
    location.pathname.toLowerCase().includes("team-view.html");

  let socket = null;
  let connected = false;
  let applyingRemote = false;

  function send(key, value) {
    if (!connected || applyingRemote || !socket) return;

    try {
      socket.send(JSON.stringify({
        type: "set",
        key,
        value
      }));
    } catch (_) {}
  }

  function connect() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${location.host}/ws`;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        connected = true;
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type !== "snapshot" && msg.type !== "set") return;

          applyingRemote = true;

          if (
            msg.type === "snapshot" &&
            msg.players !== undefined &&
            msg.players !== null
          ) {
            localStorage.setItem(
              PLAYER_KEY,
              typeof msg.players === "string"
                ? msg.players
                : JSON.stringify(msg.players)
            );
          }

          if (
            msg.type === "snapshot" &&
            msg.state !== undefined &&
            msg.state !== null
          ) {
            localStorage.setItem(
              STATE_KEY,
              typeof msg.state === "string"
                ? msg.state
                : JSON.stringify(msg.state)
            );
          }

          if (msg.type === "set" && msg.key && msg.value !== undefined) {
            localStorage.setItem(msg.key, msg.value);
          }

          applyingRemote = false;

          window.dispatchEvent(
            new StorageEvent("storage", {
              key: msg.key || null,
              newValue: msg.value || null,
              storageArea: localStorage
            })
          );

          if (isTeamViewer && typeof window.loadState === "function") {
            window.loadState();
          }
        } catch (_) {
          applyingRemote = false;
        }
      };

      socket.onclose = () => {
        connected = false;
        socket = null;

        setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        connected = false;
      };
    } catch (_) {
      connected = false;
      setTimeout(connect, 2000);
    }
  }

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    if (
      this === localStorage &&
      !applyingRemote &&
      (key === PLAYER_KEY || key === STATE_KEY)
    ) {
      send(key, String(value));
    }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemoveItem.call(this, key);

    if (
      this === localStorage &&
      !applyingRemote &&
      (key === PLAYER_KEY || key === STATE_KEY)
    ) {
      send(key, null);
    }
  };

  window.NIRMAANRealtime = {
    isConnected: () => connected,
    reconnect: connect
  };

  connect();
})();
