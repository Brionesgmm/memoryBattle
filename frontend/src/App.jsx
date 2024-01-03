import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import MemorizationScreen from "./components/MemorizationScreen";

const GamePhase = {
  WAITING: "waiting",
  COUNTDOWN: "countdown",
  MEMORIZING: "memorizing",
  RECALL: "recall",
  // Add more phases as needed
};

const App = () => {
  const [socket, setSocket] = useState(null);
  const [matchId, setMatchId] = useState(null); // State to store matchId
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [gameType, setGameType] = useState("");
  const [gameData, setGameData] = useState(""); // State to store game data
  const [showDisconnectionMessage, setShowDisconnectionMessage] =
    useState(false);
  const [opponentGameChoice, setOpponentGameChoice] = useState("");
  const [opponentIsReady, setOpponentIsReady] = useState(false);
  const [playerIsReady, setPlayerIsReady] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [memCountdown, setMemCountdown] = useState(60);
  const [currentPhase, setCurrentPhase] = useState(GamePhase.WAITING);
  const [beginMemTime, setBeginMemtime] = useState(0);
  const [endMemTime, setEndMemtime] = useState(0);
  const [finalMemTime, setFinalMemTime] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("matched", (receivedMatchId) => {
      // Reset states for a new match
      setIsSearching(false);
      setIsMatched(true);
      setMatchId(receivedMatchId);
      setOpponentIsReady(false);
      setPlayerIsReady(false);
      setOpponentGameChoice("");
      setGameType("");
    });

    // newSocket.on("startCountdown", (data) => {
    //   setShowCountdown(true);
    //   setMemorizationData(data);
    //   setCurrentPhase(GamePhase.COUNTDOWN);
    // });

    newSocket.on("countdownUpdate", (count) => {
      console.log("Countdown update received:", count);
      setCurrentPhase(GamePhase.COUNTDOWN);
      if (count > 0) {
        setCountdown(count);
      } else {
        setShowCountdown(false);
        setCurrentPhase(GamePhase.MEMORIZING);
      }
    });

    newSocket.on("startGame", (data) => {
      setGameData(data);
      setCurrentPhase(GamePhase.MEMORIZING);
      setBeginMemtime(Date.now());
    });

    newSocket.on("memorizationCountdownUpdate", (count) => {
      setMemCountdown(count);
      if (count <= 0) {
        // Transition to the next phase (e.g., recall phase)
        setCurrentPhase(GamePhase.RECALL);
      }
    });

    newSocket.on("opponentGameChoice", (choice) => {
      setOpponentGameChoice(choice);
    });

    newSocket.on("opponentReady", () => {
      console.log("Opponent ready received");
      setOpponentIsReady(true);
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
    console.log(matchId);
    socket.emit("gameChoice", { matchId, playerId, gameType: choice });
  };

  const handleReady = () => {
    const playerId = localStorage.getItem("playerId");
    socket.emit("playerReady", { matchId, playerId });
    setPlayerIsReady(true);
  };

  const handleCountdownComplete = (data) => {
    setShowCountdown(false);
    // Transition to memorization screen with the data
  };

  const gameButtonClass = (choice) =>
    `px-4 py-2 rounded ${
      gameType === choice
        ? "bg-green-500"
        : opponentGameChoice === choice
        ? "bg-blue-500"
        : "bg-gray-200"
    }`;

  const opponentReadyButtonClass = `px-4 py-2 rounded ${
    opponentIsReady ? "bg-amber-500" : "bg-gray-200"
  }`;

  const playerReadyButtonClass = `px-4 py-2 rounded ${
    playerIsReady && gameType ? "border-2 border-green-500" : ""
  }`;

  return (
    <div className="App bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Multiplayer Game
      </h1>

      {showDisconnectionMessage && (
        <p className="text-red-500 mb-4">Your opponent has disconnected.</p>
      )}

      {!isMatched && !isSearching && (
        <button
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 ease-in-out"
          onClick={handleFindMatch}
        >
          Versus
        </button>
      )}

      {isSearching && (
        <p className="text-gray-600 mb-4">Searching for an opponent...</p>
      )}

      {isMatched && currentPhase === GamePhase.WAITING && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 rounded ${gameButtonClass("numbers")}`}
              onClick={() => handleGameChoice("numbers")}
            >
              Numbers
            </button>
            <button
              className={`py-2 px-4 rounded ${gameButtonClass("letters")}`}
              onClick={() => handleGameChoice("letters")}
            >
              Letters
            </button>
          </div>
          <div>
            <button
              className={`py-2 px-4 rounded ${opponentReadyButtonClass} ${playerReadyButtonClass}`}
              onClick={handleReady}
            >
              Ready
            </button>
          </div>
        </div>
      )}

      {currentPhase === GamePhase.COUNTDOWN && (
        <div>Countdown: {countdown}</div>
      )}

      {currentPhase === GamePhase.MEMORIZING && (
        <div>
          {!endMemTime && <div>Memorization Countdown: {memCountdown}</div>}

          <div>{finalMemTime}</div>
          <MemorizationScreen
            gameData={gameData}
            memorizationTime={memCountdown}
            setEndMemtime={setEndMemtime}
            beginMemTime={beginMemTime}
            endMemTime={endMemTime}
            setFinalMemTime={setFinalMemTime}
          />
        </div>
      )}
    </div>
  );
};

export default App;
