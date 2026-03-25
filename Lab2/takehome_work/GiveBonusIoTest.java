package org.example;

import io.qameta.allure.junit5.AllureJunit5;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(AllureJunit5.class)
class GiveBonusIoTest {

    @Test
    @DisplayName("FORM TC15 — take-home sample IN.TXT / OUT.TXT round-trip")
    void tc01_fileRoundTrip_matchesProblemSample(@TempDir Path dir) throws Exception {
        String in = """
                5
                Lorelai
                d1
                manager
                4000
                Luke
                d2
                f2
                4000
                Lane
                d1
                f1
                1500
                Jess
                d1
                f2
                4500
                Logan
                d2
                f1
                400
                2
                d1
                1600
                d2
                1500
                """;
        Path inFile = dir.resolve("IN.TXT");
        Files.writeString(inFile, in);

        GiveBonusIo.InputData data = GiveBonusIo.readIn(inFile);
        GiveBonusResult result = GiveBonusEngine.apply(data.employees(), data.sales());
        Path outFile = dir.resolve("OUT.TXT");
        GiveBonusIo.writeOut(outFile, result);

        assertEquals(0, result.code());
        String expected = """
                code=0
                nE=5
                Lorelai d1 manager 4500
                Luke d2 f2 4000
                Lane d1 f1 2500
                Jess d1 f2 5500
                Logan d2 f1 400
                """;
        assertEquals(expected.replace("\n", System.lineSeparator()), Files.readString(outFile));
    }

    @Test
    @DisplayName("IN.TXT parsing — blank lines ignored (supports TC-01…TC-11 file inputs)")
    void inTxt_ignoresBlankLines() throws Exception {
        String in = """

                1

                N
                d1
                f
                1
                1
                d1
                2

                """;
        Path f = Files.createTempFile("in", ".txt");
        Files.writeString(f, in);
        GiveBonusIo.InputData data = GiveBonusIo.readIn(f);
        assertEquals(1, data.employees().size());
        assertEquals(new Employee("N", "d1", "f", 1), data.employees().get(0));
        assertEquals(List.of(new Sale("d1", 2)), data.sales());
    }
}
