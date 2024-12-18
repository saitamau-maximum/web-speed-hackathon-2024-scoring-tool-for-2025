import { setTimeout as setTimeoutPromise } from 'node:timers/promises';

/*
  A modification of https://github.com/TheBrainFamily/wait-for-expect/blob/6be6e2ed8e47fd5bc62ab2fc4bd39289c58f2f66/src/index.ts
  Which is exported by pptr-testing-library, but has two issues:
  - Timeout not adhered to with long promises. https://github.com/TheBrainFamily/wait-for-expect/issues/35
  - No return value. https://github.com/testing-library/pptr-testing-library/issues/73
*/

interface Options {
  interval?: number;
  timeout?: number;
}

/**
 * Waits for the expectation to pass and returns a Promise
 *
 * @param  expectation  Function  Expectation that has to complete without throwing
 * @param  timeout  Number  Maximum wait interval, 4500ms by default
 * @param  interval  Number  Wait-between-retries interval, 50ms by default
 * @return  Promise  Promise to return a callback result
 */
export async function waitFor(expectation: () => void | Promise<unknown>, options: Options = {}): Promise<void> {
  const { interval = 50, timeout = 60 * 1000 } = options;
  if (interval < 1) {
    throw new Error('Interval set to a number smaller than 1 ms.');
  }
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const rejectOrRerun = (error: Error) => {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed >= timeout) {
        reject(error);
        return;
      }
      setTimeout(runExpectation, interval);
    };
    async function runExpectation() {
      try {
        const timeElapsed = Date.now() - startTime;
        const result = await Promise.race([
          Promise.resolve(expectation()).then(() => void 0),
          setTimeoutPromise(Math.max(0, timeout - timeElapsed)).then(() => {
            return Promise.reject(new Error('Timeout.'));
          }),
        ]);
        resolve(result);
      } catch (error) {
        rejectOrRerun(error as Error);
      }
    }
    setTimeout(runExpectation, 0);
  });
}
