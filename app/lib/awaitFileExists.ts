import fs from 'fs';

/**
 * Waits for a file to exist, retrying with increasing timeouts.
 * @param filePath The path to the file to check.
 * @param waitTimesMs Array of wait times in milliseconds for each retry (default: [5000, 10000, 15000]).
 * @throws If the file does not exist after all retries.
 */
export async function waitForFileExists(filePath: string, waitTimesMs: number[] = [5000, 10000, 15000]): Promise<void> {
  const waitTimes = [...waitTimesMs];
  while (!fs.existsSync(filePath)) {
    if (waitTimes.length === 0) {
      throw new Error(`File does not exist after multiple attempts: ${filePath}`);
    }
    await new Promise(resolve => setTimeout(resolve, waitTimes.shift()));
  }
}