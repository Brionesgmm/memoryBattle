import React from "react";

const RecallScreen = ({
  recallStageCountdown,
  playerInputs,
  setPlayerInputs,
  gameData,
}) => {
  const handleInputChange = (index, event) => {
    const newInputValues = [...playerInputs];
    newInputValues[index] = event.target.value;
    console.log(playerInputs);
    setPlayerInputs(newInputValues);
  };

  return (
    <div>
      {recallStageCountdown}
      <div>
        {gameData
          .toString()
          .split("")
          .map((data, index) => (
            <input
              key={index}
              type="text"
              value={playerInputs[index] || ""}
              onChange={(e) => handleInputChange(index, e)}
              placeholder={data}
            />
          ))}
      </div>
    </div>
  );
};

export default RecallScreen;
