import { useState, useEffect } from 'react';

interface RateLimitConfig {
  key: string;
  maxAttempts: number;
  timeWindowMs: number;
}

export const useRateLimit = ({ key, maxAttempts, timeWindowMs }: RateLimitConfig) => {
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem(`rate_limit_${key}`);
    if (storedData) {
      const { attempts: storedAttempts, timestamp, lockoutEnd } = JSON.parse(storedData);
      const now = Date.now();

      if (lockoutEnd && now < lockoutEnd) {
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);
        setAttempts(storedAttempts);
      } else if (now - timestamp < timeWindowMs) {
        setAttempts(storedAttempts);
      } else {
        // Reset if time window passed
        localStorage.removeItem(`rate_limit_${key}`);
      }
    }
  }, [key, timeWindowMs]);

  const recordAttempt = () => {
    const now = Date.now();
    let newAttempts = attempts + 1;
    let newLockoutEnd = null;

    if (newAttempts >= maxAttempts) {
      setIsLocked(true);
      newLockoutEnd = now + timeWindowMs;
      setLockoutEndTime(newLockoutEnd);
    }

    setAttempts(newAttempts);
    localStorage.setItem(
      `rate_limit_${key}`,
      JSON.stringify({
        attempts: newAttempts,
        timestamp: now,
        lockoutEnd: newLockoutEnd,
      })
    );
  };

  const resetAttempts = () => {
    setAttempts(0);
    setIsLocked(false);
    setLockoutEndTime(null);
    localStorage.removeItem(`rate_limit_${key}`);
  };

  return {
    isLocked,
    attempts,
    recordAttempt,
    resetAttempts,
    lockoutEndTime,
    remainingAttempts: Math.max(0, maxAttempts - attempts),
  };
};
