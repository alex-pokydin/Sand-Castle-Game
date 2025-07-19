export function supportsVibration(): boolean {
  // Check for vibration API and that we are on a mobile-like device where vibration makes sense
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const hasVibrate = 'vibrate' in navigator;
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent);
  return hasVibrate && isMobile;
} 