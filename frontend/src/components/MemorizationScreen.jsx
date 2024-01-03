import React, { useState, useEffect } from "react";

const MemorizationScreen = ({
  gameData,
  memorizationTime,
  setEndMemtime,
  beginMemTime,
  endMemTime,
  setFinalMemTime,
}) => {
  console.log(gameData);

  useEffect(() => {
    let timeDifferenceInSeconds = (endMemTime - beginMemTime) / 1000; // Convert ms to seconds
    let formattedTime = parseFloat(timeDifferenceInSeconds.toFixed(2)); // Format to 2 decimal places and convert to number
    setFinalMemTime(formattedTime);
  }, [endMemTime]);

  const endMemorization = () => {
    setEndMemtime(Date.now());
  };

  const gameDataElement = gameData
    .toString()
    .split("")
    .map((el, ind) => {
      return (
        <div
          className="border border-black p-4 m-1 bg-black text-white rounded-md"
          key={ind}
        >
          {el}
        </div>
      );
    });

  return (
    <div>
      {endMemTime ? (
        <div>{memorizationTime}</div>
      ) : (
        <div className="flex flex-wrap">
          <button onClick={endMemorization}>End</button>
          {gameDataElement}
        </div>
      )}
    </div>
  );
};

export default MemorizationScreen;
