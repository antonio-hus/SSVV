package org.example;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class GiveBonusEngine {

    private GiveBonusEngine() {}

    public static GiveBonusResult apply(List<Employee> employees, List<Sale> sales) {
        if (employees.isEmpty() || sales.isEmpty()) {
            return new GiveBonusResult(1, List.copyOf(employees));
        }

        Map<String, Integer> totalByDept = new HashMap<>();
        for (Sale s : sales) {
            totalByDept.merge(s.department(), s.sumSale(), Integer::sum);
        }

        int maxSale = totalByDept.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        String winningDept = totalByDept.entrySet().stream()
                .filter(e -> e.getValue() == maxSale)
                .map(Map.Entry::getKey)
                .sorted()
                .findFirst()
                .orElseThrow();

        boolean anyInWinning = employees.stream().anyMatch(e -> e.department().equals(winningDept));
        if (!anyInWinning) {
            return new GiveBonusResult(2, List.copyOf(employees));
        }

        List<Employee> updated = new ArrayList<>(employees.size());
        for (Employee e : employees) {
            if (!e.department().equals(winningDept)) {
                updated.add(e);
                continue;
            }
            int bonus = (e.salary() > 5000 || isManager(e.function())) ? 500 : 1000;
            updated.add(new Employee(e.name(), e.department(), e.function(), e.salary() + bonus));
        }
        return new GiveBonusResult(0, updated);
    }

    static boolean isManager(String function) {
        return function != null && "manager".equalsIgnoreCase(function.trim());
    }
}
