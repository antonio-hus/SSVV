package org.example;

import io.qameta.allure.junit5.AllureJunit5;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Same scenarios as {@code Lab02_BBT_Form.xlsx} (Req_EC_TC, Req_BVA_TC, Req_EC_BVA_all_TC).
 */
@ExtendWith(AllureJunit5.class)
class GiveBonusFormSpecificationTest {

    private static void assertSpec(
            List<Employee> employees, List<Sale> sales, int expectedCode, List<Employee> expectedEmployees) {
        GiveBonusResult r = GiveBonusEngine.apply(employees, sales);
        assertEquals(expectedCode, r.code());
        assertEquals(expectedEmployees, r.employees());
    }

    @Test
    @DisplayName("FORM TC1 — eligible non-manager, salary ≤ 5000 → +1000")
    void form_tc1() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 3000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 4000)));
    }

    @Test
    @DisplayName("FORM TC2 — nE = 0 → code 1")
    void form_tc2() {
        GiveBonusResult r = GiveBonusEngine.apply(List.of(), List.of(new Sale("d1", 1000)));
        assertEquals(1, r.code());
        assertEquals(List.of(), r.employees());
    }

    @Test
    @DisplayName("FORM TC3 — nS = 0 → code 1")
    void form_tc3() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 3000)),
                List.of(),
                1,
                List.of(new Employee("Alice", "d1", "engineer", 3000)));
    }

    @Test
    @DisplayName("FORM TC4 — manager, salary < 5000 → +500")
    void form_tc4() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "manager", 3000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "manager", 3500)));
    }

    @Test
    @DisplayName("FORM TC5 — non-manager, salary > 5000 → +500")
    void form_tc5() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 6000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 6500)));
    }

    @Test
    @DisplayName("FORM TC6 — only employees in winning department get bonus")
    void form_tc6() {
        assertSpec(
                List.of(
                        new Employee("Alice", "d1", "engineer", 3000),
                        new Employee("Bob", "d2", "engineer", 4000)),
                List.of(new Sale("d1", 2000), new Sale("d2", 1000)),
                0,
                List.of(
                        new Employee("Alice", "d1", "engineer", 4000),
                        new Employee("Bob", "d2", "engineer", 4000)));
    }

    @Test
    @DisplayName("FORM TC7 — winning dept has no employees → code 2")
    void form_tc7() {
        List<Employee> emps = List.of(
                new Employee("Alice", "d1", "engineer", 3000),
                new Employee("Bob", "d1", "engineer", 4000));
        assertSpec(
                emps,
                List.of(new Sale("d1", 1000), new Sale("d2", 2000)),
                2,
                emps);
    }

    @Test
    @DisplayName("FORM TC8 — nE = 0 and nS = 0 → code 1")
    void form_tc8() {
        GiveBonusResult r = GiveBonusEngine.apply(List.of(), List.of());
        assertEquals(1, r.code());
        assertEquals(List.of(), r.employees());
    }

    @Test
    @DisplayName("FORM TC9 / BVA1 — minimal valid nE, single sale")
    void form_tc9_bva1() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 2000)),
                List.of(new Sale("d1", 500)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 3000)));
    }

    @Test
    @DisplayName("FORM TC10 / BVA2 — two employees, one winning dept")
    void form_tc10_bva2_twoEmp() {
        assertSpec(
                List.of(
                        new Employee("Alice", "d1", "engineer", 3000),
                        new Employee("Bob", "d2", "engineer", 4000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(
                        new Employee("Alice", "d1", "engineer", 4000),
                        new Employee("Bob", "d2", "engineer", 4000)));
    }

    @Test
    @DisplayName("FORM TC11 / BVA2 — one employee, winning dept empty → code 2")
    void form_tc11_bva2_code2() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 3000)),
                List.of(new Sale("d1", 1000), new Sale("d2", 2000)),
                2,
                List.of(new Employee("Alice", "d1", "engineer", 3000)));
    }

    @Test
    @DisplayName("FORM TC12 / BVA3 — salary 4999 → +1000")
    void form_tc12() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 4999)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 5999)));
    }

    @Test
    @DisplayName("FORM TC13 / BVA3 — salary 5000 → +1000")
    void form_tc13() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 5000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 6000)));
    }

    @Test
    @DisplayName("FORM TC14 / BVA3 — salary 5001 → +500")
    void form_tc14() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "engineer", 5001)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "engineer", 5501)));
    }

    @Test
    @DisplayName("FORM TC16 / BVA4 — manager with salary > 5000 → +500 (jar is faulty here)")
    void form_tc16_managerHighSalary() {
        assertSpec(
                List.of(new Employee("Alice", "d1", "manager", 7000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(new Employee("Alice", "d1", "manager", 7500)));
    }

    @Test
    @DisplayName("FORM TC15 — take-home sample (5 employees)")
    void form_tc15_takeHomeSample() {
        assertSpec(
                List.of(
                        new Employee("Lorelai", "d1", "manager", 4000),
                        new Employee("Luke", "d2", "f2", 4000),
                        new Employee("Lane", "d1", "f1", 1500),
                        new Employee("Jess", "d1", "f2", 4500),
                        new Employee("Logan", "d2", "f1", 400)),
                List.of(new Sale("d1", 1600), new Sale("d2", 1500)),
                0,
                List.of(
                        new Employee("Lorelai", "d1", "manager", 4500),
                        new Employee("Luke", "d2", "f2", 4000),
                        new Employee("Lane", "d1", "f1", 2500),
                        new Employee("Jess", "d1", "f2", 5500),
                        new Employee("Logan", "d2", "f1", 400)));
    }

    @Test
    @DisplayName("FORM TC17 — two managers in winning dept (high salary still +500 each)")
    void form_tc17_twoManagers() {
        assertSpec(
                List.of(
                        new Employee("Alice", "d1", "manager", 2000),
                        new Employee("Bob", "d1", "manager", 8000)),
                List.of(new Sale("d1", 1000)),
                0,
                List.of(
                        new Employee("Alice", "d1", "manager", 2500),
                        new Employee("Bob", "d1", "manager", 8500)));
    }

    @Test
    @DisplayName("Spec: sales aggregated per department")
    void spec_aggregationMultipleRowsSameDepartment() {
        assertSpec(
                List.of(new Employee("E", "d2", "f1", 1000)),
                List.of(new Sale("d1", 500), new Sale("d1", 500), new Sale("d2", 900)),
                2,
                List.of(new Employee("E", "d2", "f1", 1000)));
    }

    @Test
    @DisplayName("Spec: tie on total sale — lexicographically smallest dept wins")
    void spec_tieBreakLexicographic() {
        assertSpec(
                List.of(
                        new Employee("A", "a", "f1", 1000),
                        new Employee("B", "b", "f1", 1000)),
                List.of(new Sale("a", 500), new Sale("b", 500)),
                0,
                List.of(
                        new Employee("A", "a", "f1", 2000),
                        new Employee("B", "b", "f1", 1000)));
    }

    @ParameterizedTest(name = "Spec: manager role [{0}] → +500")
    @ValueSource(strings = {"manager", "Manager", "MANAGER"})
    @DisplayName("Spec: manager detection case-insensitive")
    void spec_managerCaseInsensitive(String fn) {
        assertSpec(
                List.of(new Employee("E", "d1", fn, 2000)),
                List.of(new Sale("d1", 100)),
                0,
                List.of(new Employee("E", "d1", fn, 2500)));
    }
}
