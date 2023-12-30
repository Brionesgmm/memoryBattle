import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [gameType, setGameType] = useState("");
  const [showDisconnectionMessage, setShowDisconnectionMessage] =
    useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("matched", () => {
      setIsSearching(false);
      setIsMatched(true);
    });

    newSocket.on("opponentDisconnected", () => {
      // Option 1: Automatic return
      setIsMatched(false);
      setIsSearching(false);
      setShowDisconnectionMessage(true);

      // Hide the message after 3 seconds
      setTimeout(() => setShowDisconnectionMessage(false), 3000);

      // Option 2: Show a message and button
      // setOpponentDisconnected(true); // You need to define this state
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("playerId")) {
      localStorage.setItem("playerId", `${Date.now()}`);
    }
  }, []);

  const handleFindMatch = () => {
    setIsSearching(true);
    const playerId = localStorage.getItem("playerId");
    socket.emit("joinMatchmaking", playerId);
  };

  const handleGameChoice = (choice) => {
    setGameType(choice);
    const playerId = localStorage.getItem("playerId");
    socket.emit("gameChoice", { playerId, gameType: choice });
  };

  const handleReady = () => {
    const playerId = localStorage.getItem("playerId");
    socket.emit("playerReady", playerId);
  };

  return (
    <div className="App">
      <h1>Multiplayer Game</h1>
      {showDisconnectionMessage && <p>Your opponent has disconnected.</p>}
      {!isMatched && !isSearching && (
        <button onClick={handleFindMatch}>Versus</button>
      )}
      {isSearching && <p>Searching for an opponent...</p>}
      {isMatched && (
        <>
          <button onClick={() => handleGameChoice("numbers")}>Numbers</button>
          <button onClick={() => handleGameChoice("letters")}>Letters</button>
          <button onClick={handleReady}>Ready</button>
        </>
      )}
    </div>
  );
};

export default App;
