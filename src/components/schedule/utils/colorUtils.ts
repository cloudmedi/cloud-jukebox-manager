export const generatePastelColor = (index: number) => {
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio * 360) % 360;
  const saturation = 55 + (index % 10);
  const lightness = 80 + (index % 8);
  
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const border = `hsl(${hue}, ${Math.min(saturation + 5, 100)}%, ${Math.max(lightness - 10, 0)}%)`;
  const textColor = `hsl(${hue}, 70%, 30%)`;
  
  return { 
    background,
    border,
    textColor
  };
};