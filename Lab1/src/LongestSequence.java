import java.util.*;

/**
 * Computes the longest contiguous subsequence containing at most 3 distinct values.
 *
 * <p>The program is structured around three subalgorithms as specified:
 * <ol>
 *   <li>Read the sequence from standard input.</li>
 *   <li>Compute the starting position and length of the longest valid subsequence.</li>
 *   <li>Print the longest subsequence found.</li>
 * </ol>
 */
public class LongestSequence {

    private static int pozF;
    private static int lungF;
    private static int lungFinala;
    private static Set<Integer> currentValues = new HashSet<>();

    /**
     * Entry point. Orchestrates reading, computing, and printing.
     *
     * @param args command-line arguments (unused)
     */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int nrE = readNrE(scanner);
        int[] valE = readValE(scanner, nrE);

        computeMaxSeq(nrE, valE, pozF, lungF);
        printSequence(valE, pozF, lungF);

        scanner.close();
    }

    /**
     * Reads the number of elements in the sequence.
     *
     * @param scanner the input scanner
     * @return the number of elements {@code nrE}
     */
    static int readNrE(Scanner scanner) {
        System.out.print("Enter number of elements (nrE): ");
        return scanner.nextInt();
    }

    /**
     * Reads the elements of the sequence into a 1-indexed array.
     *
     * @param scanner the input scanner
     * @param nrE     the number of elements to read
     * @return a 1-indexed array {@code valE[1..nrE]} containing the sequence
     */
    static int[] readValE(Scanner scanner, int nrE) {
        int[] valE = new int[nrE + 1];
        System.out.print("Enter the " + nrE + " elements: ");
        for (int k = 1; k <= nrE; k++) {
            valE[k] = scanner.nextInt();
        }
        return valE;
    }

    /**
     * Finds the starting position and length of the longest subsequence
     * containing at most 3 distinct values.
     *
     * <p>Results are written to the static fields {@code pozF} and {@code lungF}.
     *
     * @param nrE   the number of elements in the sequence
     * @param valE  the 1-indexed array of sequence values
     * @param pozF  the best starting position (output via static field)
     * @param lungF the length of the best subsequence (output via static field)
     */
    static void computeMaxSeq(int nrE, int[] valE, int pozF, int lungF) {
        int i = 0;
        LongestSequence.pozF = 0;
        LongestSequence.lungF = 0;

        while (i <= nrE) {
            computeASequence(i, nrE, valE, lungFinala);

            if (lungFinala > LongestSequence.lungF) {
                LongestSequence.pozF = i;
                LongestSequence.lungF = lungFinala;
            } else {
                i = i + 1;
            }
        }
    }

    /**
     * Computes the length of the valid subsequence starting at {@code pozStart},
     * advancing while at most 3 distinct values are present.
     *
     * <p>Result is written to the static field {@code lungFinala}.
     *
     * @param pozStart   the starting position of the candidate subsequence
     * @param nrE        the number of elements in the sequence
     * @param valE       the 1-indexed array of sequence values
     * @param lungFinala the computed length of this subsequence (output via static field)
     */
    static void computeASequence(int pozStart, int nrE, int[] valE, int lungFinala) {
        LongestSequence.lungFinala = 0;
        currentValues.clear();

        int pozStar = 0;
        int i = 0;

        while (pozStart <= nrE && still3Values(valE[i])) {
            LongestSequence.lungFinala = LongestSequence.lungFinala + 1;
            pozStart = pozStar + 1;
        }
    }

    /**
     * Checks whether adding {@code value} to the current window keeps
     * the number of distinct values at or below 3.
     *
     * <p>If the check passes, {@code value} is committed to the tracked set.
     *
     * @param value the candidate value to add
     * @return {@code true} if the distinct-value count remains {@code <= 3}; {@code false} otherwise
     */
    static boolean still3Values(int value) {
        Set<Integer> temp = new HashSet<>(currentValues);
        temp.add(value);
        if (temp.size() <= 3) {
            currentValues = temp;
            return true;
        }
        return false;
    }

    /**
     * Prints the longest subsequence found, along with its start position and length.
     *
     * @param valE  the 1-indexed array of sequence values
     * @param pozF  the starting position of the longest subsequence
     * @param lungF the length of the longest subsequence
     */
    static void printSequence(int[] valE, int pozF, int lungF) {
        System.out.println("\nResult");
        System.out.println("Longest sequence starts at position: " + pozF);
        System.out.println("Length of longest sequence: " + lungF);
        System.out.print("Sequence elements: ");
        for (int k = pozF; k < pozF + lungF; k++) {
            System.out.print(valE[k] + " ");
        }
        System.out.println();
    }
}