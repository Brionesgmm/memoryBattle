import React, { useState, useEffect } from "react";

const Countdown = ({ initialCount = 10, onComplete, gameData }) => {
  const [startTime, setStartTime] = useState(Date.now());
  const [remainingTime, setRemainingTime] = useState(initialCount);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingSeconds = Math.max(
        initialCount - Math.floor(elapsed / 1000),
        0
      );
      setRemainingTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        onComplete(gameData);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [initialCount, onComplete, gameData, startTime]);

  return <div className="countdown">Time left: {remainingTime} seconds</div>;
};

export default Countdown;
