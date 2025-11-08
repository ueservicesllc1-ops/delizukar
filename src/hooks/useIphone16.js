import { useEffect, useState } from 'react';

const matchesIphone16Viewport = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window.opera ?? '');
  if (!/iPhone/i.test(userAgent)) {
    return false;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const viewportMatches =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 393px) and (max-height: 852px)').matches;

  return pixelRatio >= 3 && viewportMatches;
};

const useIphone16 = () => {
  const [isIphone16, setIsIphone16] = useState(() => matchesIphone16Viewport());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setIsIphone16(matchesIphone16Viewport());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isIphone16;
};

export default useIphone16;

