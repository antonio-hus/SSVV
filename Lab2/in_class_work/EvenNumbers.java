package org.example;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Reads an input file (default: {@code IN.TXT}), where:
 * - the first integer is {@code n} (number of elements),
 * - the next {@code n} integers are the array values,
 * then prints the number of even values.
 */
public final class EvenNumbers {
    private EvenNumbers() {
        // utility class
    }

    public static int countEvenNumbers(int[] values) {
        int count = 0;
        for (int v : values) {
            if (v % 2 == 0) {
                count++;
            }
        }
        return count;
    }

    public static int countEvenFromFile(Path inputFile) throws IOException {
        if (!Files.exists(inputFile)) {
            throw new IOException("Input file not found: " + inputFile);
        }

        // Read all integers (whitespace-separated) from the file.
        List<Integer> ints = new ArrayList<>();
        try (Scanner scanner = new Scanner(inputFile)) {
            scanner.useDelimiter("\\s+");
            while (scanner.hasNextInt()) {
                ints.add(scanner.nextInt());
            }
        }

        if (ints.isEmpty()) {
            throw new IllegalArgumentException("Input file is empty: " + inputFile);
        }

        int n = ints.get(0);
        if (n < 0) {
            throw new IllegalArgumentException("n must be non-negative. Found: " + n);
        }
        if (ints.size() - 1 < n) {
            throw new IllegalArgumentException(
                    "Not enough values. Expected " + n + ", found " + (ints.size() - 1));
        }

        int[] values = new int[n];
        for (int i = 0; i < n; i++) {
            values[i] = ints.get(i + 1);
        }

        return countEvenNumbers(values);
    }

    public static void main(String[] args) {
        // The assignment says to read from IN.TXT, but your run command might include "i".
        String input = "IN.TXT";
        if (args != null && args.length > 0 && args[0] != null && !args[0].isBlank()) {
            String arg = args[0].trim();
            if (!arg.equalsIgnoreCase("i")) {
                input = arg;
            }
        }

        Path inputPath = Paths.get(input);
        if (!Files.exists(inputPath)) {
            // Fallbacks:
            // 1) required default name in the current directory (IN.TXT)
            // 2) IN.TXT one directory above (common when running from `target/`)
            Path defaultInCurrentDir = Paths.get("IN.TXT");
            if (Files.exists(defaultInCurrentDir)) {
                inputPath = defaultInCurrentDir;
            } else {
                Path defaultInParentDir = Paths.get("..", "IN.TXT");
                if (Files.exists(defaultInParentDir)) {
                    inputPath = defaultInParentDir;
                }
            }
        }

        try {
            int result = countEvenFromFile(inputPath);
            System.out.println(result);
        } catch (IOException e) {
            System.err.println("Error reading input file: " + e.getMessage());
            System.exit(1);
        } catch (RuntimeException e) {
            System.err.println("Invalid input: " + e.getMessage());
            System.exit(2);
        }
    }
}

