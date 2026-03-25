package org.example;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EvenNumbersTest {

    @Test
    void countEvenNumbers_basic() {
        assertEquals(2, EvenNumbers.countEvenNumbers(new int[]{1, 2, 3, 4, 5}));
    }

    @Test
    void countEvenNumbers_allOdd() {
        assertEquals(0, EvenNumbers.countEvenNumbers(new int[]{1, 3, 5, 7}));
    }

    @Test
    void countEvenNumbers_allEven() {
        assertEquals(4, EvenNumbers.countEvenNumbers(new int[]{2, 4, 6, 8}));
    }

    @Test
    void countEvenNumbers_zeroIsEven() {
        assertEquals(2, EvenNumbers.countEvenNumbers(new int[]{0, 1, -2, 3}));
    }

    @Test
    void countEvenFromFile_readsNAndValues(@TempDir Path tempDir) throws IOException {
        Path file = tempDir.resolve("IN.TXT");
        Files.writeString(file, "5\n1 2 3 4 5\n");
        assertEquals(2, EvenNumbers.countEvenFromFile(file));
    }

    @Test
    void countEvenFromFile_worksWithExtraWhitespace(@TempDir Path tempDir) throws IOException {
        Path file = tempDir.resolve("IN.TXT");
        Files.writeString(file, "6\n  2   3\n4\n5 6 8   \n");
        assertEquals(4, EvenNumbers.countEvenFromFile(file));
    }

    @Test
    void countEvenFromFile_throwsWhenNotEnoughValues(@TempDir Path tempDir) throws IOException {
        Path file = tempDir.resolve("IN.TXT");
        Files.writeString(file, "3\n1 2\n");
        assertThrows(IllegalArgumentException.class, () -> EvenNumbers.countEvenFromFile(file));
    }
}

