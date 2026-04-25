# GymTrackerPro Testing Documentation

## Overview
A comprehensive overview of the testing strategy applied in this project is available in `GymTrackerPro_Testing_Summary.pdf`. 
The testing effort includes Black-Box Testing (BBT), White-Box Testing (WBT), and Integration Testing (IT), ensuring full coverage of both functional behavior and internal implementation.

## Testing Source Code
The automated tests for the `/gymtrackerpro/lib/` directory are organized by testing level and application layer. The structure is consistent across BBT, WBT, and IT, with the only difference being the test classification path.

### Black-Box Testing (BBT)
- For schema tests please check: `/gymtrackerpro/lib/schema/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For repository tests please check: `/gymtrackerpro/lib/repository/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For service tests please check: `/gymtrackerpro/lib/service/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For controller tests please check: `/gymtrackerpro/lib/controller/__tests__/bbt/tested-filename/tested-filename.test.ts`.
- For utility tests please check: `/gymtrackerpro/lib/__tests__/bbt/tested-filename/tested-filename.test.ts`.

### White-Box Testing (WBT)
- For schema tests please check: `/gymtrackerpro/lib/schema/__tests__/wbt/tested-filename/tested-filename.test.ts`.
- For repository tests please check: `/gymtrackerpro/lib/repository/__tests__/wbt/tested-filename/tested-filename.test.ts`.
- For service tests please check: `/gymtrackerpro/lib/service/__tests__/wbt/tested-filename/tested-filename.test.ts`.
- For controller tests please check: `/gymtrackerpro/lib/controller/__tests__/wbt/tested-filename/tested-filename.test.ts`.
- For utility tests please check: `/gymtrackerpro/lib/__tests__/wbt/tested-filename/tested-filename.test.ts`.

### Integration Testing (IT)
- For schema tests please check: `/gymtrackerpro/lib/schema/__tests__/it/tested-filename/tested-filename.test.ts`.
- For repository tests please check: `/gymtrackerpro/lib/repository/__tests__/it/tested-filename/tested-filename.test.ts`.
- For service tests please check: `/gymtrackerpro/lib/service/__tests__/it/tested-filename/tested-filename.test.ts`.
- For controller tests please check: `/gymtrackerpro/lib/controller/__tests__/it/tested-filename/tested-filename.test.ts`.
- For utility tests please check: `/gymtrackerpro/lib/__tests__/it/tested-filename/tested-filename.test.ts`.

## Testing Documentation
For Black-Box Testing (BBT) and White-Box Testing (WBT) formal test design documentation (XLSX files) follows the same structure as the test implementation. Each test level is documented per module.

In the case of Integration Testing (IT) 

### Black-Box Testing (BBT)
- For schema unit test documentation please check: `/gymtrackerpro/lib/schema/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For repository unit test documentation please check: `/gymtrackerpro/lib/repository/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For service unit test documentation please check: `/gymtrackerpro/lib/service/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For controller unit test documentation please check: `/gymtrackerpro/lib/controller/__tests__/bbt/tested-filename/tested-modulename.xlsx`.
- For utility unit test documentation please check: `/gymtrackerpro/lib/__tests__/bbt/tested-filename/tested-modulename.xlsx`.

### White-Box Testing (WBT)
- For schema unit test documentation please check: `/gymtrackerpro/lib/schema/__tests__/wbt/tested-filename/tested-modulename.xlsx`.
- For repository unit test documentation please check: `/gymtrackerpro/lib/repository/__tests__/wbt/tested-filename/tested-modulename.xlsx`.
- For service unit test documentation please check: `/gymtrackerpro/lib/service/__tests__/wbt/tested-filename/tested-modulename.xlsx`.
- For controller unit test documentation please check: `/gymtrackerpro/lib/controller/__tests__/wbt/tested-filename/tested-modulename.xlsx`.
- For utility unit test documentation please check: `/gymtrackerpro/lib/__tests__/wbt/tested-filename/tested-modulename.xlsx`.

### Integration Testing (IT)
- For schema integration test documentation please check: `/gymtrackerpro/lib/schema/__tests__/it/tested-filename/tested-modulename.xlsx`.
- For repository integration test documentation please check: `/gymtrackerpro/lib/repository/__tests__/it/tested-filename/tested-modulename.xlsx`.
- For service integration test documentation please check: `/gymtrackerpro/lib/service/__tests__/it/tested-filename/tested-modulename.xlsx`.
- For controller integration test documentation please check: `/gymtrackerpro/lib/controller/__tests__/it/tested-filename/tested-modulename.xlsx`.
- For utility integration test documentation please check: `/gymtrackerpro/lib/__tests__/it/tested-filename/tested-modulename.xlsx`.

## Setup and Execution
To run the test suite of `/gymtrackerpro/` one shall:

1. Make sure `npm` is installed and up-to-date.
2. Run `npm install` to install all project dependencies.
3. Run `npm test` to run the Jest test suite.

Alternatively one may run the application test suite leveraging IDE tooling, 
by right-clicking on the `/gymtrackerpro/` directory and pressing `Run 'All Tests'` 
(optionally including options such as coverage).