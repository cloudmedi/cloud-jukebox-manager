const calculateChunkSize = (fileSize) => {
  if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB for small files
  if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB for medium files
  return 2 * 1024 * 1024; // 2MB for large files
};

module.exports = {
  calculateChunkSize
};