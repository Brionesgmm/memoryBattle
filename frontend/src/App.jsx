import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [matchId, setMatchId] = useState(null); // State to store matchId
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [gameType, setGameType] = useState("");
  const [gameData, setGameData] = useState(""); // State to store game data
  const [showDisconnectionMessage, setShowDisconnectionMessage] =
    useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("matched", (receivedMatchId) => {
      setIsSearching(false);
      setIsMatched(true);
      setMatchId(receivedMatchId); // Store the received matchId
    });

    newSocket.on("startGame", (data) => {
      // Handle the game start here
      setGameData(data);
    });

    newSocket.on("opponentDisconnected", () => {
      setIsMatched(false);
      setIsSearching(false);
      setShowDisconnectionMessage(true);
      setTimeout(() => setShowDisconnectionMessage(false), 3000);
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
    socket.emit("gameChoice", { matchId, playerId, gameType: choice });
  };

  const handleReady = () => {
    const playerId = localStorage.getItem("playerId");
    socket.emit("playerReady", { matchId, playerId });
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
      {gameData && <p>Memorize this: {gameData}</p>}
    </div>
  );
};

export default App;
