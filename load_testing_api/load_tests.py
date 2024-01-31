import subprocess
import sys
import time
from datetime import date
from os import environ, getenv, listdir, makedirs
from os.path import isfile, join, splitext
from pathlib import Path

import mysql.connector
import requests
from dotenv import load_dotenv
from mysql.connector import Error

# Config and constants.
number_of_runs = 1
ping_url = "http://localhost:9000/api/health/ping"

dotenv_path = Path(".env")
scenarios_path = "./scenarios"
results_base_directory = "./results"
current_date = date.today()
results_directory = f"{results_base_directory}/{current_date}"

artillery_run = "artillery run -e development"

scenarios = sorted([file for file in listdir(scenarios_path)
                   if isfile(join(scenarios_path, file))])

# Read environment variables using .env-file.
load_dotenv(dotenv_path=dotenv_path)

DATABASE_HOST = getenv("DATABASE_HOST")
DATABASE_PORT = getenv("DATABASE_PORT")
DATABASE_NAME = getenv("DATABASE_NAME")
DATABASE_USERNAME = getenv("DATABASE_USERNAME")
DATABASE_PASSWORD = getenv("DATABASE_PASSWORD")

YARN_EXECUTABLE = getenv("YARN_EXECUTABLE")
API_DIRECTORY = getenv("API_DIRECTORY")

print("Environment variables loaded.")


# Functions.
def drop_test_database():
    config = {
        "host": DATABASE_HOST,
        "port": DATABASE_PORT,
        "user": DATABASE_USERNAME,
        "password": DATABASE_PASSWORD,
        "raise_on_warnings": True
    }

    try:
        connection = mysql.connector.connect(**config)

        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"Connected to MySQL Server version {db_info}.")
            cursor = connection.cursor()
            query = f"DROP DATABASE IF EXISTS {DATABASE_NAME};"
            cursor.execute(query)
            print(f"Database {DATABASE_NAME} succesfully dropped.")

    except Error as error:
        print(f"Error while connecting to MySQL: {error}.")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed.")


def start_api():
    env = environ.copy()
    env["LOG_DISABLED"] = "true"  # Ensure logging is disabled.

    api_process = subprocess.Popen(
        [YARN_EXECUTABLE, "start"], cwd=API_DIRECTORY, env=env)

    def shutdown_api():
        if api_process.poll() is None:
            print("Shutting down API...")
            api_process.terminate()

    return shutdown_api


def wait_for_startup(interval=1, attempts=5):
    is_running = False
    count = 1

    while not is_running and count <= attempts:
        time.sleep(interval)
        try:
            response = requests.get(url=ping_url)
            data = response.json()
            is_running = data['pong']
        except:
            print(f"API still down: attempt {count} of {attempts}.")
            count += 1

    if (not is_running):
        raise Exception(f"API is not running after {count} attempts.")
    else:
        print("API is running!")

    return


def make_results_directory():
    makedirs(results_directory, exist_ok=True)

    for filename in scenarios:
        makedirs(f"{results_directory}/{splitext(filename)[0]}", exist_ok=True)


def create_artillery_command(filename, run):
    command = artillery_run
    result_file_path = f"{results_directory}/{splitext(filename)[0]}/report_run_{run}.json"

    if not filename == "3_login.yaml":
        command = f"{command} --config ./config.yaml"

    command = f"{command} --output {result_file_path} {scenarios_path}/{filename}"
    return command


def run_testscripts_and_save_results(run):
    try:
        for filename in scenarios:
            subprocess.run(create_artillery_command(
                filename=filename, run=run), shell=True, check=True)

    except subprocess.CalledProcessError as error:
        print(f"Error while running Artillery testscripts: {error}")


# Run tests.
if len(sys.argv) == 2:
    number_of_runs = int(sys.argv[1])

for run in range(1, number_of_runs+1):
    try:
        print(f"Starting run {run}/{number_of_runs}")
        drop_test_database()
        shutdown_api = start_api()
        wait_for_startup()
        make_results_directory()
        run_testscripts_and_save_results(run=run)

    except Exception as exception:
        print(f"An exception occurred when running tests: {exception}")

    finally:
        shutdown_api()
