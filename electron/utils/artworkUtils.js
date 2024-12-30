const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:5000';

const createArtworkUrl = (artworkPath) => {
  if (!artworkPath) return null;
  
  // Eğer tam URL zaten varsa, onu kullan
  if (artworkPath.startsWith('http')) {
    return artworkPath;
  }

  // URL'yi oluştur
  const baseUrl = getBaseUrl();
  const normalizedPath = artworkPath.startsWith('/') ? artworkPath : `/${artworkPath}`;
  return `${baseUrl}${normalizedPath}`;
};

module.exports = {
  createArtworkUrl
};