import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";

const dataPath = "../data/raw/load_testing";
const resultsPath = "../data/processed/load_testing";

const metrics = [
  "min",
  "max",
  "count",
  "mean",
  "p50",
  "median",
  "p75",
  "p90",
  "p95",
  "p99",
  "p999",
];

const loadTestToCsv = async () => {
  const branches = await readdir(dataPath);

  for (const branch of branches) {
    const tests = await readdir(`${dataPath}/${branch}`);

    await mkdir(`${resultsPath}/${branch}`, { recursive: true });

    for (const test of tests) {
      await appendFile(
        `${resultsPath}/${branch}/${test}.csv`,
        `${["id", ...metrics].join(",")}\n`
      );

      const data = await readFile(`${dataPath}/${branch}/${test}`);
      const jsonData = JSON.parse(data);
      const results = jsonData.intermediate;

      // First result is empty.
      for (let index = 1; index < results.length; index++) {
        const values = [];

        for (const metric of metrics) {
          const value = results[index].summaries["http.response_time"][metric];
          values.push(value);
        }

        await appendFile(
          `${resultsPath}/${branch}/${test}.csv`,
          `${index},${values.join(",")}\n`
        );
      }
    }
  }
};

const main = async () => {
  await loadTestToCsv();
};

main();