# Integration Testing

Integration testing involves constructing the program structure while simultaneously conducting tests to uncover errors associated with module interfacing.

## Importance of Integration Testing

* Different modules are usually developed by different teams of developers.
* Unit testing is performed on individual modules in a controlled environment using:

    * Test drivers
    * Stubs
* Some modules are more error-prone than others.
* Integration testing ensures that combined modules work correctly together.

## Objectives of Integration Testing

* Combine modules in an incremental manner.
* Ensure newly added modules function correctly.
* Verify that new modules do not negatively affect already integrated modules.

---

# Integration Testing Techniques

The main techniques used in integration testing are:

* Big-Bang Testing
* Incremental Testing

    * Top-down approach
    * Bottom-up approach
* Sandwich Testing

---

# 1. Big-Bang Testing

## Procedure

* Perform unit testing for each individual module.
* Use:

    * A driver module
    * Several stub modules
* Combine all modules at once to form the complete system.

## Observations

* Requires more effort overall.
* Interface mismatches and incorrect assumptions between modules are detected late.
* Debugging is more difficult compared to incremental approaches.
* May require less machine time.
* Suitable when parallel development activities are possible.

---

# 2. Incremental Testing

Incremental testing integrates modules step-by-step rather than all at once.

---

## 2.1 Top-Down Integration Testing

### Approach

* Uses a hierarchical strategy starting from the top (main control module).

### Process

* The main control module acts as the driver.
* Stubs are used for all directly subordinate modules.
* Subordinate stubs are gradually replaced with actual components.
* Testing is performed after each module is integrated.
* Regression testing may be used after each integration step.

### Strategies

* Depth-first integration
* Breadth-first integration

---

## 2.2 Bottom-Up Integration Testing

### Process

* Low-level modules are grouped into clusters.
* A driver is created to manage test inputs and outputs.
* Each cluster is tested individually.
* Drivers are removed once testing is complete.
* Clusters are progressively combined moving upward in the system hierarchy.

---

# 3. Sandwich Testing

## Overview

* A hybrid approach combining both top-down and bottom-up testing.

## Structure

* **Bottom layer:** uses bottom-up integration
* **Top layer:** uses top-down integration
* **Middle layer:** uses big-bang integration