const BASE_URL = 'http://localhost:5000';

export const getArtworkUrl = (artwork: string | null | undefined): string => {
  if (!artwork) {
    return '/placeholder.svg';
  }

  // Eğer artwork zaten tam URL ise
  if (artwork.startsWith('http')) {
    return artwork;
  }

  // Eğer artwork / ile başlıyorsa
  if (artwork.startsWith('/')) {
    return `${BASE_URL}${artwork}`;
  }

  // Diğer durumlar için
  return `${BASE_URL}/${artwork}`;
};

export const handleArtworkError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const target = event.target as HTMLImageElement;
  target.src = '/placeholder.svg';
  target.onerror = null; // Sonsuz döngüyü engellemek için
};