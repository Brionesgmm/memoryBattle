import React from "react";

const ResultStage = ({ playerInputs, gameData }) => {
  const results = gameData
    .toString()
    .split("")
    .map((data, index) => {
      const userInput = playerInputs[index] || "";
      const isCorrect = data === userInput;
      return {
        data,
        userInput,
        isCorrect,
      };
    });

  const totalScore = results.reduce((score, result) => {
    return score + (result.isCorrect ? 1 : 0);
  }, 0);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Results</h2>
      <ul>
        {results.map((result, index) => (
          <li
            key={index}
            className={`p-2 ${
              result.isCorrect ? "bg-green-200" : "bg-red-200"
            } rounded-md mb-1`}
          >
            Data: <span className="font-semibold">{result.data}</span>, Your
            Input: <span className="font-semibold">{result.userInput}</span> -{" "}
            <span
              className={`${
                result.isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.isCorrect ? "Correct" : "Incorrect"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2">
        Total Score: <span className="font-bold">{totalScore}</span> /{" "}
        {results.length}
      </p>
    </div>
  );
};

export default ResultStage;
