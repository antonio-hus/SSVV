package org.example;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class GiveBonusIo {

    private GiveBonusIo() {}

    public static InputData readIn(Path path) throws IOException {
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        List<String> tokens = new ArrayList<>();
        for (String line : lines) {
            String t = line.trim();
            if (!t.isEmpty()) {
                tokens.add(t);
            }
        }
        int i = 0;
        int nEmployees = Integer.parseInt(tokens.get(i++));
        List<Employee> employees = new ArrayList<>();
        for (int k = 0; k < nEmployees; k++) {
            String name = tokens.get(i++);
            String department = tokens.get(i++);
            String function = tokens.get(i++);
            int salary = Integer.parseInt(tokens.get(i++));
            employees.add(new Employee(name, department, function, salary));
        }
        int nSales = Integer.parseInt(tokens.get(i++));
        List<Sale> sales = new ArrayList<>();
        for (int k = 0; k < nSales; k++) {
            String department = tokens.get(i++);
            int sumSale = Integer.parseInt(tokens.get(i++));
            sales.add(new Sale(department, sumSale));
        }
        return new InputData(employees, sales);
    }

    public static void writeOut(Path path, GiveBonusResult result) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("code=").append(result.code()).append('\n');
        sb.append("nE=").append(result.employees().size()).append('\n');
        for (Employee e : result.employees()) {
            sb.append(e.name()).append(' ')
                    .append(e.department()).append(' ')
                    .append(e.function()).append(' ')
                    .append(e.salary()).append('\n');
        }
        Files.writeString(path, sb.toString(), StandardCharsets.UTF_8);
    }

    public record InputData(List<Employee> employees, List<Sale> sales) {}
}
