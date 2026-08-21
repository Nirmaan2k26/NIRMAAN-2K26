(() => {
  const PLAYER_KEY = "aa_players_fixed_excel_v2";
  const STATE_KEY = "aa_state_fixed_excel_v2";

  let socket = null;
  let reconnectTimer = null;
  let applyingRemote = false;

  function getWebSocketUrl() {
    const protocol =
      location.protocol === "https:" ? "wss:" : "ws:";

    return `${protocol}//${location.host}/ws`;
  }

  function dispatchRealtimeUpdate() {
    /*
      Notify every page that new remote data
      has arrived from the Cloudflare server.
    */

    window.dispatchEvent(
      new Event("nirmaan-realtime-update")
    );

    /*
      Also trigger the existing storage-based
      listeners used by the application.
    */

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STATE_KEY,
        newValue: localStorage.getItem(STATE_KEY),
        storageArea: localStorage
      })
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: PLAYER_KEY,
        newValue: localStorage.getItem(PLAYER_KEY),
        storageArea: localStorage
      })
    );
  }

  function connect() {
    if (
      socket &&
      (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    try {
      socket = new WebSocket(
        getWebSocketUrl()
      );

      socket.addEventListener(
        "open",
        () => {

          console.log(
            "[NIRMAAN] Real-time connected"
          );

        }
      );

      socket.addEventListener(
        "message",
        event => {

          try {

            const msg =
              JSON.parse(event.data);


            /*
              COMPLETE SERVER SNAPSHOT
            */
if (msg.type === "snapshot") {

  const localPlayers =
    localStorage.getItem(PLAYER_KEY);

  const localState =
    localStorage.getItem(STATE_KEY);

  let keepLocalPlayers = false;
  let keepLocalState = false;

  try {
    const lp =
      JSON.parse(localPlayers || "[]");

    const rp =
      JSON.parse(msg.players || "[]");

    keepLocalPlayers =
      Array.isArray(lp) &&
      lp.length > 0 &&
      Array.isArray(rp) &&
      rp.length === 0;

  } catch (_) {}

  try {
    const ls =
      JSON.parse(localState || "{}");

    const rs =
      JSON.parse(msg.state || "{}");

    keepLocalState =
      Array.isArray(ls.teams) &&
      ls.teams.length > 0 &&
      (!Array.isArray(rs.teams) ||
       rs.teams.length === 0);

  } catch (_) {}

  applyingRemote = true;

  try {

    if (
      !keepLocalPlayers &&
      msg.players !== null &&
      msg.players !== undefined
    ) {
      localStorage.setItem(
        PLAYER_KEY,
        String(msg.players)
      );
    }

    if (
      !keepLocalState &&
      msg.state !== null &&
      msg.state !== undefined
    ) {
      localStorage.setItem(
        STATE_KEY,
        String(msg.state)
      );
    }

  } finally {

    applyingRemote = false;

  }

  /*
    If server is empty but local Admin data exists,
    send local data to the server instead of losing it.
  */

  if (keepLocalPlayers) {
    sendUpdate(
      PLAYER_KEY,
      localPlayers
    );
  }

  if (keepLocalState) {
    sendUpdate(
      STATE_KEY,
      localState
    );
  }

  dispatchRealtimeUpdate();

  return;
}
            /*
              SINGLE STORAGE UPDATE
            */

            if (msg.type === "set") {

              applyingRemote = true;

              try {

                if (msg.value === null) {

                  localStorage.removeItem(
                    msg.key
                  );

                } else {

                  localStorage.setItem(
                    msg.key,
                    String(msg.value)
                  );

                }

              } finally {

                applyingRemote = false;

              }


              /*
                Immediately refresh the UI.
              */

              dispatchRealtimeUpdate();

              return;
            }

          } catch (error) {

            applyingRemote = false;

            console.error(
              "[NIRMAAN] Realtime message error:",
              error
            );

          }

        }
      );


      socket.addEventListener(
        "close",
        () => {

          socket = null;

          scheduleReconnect();

        }
      );


      socket.addEventListener(
        "error",
        () => {

          try {

            socket.close();

          } catch (_) {}

        }
      );

    } catch (error) {

      console.error(
        "[NIRMAAN] Realtime connection error:",
        error
      );

      scheduleReconnect();

    }
  }


  function scheduleReconnect() {

    if (reconnectTimer)
      return;


    reconnectTimer =
      setTimeout(
        () => {

          reconnectTimer = null;

          connect();

        },
        2000
      );
  }


  function sendUpdate(
    key,
    value
  ) {

    if (
      applyingRemote ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }


    try {

      socket.send(
        JSON.stringify({
          type: "set",
          key,
          value
        })
      );

    } catch (_) {}

  }


  /*
    Keep original browser localStorage functions.
  */

  const originalSetItem =
    Storage.prototype.setItem;

  const originalRemoveItem =
    Storage.prototype.removeItem;


  Storage.prototype.setItem =
    function(key, value) {

      originalSetItem.call(
        this,
        key,
        value
      );


      if (
        this === localStorage &&
        !applyingRemote &&
        (
          key === PLAYER_KEY ||
          key === STATE_KEY
        )
      ) {

        sendUpdate(
          key,
          String(value)
        );

      }

    };


  Storage.prototype.removeItem =
    function(key) {

      originalRemoveItem.call(
        this,
        key
      );


      if (
        this === localStorage &&
        !applyingRemote &&
        (
          key === PLAYER_KEY ||
          key === STATE_KEY
        )
      ) {

        sendUpdate(
          key,
          null
        );

      }

    };


  /*
    Public realtime API.
  */

  window.NIRMAANRealtime = {

    isConnected() {

      return (
        socket !== null &&
        socket.readyState === WebSocket.OPEN
      );

    },


    reconnect() {

      try {

        if (socket)
          socket.close();

      } catch (_) {}


      socket = null;

      connect();

    }

  };


  /*
    Start connection.
  */

  connect();

})();
