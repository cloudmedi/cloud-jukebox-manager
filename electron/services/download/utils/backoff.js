const exponentialBackoff = (initialDelay, attempt, maxDelay) => {
  const delay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, maxDelay);
};

module.exports = {
  exponentialBackoff
};