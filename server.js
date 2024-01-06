import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

let waitingPlayer = null;
const matches = {};

const app = express();
app.use(cors()); // Enable CORS for all routes
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow the frontend URL
    methods: ["GET", "POST"],
  },
});

// Function to generate a unique match ID
const generateMatchId = () => `match-${Date.now()}`;

// Generates a random sequence of numbers
function generateRandomNumbers(length) {
  let numbers = "";
  for (let i = 0; i < length; i++) {
    numbers += Math.floor(Math.random() * 10).toString();
  }
  return numbers;
}

// Generates a random sequence of letters
function generateRandomLetters(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let letters = "";
  for (let i = 0; i < length; i++) {
    letters += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return letters;
}

function generateGameData(gameType) {
  return gameType === "numbers"
    ? generateRandomNumbers(10)
    : generateRandomLetters(10);
}

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinMatchmaking", (playerId) => {
    if (!waitingPlayer) {
      waitingPlayer = { playerId, socketId: socket.id };
    } else {
      const matchId = generateMatchId();
      matches[matchId] = {
        players: [waitingPlayer, { playerId, socketId: socket.id }],
        gameType: null,
        isReady: [false, false],
      };

      // Have both players join the room named after the matchId
      io.to(socket.id).socketsJoin(matchId);
      io.to(waitingPlayer.socketId).socketsJoin(matchId);

      // Notify both players they've been matched
      io.to(socket.id).emit("matched", matchId);
      io.to(waitingPlayer.socketId).emit("matched", matchId);

      waitingPlayer = null;
    }
  });

  socket.on("gameChoice", ({ matchId, playerId, gameType }) => {
    const match = matches[matchId];
    if (match) {
      // Find the index of the player who made the choice
      const playerIndex = match.players.findIndex(
        (p) => p.playerId === playerId
      );

      if (playerIndex !== -1) {
        // Update the game choice for the player
        match.players[playerIndex].gameType = gameType;

        // Notify the opponent about the game choice
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        const opponent = match.players[opponentIndex];
        if (opponent) {
          io.to(opponent.socketId).emit("opponentGameChoice", gameType);
        }
      }
    }
  });

  socket.on("playerReady", ({ matchId, playerId }) => {
    const match = matches[matchId];
    if (match) {
      // Find the index of the player who sent the "playerReady" event
      const playerIndex = match.players.findIndex(
        (p) => p.playerId === playerId
      );

      if (playerIndex !== -1) {
        // Mark the player as ready
        match.isReady[playerIndex] = true;

        // Notify the opponent about the player's readiness
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        const opponent = match.players[opponentIndex];
        io.to(opponent.socketId).emit("opponentReady");

        // Check if both players are ready
        if (match.isReady.every((r) => r)) {
          const playerGameChoice = match.players[0].gameType;
          const opponentGameChoice = match.players[1].gameType;

          if (playerGameChoice === opponentGameChoice && playerGameChoice) {
            let countdown = 5;
            const countdownInterval = setInterval(() => {
              console.log(
                `Emitting countdown: ${countdown} for match ${matchId}`
              );
              io.to(matchId).emit("countdownUpdate", countdown);
              countdown--;

              if (countdown < 0) {
                clearInterval(countdownInterval);
                const gameData = generateGameData(playerGameChoice);
                console.log(
                  `Starting game for match ${matchId} with data: ${gameData}`
                );
                io.to(matchId).emit("startGame", gameData);
                // Start the 60-second memorization countdown
                let memorizationCountdown = 5;
                const memorizationInterval = setInterval(() => {
                  console.log(
                    `Memorization countdown: ${memorizationCountdown} for match ${matchId}`
                  );
                  io.to(matchId).emit(
                    "memorizationCountdownUpdate",
                    memorizationCountdown
                  );
                  memorizationCountdown--;

                  if (memorizationCountdown < 0) {
                    clearInterval(memorizationInterval);

                    // Start the 10-second recall countdown
                    let recallCountdown = 4;
                    const recallInterval = setInterval(() => {
                      io.to(matchId).emit(
                        "recallCountdownUpdate",
                        recallCountdown
                      );
                      recallCountdown--;

                      if (recallCountdown < 0) {
                        clearInterval(recallInterval);
                        // Proceed to the actual recall phase
                        let recallStageCountdown = 10;
                        const recallStageInterval = setInterval(() => {
                          io.to(matchId).emit(
                            "startRecallPhase",
                            recallStageCountdown
                          );
                          recallStageCountdown--;

                          if (recallStageCountdown < 0) {
                            clearInterval(recallStageInterval);
                            // Proceed to result phase

                            io.to(matchId).emit("resultPhase", matchId);
                          }
                        }, 1000);
                      }
                    }, 1000);
                  }
                }, 1000);
              }
            }, 1000);
          }
        }
      }
    }
  });

  socket.on("startGame", (gameType) => {
    const sequence =
      gameType === "numbers"
        ? generateRandomNumbers(10)
        : generateRandomLetters(10);
    io.to(socket.id).emit("gameData", sequence);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
    Object.keys(matches).forEach((matchId) => {
      const match = matches[matchId];
      const playerIndex = match.players.findIndex(
        (p) => p.socketId === socket.id
      );
      if (playerIndex !== -1) {
        const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
        const otherPlayer = match.players[otherPlayerIndex];
        io.to(otherPlayer.socketId).emit("opponentDisconnected");
        delete matches[matchId]; // Clean up the match entry
      }
    });

    if (waitingPlayer && waitingPlayer.socketId === socket.id) {
      waitingPlayer = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
