import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";

const dataPath = "./raw/performance_testing";
const resultsPath = "./processed/performance_testing";

const metrics = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
];

const performanceTestsToCsv = async () => {
  const branches = await readdir(dataPath);

  for (const branch of branches) {
    const tests = await readdir(`${dataPath}/${branch}`);

    await mkdir(`${resultsPath}/${branch}`, { recursive: true });

    for (const test of tests) {
      await appendFile(
        `${resultsPath}/${branch}/${test}.csv`,
        `${["id", ...metrics].join(",")}\n`
      );

      const runs = await readdir(`${dataPath}/${branch}/${test}`);

      for (let run = 1; run <= runs.length; run++) {
        const data = await readFile(
          `${dataPath}/${branch}/${test}/report_run_${run}.json`
        );

        const jsonData = JSON.parse(data);

        const values = [];
        for (const metric of metrics) {
          const value = jsonData.audits[metric].numericValue;
          values.push(value);
        }

        await appendFile(
          `${resultsPath}/${branch}/${test}.csv`,
          `${run},${values.join(",")}\n`
        );
      }
    }
  }
};

const main = async () => {
  await performanceTestsToCsv();
};

main();
