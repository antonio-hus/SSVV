# GymTrackerPro BBT Testing Documentation

## Overview
A brief overview of the Black-Box Testing strategy applied in this project is covered inside the `GymTrackerPro_BBT_Testing_Documentation`.

## Testing Source Code
The Black-Box tests for each module of the `/gymtrackerpro/lib/` directory can be found under each specific application layer:

- For schema tests please check: `/gymtrackerpro/lib/schema/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For repository tests please check: `/gymtrackerpro/lib/repository/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For service tests please check: `/gymtrackerpro/lib/service/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For controller tests please check: `/gymtrackerpro/lib/controller/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For utility tests please check: `/gymtrackerpro/lib/__tests__/bbt/tested-filename/tested-filename.test.ts`.

## Testing Documentation
The Black-Box test documentation for each module of the `/gymtrackerpro/lib/` directory can be found under each specific application layer:

- For schema tests please check: `/gymtrackerpro/lib/schema/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For repository tests please check: `/gymtrackerpro/lib/repository/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For service tests please check: `/gymtrackerpro/lib/service/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For controller tests please check: `/gymtrackerpro/lib/controller/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For utility tests please check: `/gymtrackerpro/lib/__tests__/bbt/tested-filename/tested-modulename.xlsx`.

## Setup and Execution
To run the test suite of `/gymtrackerpro/` one shall:

1. Make sure `npm` is installed and up-to-date.
2. Run `npm install` to install all project dependencies.
3. Run `npm test` to run the Jest test suite.

Alternatively one may run the application test suite leveraging IDE tooling, 
by right-clicking on the `/gymtrackerpro/` directory and pressing `Run 'All Tests'` 
(optionally including options such as coverage).