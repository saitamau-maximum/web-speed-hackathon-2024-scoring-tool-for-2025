import type { Result } from 'lighthouse';

type Options = {
  isUserflow: boolean;
};

export function calculateHackathonScore(audits: Result['audits'], { isUserflow }: Options): number {
  // Each metric is within [0, 1] and with up to two fractional digits.
  // https://github.com/GoogleChrome/lighthouse/blob/516d32c7f66a0ffcfe7fbfc8bb40849699f769dc/core/audits/audit.js#L83-L110
  //
  // Calculate a score using the same weights as Lighthouse 10 without rounding to get more precised performance score.
  // https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/#lighthouse-10
  //
  // To avoid hiccups related to floating-point arithmetic, all metrics are firstly scaled up by 100.

  if (isUserflow) {
    const score =
      (audits['total-blocking-time']?.score ?? 0) * 100 * 25 +
      (audits['interaction-to-next-paint']?.score ?? 0) * 100 * 25;
    return score;
  }

  const score =
    (audits['first-contentful-paint']?.score ?? 0) * 100 * 10 +
    (audits['speed-index']?.score ?? 0) * 100 * 10 +
    (audits['largest-contentful-paint']?.score ?? 0) * 100 * 25 +
    (audits['total-blocking-time']?.score ?? 0) * 100 * 30 +
    (audits['cumulative-layout-shift']?.score ?? 0) * 100 * 25;
  return score;
}
