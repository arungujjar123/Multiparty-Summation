import { multiplicationReshare, reconstructFromTshares } from "./src/lib/math/resharing";
import { createShares, localSumShares, toBig } from "./src/lib/math/shamir";
import { lagrangeAtZero } from "./src/lib/math/lagrange";

async function testBoth() {
  const p = 11n;
  const n = 7;
  const t = 3;
  const s1 = 4n;
  const s2 = 2n;

  console.log(`Parameters: p=${p}, n=${n}, t=${t}, s1=${s1}, s2=${s2}`);

  // Create shares for secrets with specific coefficients
  const g1 = createShares(s1, n, t, p, 123, [2n, 3n]);
  const g2 = createShares(s2, n, t, p, 456, [3n, 1n]);

  const fShares = g1.shares.map((s) => s.y);
  const gShares = g2.shares.map((s) => s.y);

  console.log("f(y_i):", fShares.map((v) => v.toString()).join(", "));
  console.log("g(y_i):", gShares.map((v) => v.toString()).join(", "));

  // Summation
  const hSum = localSumShares(fShares, gShares, p);
  console.log("h_sum(y_i):", hSum.map((v) => v.toString()).join(", "));
  const sumRecon = lagrangeAtZero(
    hSum.slice(0, t).map((y, i) => ({ x: BigInt(i + 1), y })),
    p
  );
  console.log("Reconstructed Sum:", sumRecon.toString());

  // Multiplication
  // Using manual coefficients for z_i(x) from the image
  const manualZCoeffs: bigint[][] = [
    [1n, 2n], // z1
    [3n, 1n], // z2
    [2n, 2n], // z3
    [2n, 3n], // z4
    [5n, 1n], // z5
    [2n, 1n], // z6
    [1n, 5n], // z7
  ];

  const result = multiplicationReshare(fShares, gShares, t, p, 789, manualZCoeffs);
  console.log("h_prod(y_i):", result.h.map((v) => v.toString()).join(", "));
  console.log("Expected Mul Product:", (s1 * s2) % p);
  console.log(
    "Reconstructed Mul from result.Tshares:",
    reconstructFromTshares(result.Tshares, t, p).toString()
  );

  console.log("Tshares:", result.Tshares.map((v) => v.toString()).join(", "));
}

testBoth().catch(console.error);
