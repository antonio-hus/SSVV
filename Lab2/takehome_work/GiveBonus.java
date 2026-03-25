package org.example;

import java.nio.file.Path;

/**
 * Reads {@code IN.TXT}, applies {@link GiveBonusEngine}, writes {@code OUT.TXT}, exits with result code.
 */
public final class GiveBonus {

    private GiveBonus() {}

    public static void main(String[] args) throws Exception {
        Path in = Path.of("IN.TXT");
        Path out = Path.of("OUT.TXT");
        GiveBonusIo.InputData data = GiveBonusIo.readIn(in);
        GiveBonusResult result = GiveBonusEngine.apply(data.employees(), data.sales());
        GiveBonusIo.writeOut(out, result);
        System.exit(result.code());
    }
}
