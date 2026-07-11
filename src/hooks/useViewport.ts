import { useEffect, useState } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTouch: boolean;
}

export function useViewport(): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') return { width: 1280, height: 720, isMobile: false, isTouch: false };
    return compute();
  });
  useEffect(() => {
    const onResize = () => setInfo(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return info;
}

function compute(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
  const isMobile = width < 768 || (isTouch && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  return { width, height, isMobile, isTouch };
}