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

  //   socket.on("findMatch", ({ playerId, gameType }) => {
  //     if (
  //       waitingPlayer &&
  //       waitingPlayer.gameType === gameType &&
  //       waitingPlayer.playerId !== playerId
  //     ) {
  //       const gameData = generateGameData(gameType);

  //       io.to(socket.id).emit("matchFound", "Player 2", gameData);
  //       io.to(waitingPlayer.socketId).emit("matchFound", "Player 1", gameData);

  //       waitingPlayer = null;
  //     } else {
  //       waitingPlayer = { playerId, gameType, socketId: socket.id };
  //     }
  //   });
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

      io.to(socket.id).emit("matched", matchId);
      io.to(waitingPlayer.socketId).emit("matched", matchId);

      waitingPlayer = null;
    }
  });

  socket.on("gameChoice", ({ matchId, playerId, gameType }) => {
    const match = matches[matchId];
    if (match) {
      // Store the game choice
      match.gameType = gameType;
    }
  });

  socket.on("playerReady", ({ matchId, playerId }) => {
    const match = matches[matchId];
    if (match) {
      const playerIndex = match.players.findIndex(
        (p) => p.playerId === playerId
      );
      if (playerIndex !== -1) {
        match.isReady[playerIndex] = true;

        // Check if both players are ready and have chosen the same game
        if (match.isReady.every((r) => r)) {
          // Both players are ready. Confirm if they have chosen the same game
          if (match.gameType) {
            // Start the game
            const gameData = generateGameData(match.gameType);
            match.players.forEach((player) => {
              io.to(player.socketId).emit("startGame", gameData);
            });
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
