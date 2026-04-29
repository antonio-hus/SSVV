# GymTrackerPro Testing Documentation

## Overview

A comprehensive overview of the Task 2 testing strategy is provided in `GymTrackerPro_Task2_Summary.pdf`.

The GymTrackerPro backend (`/gymtrackerpro/lib/`) is tested using three complementary approaches:

* **Black-Box Testing (BBT)** – validates behavior against specifications
* **White-Box Testing (WBT)** – validates internal logic and control flow
* **Integration Testing (IT)** – validates interaction between layers and full system behavior

All tests are implemented using **Jest**, with **Istanbul** for code coverage reporting.
The final test execution achieved:

* **100% Statements Coverage**
* **100% Branch Coverage**
* **100% Function Coverage**
* **100% Line Coverage**

---

## Testing Source Code Structure

Automated tests are organized by **testing type** and **application layer**, following a consistent structure across all methodologies.

### Directory Pattern

```
/gymtrackerpro/lib/<layer>/__tests__/<test-type>/<module>/<module>.test.ts
```

### Layers

* `schema`
* `repository`
* `service`
* `controller`
* `utils`

---

### Black-Box Testing (BBT)

* Schema: `/lib/schema/__tests__/bbt/...`
* Repository: `/lib/repository/__tests__/bbt/...`
* Service: `/lib/service/__tests__/bbt/...`
* Controller: `/lib/controller/__tests__/bbt/...`
* Utilities: `/lib/__tests__/bbt/...`

### White-Box Testing (WBT)

* Schema: `/lib/schema/__tests__/wbt/...`
* Repository: `/lib/repository/__tests__/wbt/...`
* Service: `/lib/service/__tests__/wbt/...`
* Controller: `/lib/controller/__tests__/wbt/...`
* Utilities: `/lib/__tests__/wbt/...`

### Integration Testing (IT)

* Repository: `/lib/repository/__tests__/it/...`
* Service: `/lib/service/__tests__/it/...`
* Controller: `/lib/controller/__tests__/it/...`

---

## Testing Documentation (XLSX Artifacts)

Each tested function/module is documented using structured XLSX files.

### Structure

```
/gymtrackerpro/lib/<layer>/__tests__/<test-type>/<module>/<module>.xlsx
```

### Coverage

* **BBT**: 103 XLSX files
* **WBT**: 103 XLSX files
* **IT**: 81 XLSX files

### Contents

* BBT:
    * Equivalence Classes (EC)
    * Boundary Values (BVA)
    * Inputs / Expected Outputs
* WBT:
    * Control Flow Graphs (CFG)
    * Cyclomatic Complexity (CC)
    * Independent Paths
* IT:
    * Integration clusters
    * Cross-layer data flow

---

## Test Execution

### Prerequisites

1. Install Node.js and ensure `npm` is up-to-date
2. Install dependencies:

```bash
npm install
```

---

## Available Test Commands

### Black-Box Testing

```bash
npm run test:bbt
npm run test:bbt:coverage
```

### White-Box Testing

```bash
npm run test:wbt
npm run test:wbt:coverage
```

### Integration Testing

#### Start test environment (Docker)

```bash
npm run test:integration:up
```

#### Run migrations and tests

```bash
npm run test:integration
```

#### Stop and clean environment

```bash
npm run test:integration:down
```

---

## Integration Test Environment

* Uses **Dockerized PostgreSQL**
* Environment variables loaded from `.env.test`
* Prisma migrations applied automatically
* Each test suite:

    * Seeds required data
    * Cleans up after execution

---

## Additional Notes

* **16 additional tests** cover singleton instantiation (repositories/services)
* These are:
    * Implementation-specific
    * Not included in formal documentation
    * Ensuring internal consistency and dependency reuse
