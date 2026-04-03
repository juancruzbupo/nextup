'use client';

import { useEffect, useState } from 'react';

function extractDominantColor(imageUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([29, 185, 84]); return; }

      // Sample at small size for performance
      canvas.width = 16;
      canvas.height = 16;
      ctx.drawImage(img, 0, 0, 16, 16);

      const data = ctx.getImageData(0, 0, 16, 16).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Skip very dark and very light pixels
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 30 && brightness < 220) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count === 0) { resolve([29, 185, 84]); return; }

      // Boost saturation slightly for more vibrant ambient
      const avg: [number, number, number] = [
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
      ];
      resolve(avg);
    };
    img.onerror = () => resolve([29, 185, 84]); // fallback to green
    img.src = imageUrl;
  });
}

export function useAlbumColor(albumArt: string | null | undefined) {
  const [color, setColor] = useState<[number, number, number]>([29, 185, 84]);

  useEffect(() => {
    if (!albumArt) return;
    extractDominantColor(albumArt).then(setColor);
  }, [albumArt]);

  return color;
}
