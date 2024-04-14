import { exec, execSync } from "child_process";
import fs from "fs";
import http from "http";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import config from "./config.json" assert { type: "json" };

const {
  origin,
  pingEndpoint,
  port,
  loginCredentials,
  loginPage,
  authenticatedPages,
  resultsBaseDirectory,
  selectors,
} = config;

const lighthouseOptions = {
  logLevel: "info",
  output: "json",
  disableStorageReset: true, // Keep JWT-token stored in localStorage.
  onlyCategories: ["performance"],
  port: port,
};

const numberOfRuns = 5;
const current_date = new Date().toISOString().split("T")[0];
const resultsDirectory = `${resultsBaseDirectory}/${current_date}`;

// Read repository paths from .env-file.
const API_DIRECTORY = process.env.API_DIRECTORY;
const FRONTEND_DIRECTORY = process.env.FRONTEND_DIRECTORY;

// Functions.
const clearInput = async (input) => {
  await input.click({ clickCount: 3 });
  await input.press("Backspace");
};

const type = async (page, selector, value) => {
  const input = await page.$(selector);
  await clearInput(input);
  await input.type(value);
};

const login = async (browser) => {
  const page = await browser.newPage();
  await page.goto(`${origin}/${loginPage}`);

  await page.waitForSelector(selectors.email, { visible: true });

  await type(page, selectors.email, loginCredentials.email);
  await type(page, selectors.password, loginCredentials.password);

  await page.click(selectors.loginButton);
  await page.waitForNavigation();
  await page.close();
};

const initializePuppeteerBrowser = async () => {
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${port}`],
    headless: "new", // Change to boolean false to see it running in browser.
  });

  return browser;
};

const runLighthouseTest = async (url) => {
  const result = await lighthouse(url, lighthouseOptions);
  return result;
};

let resultsFolder;

const makeResultsDirectory = (folder) => {
  resultsFolder = `${resultsDirectory}/${folder}`;

  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder, { recursive: true });
  }

  const pages = [loginPage, ...authenticatedPages];
  for (const page of pages) {
    const escaped_page = page.replaceAll("/", "-");
    fs.mkdirSync(`${resultsFolder}/${escaped_page}`, { recursive: true });
  }
};

const saveResultReport = (result, page, run) => {
  const escaped_page = page.replaceAll("/", "-");
  fs.writeFileSync(
    `${resultsFolder}/${escaped_page}/report_run_${run}.${lighthouseOptions.output}`,
    result.report
  );
};

const runPerformanceTests = async (run) => {
  const browser = await initializePuppeteerBrowser();

  // Login page.
  const result = await runLighthouseTest(`${origin}/${loginPage}`);
  saveResultReport(result, loginPage, run);

  // Authenticated pages.
  await login(browser);
  for (const page of authenticatedPages) {
    const result = await runLighthouseTest(`${origin}/${page}`);
    saveResultReport(result, page, run);
  }

  await browser.close();
};

const startApi = async () => {
  const apiProcess = await exec("yarn start", {
    cwd: API_DIRECTORY,
  });

  const shutdownApi = () => {
    apiProcess.kill();
  };

  return shutdownApi;
};

const startApp = async () => {
  const frontendProcess = await exec("yarn dev", {
    cwd: FRONTEND_DIRECTORY,
  });

  const shutdownApp = () => {
    frontendProcess.kill();
  };

  return shutdownApp;
};

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const waitForServer = async (interval = 2000, attempts = 5) => {
  let count = 1;
  let isRunning = false;

  while (!isRunning && count <= attempts) {
    await sleep(interval);

    const request = await http.get(pingEndpoint, (response) => {
      response.on("data", (body) => {
        const jsonBody = JSON.parse(body);
        isRunning = jsonBody["pong"];
      });
    });

    request.on("error", (_) => {
      console.log(`API still down: attempt ${count} of ${attempts}.`);
      count++;
    });
  }

  if (!isRunning) {
    throw new Error(`API is down after ${attempts} attempts.`);
  } else {
    console.log("API is running!");
  }
};

const disableServerLogging = () => {
  if (!process.env.LOG_DISABLED) process.env.LOG_DISABLED = true;
};

const setGitBranches = ({ api, frontend }) => {
  execSync(`git checkout ${api}`, {
    cwd: API_DIRECTORY,
  });

  execSync(`git checkout ${frontend}`, {
    cwd: FRONTEND_DIRECTORY,
  });
};

const dropDatabase = async () => {
  // TODO: Implement.
};

const tests = [
  {
    folder: "original",
    branches: {
      api: "original",
      frontend: "original",
    },
  },
  {
    folder: "cybsersecurity",
    branches: {
      api: "main",
      frontend: "main",
    },
  },
];

// Run tests.
const main = async () => {
  let shutdownApi, shutdownApp;

  for (const { folder, branches } of tests) {
    console.log(`Running tests for ${folder}...`);
    try {
      setGitBranches(branches);
      await dropDatabase(); // Schema is different between branches.
      disableServerLogging();

      shutdownApi = await startApi();
      shutdownApp = await startApp();
      await waitForServer(); // API and front-end app run on async child process. This avoids a race condition.

      makeResultsDirectory(folder);
      for (let run = 1; run <= numberOfRuns; run++) {
        console.log(`Starting run ${run}/${numberOfRuns}.`);
        await runPerformanceTests(run);
      }
    } catch (error) {
      console.log(`An error occured while running tests: ${error}`);
    } finally {
      shutdownApp();
      shutdownApi();
    }
  }

  console.log(
    `Lighthouse performance tests succesfully executed! Check the directory "${resultsDirectory}" for the results.`
  );
};

main();
