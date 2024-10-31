const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function dateUTCToMs(dateStr: string): number {
  const [day, month, year, time] = dateStr.split(/[\/, ]+/);
  const [hours, minutes, seconds] = time.split(":");

  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );

  const currentDate = new Date();
  const differenceInMs = currentDate.getTime() - parsedDate.getTime();

  return differenceInMs;
}

function getUnixTimeMinusSeconds(seconds: number): number {
  const currentTime = Date.now(); // Current time in milliseconds
  const timeMinusMinutes = currentTime - seconds * 1000; // Subtract minutes in milliseconds
  return Math.floor(timeMinusMinutes / 1000); // Convert to UNIX timestamp in seconds
}

export { sleep, dateUTCToMs, getUnixTimeMinusSeconds };
