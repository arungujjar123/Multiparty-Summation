export const BUILT_IN_DOC_CONTENT: Record<string, string> = {
    introduction: `# Introduction

Shamir's Secret Sharing is a cryptographic scheme that splits a secret into multiple shares so that only a threshold number of shares can reconstruct it.

## Key Properties

- Threshold property: any t shares can reconstruct the secret.
- Perfect secrecy: t-1 or fewer shares reveal no information.
- Linearity: supports secure addition without interaction.
- Homomorphic behavior: operations on shares map to operations on secrets.

## Applications

- Secure storage of key material.
- Privacy-preserving analytics.
- Threshold cryptography and signing workflows.
- Secure multi-party computation (MPC).
`,
    shamir: `# Shamir's Secret Sharing Scheme

## Mathematical Foundation

Shamir's scheme is based on polynomial interpolation over finite fields. A polynomial of degree t-1 is uniquely determined by t points.

### Share Generation

1. Choose a prime p and secret s in Z_p.
2. Generate random polynomial:

   f(x) = s + a1x + a2x^2 + ... + a_(t-1)x^(t-1) (mod p)

3. Create shares: (i, f(i)) for i = 1, 2, ..., n.
4. Distribute share (i, y_i) to party i.

### Secret Reconstruction

Using Lagrange interpolation, any t shares can recover the secret:

s = f(0) = sum_j y_j * lambda_j (mod p)

where:

lambda_j = product_(k != j) (0 - x_k) / (x_j - x_k) (mod p)

## Example

Setup: secret s = 4, threshold t = 3, prime p = 11

Polynomial: f(x) = 4 + 3x + 2x^2 (mod 11)

Shares: (1,9), (2,7), (3,10), (4,5), (5,6)
`,
    summation: `# Secure Summation Protocol

Shamir's scheme is linear, so secure summation can be performed non-interactively at the share level.

## Protocol Intuition

If each party has a secret a_i and corresponding share values f_i(j), then each participant j computes:

S(j) = sum_i f_i(j)

The set of S(j) values is a valid sharing of the global sum A = sum_i a_i.

## Why This Works

- Share addition corresponds to polynomial addition.
- Polynomial addition preserves degree (t-1).
- Threshold remains unchanged after summation.

## Example

For secrets A = 2 and B = 3 in mod 7:

- f(0) = 2
- g(0) = 3
- h(x) = f(x) + g(x)
- h(0) = 2 + 3 = 5 (mod 7)

So the reconstructed sum is 5.
`,
    multiplication: `# Multiplication Protocol

Multiplication is more complex than addition because multiplying two degree-(t-1) polynomials yields degree 2(t-1).

## BGW Multiplication Flow

1. Local multiply: each party multiplies its two shares.
2. Degree issue: result is now a higher-degree sharing.
3. Resharing: each party re-shares its product contribution.
4. Degree reduction: parties combine reshared values to get back to degree t-1.

## Communication Cost

In the resharing round with n parties, each party sends to every other party, producing O(n^2) messages.

## Security Note

Correctness and privacy hold under threshold assumptions and honest-majority style conditions used by the protocol variant.
`,
    quantum: `# Quantum Protocols

Hybrid quantum protocols combine threshold secret sharing with quantum communication techniques.

## Motivation

- Improve robustness against certain attack models.
- Explore unconditional guarantees from quantum mechanics.
- Support threshold-style workflows beyond all-or-nothing designs.

## Core Ideas

- Quantum state preparation and distribution.
- Entanglement-assisted coordination.
- Measurement-based verification and reconstruction steps.

## Practical View

Quantum protocols are still research-heavy, but they provide useful insight into future secure computation systems where both classical and quantum resources are available.
`,
    security: `# Security Properties

## Confidentiality

- Any t-1 shares reveal zero information about the secret.
- Security is information-theoretic in the standard Shamir setting.

## Integrity and Robustness

- Threshold design avoids single points of trust.
- Fault tolerance depends on chosen (t, n) and adversary model.

## Operational Considerations

- Use trusted randomness for coefficients.
- Enforce modular arithmetic correctness.
- Validate share formats and participant identity.
- Protect storage and transport channels for shares.
`,
    implementation: `# Implementation

## Implementation Checklist

1. Choose prime field p.
2. Configure threshold t and number of parties n.
3. Generate cryptographically secure random coefficients.
4. Compute and distribute shares.
5. Reconstruct only when threshold condition is met.

## Engineering Tips

- Keep all arithmetic modular.
- Use tested interpolation utilities.
- Add deterministic tests for reproducibility.
- Validate edge cases (t=1, t=n, secret=0).

## Testing Focus

- Polynomial evaluation.
- Share generation and reconstruction.
- Summation correctness.
- Multiplication with resharing.
`,
    references: `# References & Further Reading

## Original Papers

### Shamir, A. (1979). "How to share a secret"

*Communications of the ACM*, 22(11), 612-613.

The foundational paper introducing (t,n) threshold secret sharing scheme.

### Ben-Or, M., Goldwasser, S., & Wigderson, A. (1988)

"Completeness theorems for non-cryptographic fault-tolerant distributed computation"

*STOC '88* - BGW protocol for secure multiplication with resharing.

### Cramer, R., Damgard, I., & Nielsen, J. B. (2015)

"Secure Multiparty Computation and Secret Sharing"

Comprehensive textbook on MPC theory and practice.

## Research Applications

- Privacy-Preserving Healthcare: Aggregate patient data without exposing individual records.
- Financial Data Analysis: Secure computation on sensitive financial information.
- Electronic Voting Systems: Threshold decryption of ballots with no single point of trust.
- Threshold Cryptography: Distributed key generation and threshold signatures.

## Online Resources

- [Wikipedia: Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
    - URL: <https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing>
    - Comprehensive overview with examples.
- [Interactive Shamir Demo](https://www.cs.tau.ac.il/~bchor/Shamir.html)
    - URL: <https://www.cs.tau.ac.il/~bchor/Shamir.html>
    - Browser-based secret sharing calculator.
- MPC Study Group Resources
  - Academic papers and implementation guides.

## Research Papers & PDFs

Download or view original research papers and technical documentation to dive deeper into the theory and implementation.

### Hybrid Quantum Protocols (2020)

Sutradhar & Om - Scientific Reports

Complete research on (t,n) threshold quantum protocols for secure multiparty summation and multiplication.

- [Download PDF](https://www.nature.com/articles/s41598-020-65871-8.pdf)
    - URL: <https://www.nature.com/articles/s41598-020-65871-8.pdf>
- [View Online](https://www.nature.com/articles/s41598-020-65871-8)
    - URL: <https://www.nature.com/articles/s41598-020-65871-8>

### How to Share a Secret (1979)

Adi Shamir - Communications of the ACM

The original groundbreaking paper introducing Shamir's Secret Sharing scheme.

- [Download PDF](https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf)
    - URL: <https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf>
- [View Online](https://dl.acm.org/doi/10.1145/359168.359176)
    - URL: <https://dl.acm.org/doi/10.1145/359168.359176>

### BGW Protocol for MPC (1988)

Ben-Or, Goldwasser, Wigderson - STOC

Foundational work on secure multi-party multiplication protocols.

- [Download PDF](https://dl.acm.org/doi/pdf/10.1145/62212.62213)
    - URL: <https://dl.acm.org/doi/pdf/10.1145/62212.62213>
- [View Online](https://dl.acm.org/doi/10.1145/62212.62213)
    - URL: <https://dl.acm.org/doi/10.1145/62212.62213>

Tip: These PDFs provide the theoretical foundation for the concepts implemented in this visualizer. They are ideal for academic study and deeper understanding.

## About This Visualizer

This educational tool was built to make Shamir secret sharing and secure multi-party computation more accessible and understandable through interactive visualization. It is based on research in secure computation and privacy-preserving protocols.
`,
};

const LEGACY_PLACEHOLDER_CONTENT: Record<string, string> = {
    introduction: `# Introduction

Shamir's Secret Sharing lets you split a secret into multiple shares so that only a threshold number of shares can reconstruct the secret.

## Key Properties

- Threshold property: any t shares can reconstruct the secret.
- Perfect secrecy: t-1 or fewer shares reveal no information.
- Linearity: supports secure addition on shares.
- Homomorphic behavior: operations on shares map to operations on secrets.
`,
    shamir: `# Shamir's Secret Sharing Scheme

## Mathematical Foundation

Shamir's scheme is based on polynomial interpolation over finite fields. A polynomial of degree t-1 is uniquely determined by t points.

### Share Generation

1. Choose a prime p and secret s in Z_p.
2. Generate random polynomial: f(x) = s + a1x + a2x^2 + ... + a_(t-1)x^(t-1) (mod p)
3. Create shares: (i, f(i)) for i = 1, 2, ..., n
4. Distribute share (i, y_i) to party i

### Secret Reconstruction

Using Lagrange interpolation, any t shares can recover the secret:

s = f(0) = sum_j y_j * lambda_j (mod p)

where lambda_j = product_(k!=j) (0 - x_k) / (x_j - x_k) (mod p)

## Example

Setup: secret s = 4, threshold t = 3, prime p = 11

Polynomial: f(x) = 4 + 3x + 2x^2 (mod 11)

Shares: (1,9), (2,7), (3,10), (4,5), (5,6)
`,
    summation: `# Secure Summation Protocol

Shamir's linearity allows secure summation without revealing private inputs.

If party i has shares f_i(j), each party locally computes:

S(j) = sum_i f_i(j)

Then the final sum is reconstructed from threshold-many S(j) values.
`,
    multiplication: `# Multiplication Protocol

Multiplication is harder than addition because multiplying two degree-(t-1) polynomials gives degree 2(t-1).

BGW-style multiplication:

1. Parties multiply local shares.
2. Parties reshare to reduce degree back to t-1.
3. Parties combine reshared values.
`,
    quantum: `# Quantum Protocols

Hybrid quantum protocols combine threshold sharing with quantum communication primitives to improve resilience and security assumptions.
`,
    security: `# Security Properties

- Information-theoretic secrecy for t-1 shares.
- No single trusted party required.
- Robustness depends on threshold selection and protocol model.
`,
    implementation: `# Implementation

Implementation checklist:

1. Choose prime field p.
2. Set (t, n) parameters.
3. Generate random coefficients securely.
4. Use safe modular arithmetic for interpolation.
5. Validate shares and inputs.
`,
    references: `# References

1. Adi Shamir, How to Share a Secret (1979).
2. Ben-Or, Goldwasser, and Wigderson, Completeness Theorems (1988).
3. Standard MPC and threshold cryptography texts.
`,
};

const LEGACY_REFERENCES_FULL_CONTENT = `# References & Further Reading

## Original Papers

### Shamir, A. (1979). "How to share a secret"

*Communications of the ACM*, 22(11), 612-613.

The foundational paper introducing (t,n) threshold secret sharing scheme.

### Ben-Or, M., Goldwasser, S., & Wigderson, A. (1988)

"Completeness theorems for non-cryptographic fault-tolerant distributed computation"

*STOC '88* - BGW protocol for secure multiplication with resharing.

### Cramer, R., Damgard, I., & Nielsen, J. B. (2015)

"Secure Multiparty Computation and Secret Sharing"

Comprehensive textbook on MPC theory and practice.

## Research Applications

- Privacy-Preserving Healthcare: Aggregate patient data without exposing individual records.
- Financial Data Analysis: Secure computation on sensitive financial information.
- Electronic Voting Systems: Threshold decryption of ballots with no single point of trust.
- Threshold Cryptography: Distributed key generation and threshold signatures.

## Online Resources

- [Wikipedia: Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
    - Comprehensive overview with examples.
- [Interactive Shamir Demo](https://www.cs.tau.ac.il/~bchor/Shamir.html)
    - Browser-based secret sharing calculator.
- MPC Study Group Resources
    - Academic papers and implementation guides.

## Research Papers & PDFs

Download or view original research papers and technical documentation to dive deeper into the theory and implementation.

### Hybrid Quantum Protocols (2020)

Sutradhar & Om - Scientific Reports

Complete research on (t,n) threshold quantum protocols for secure multiparty summation and multiplication.

- [Download PDF](https://www.nature.com/articles/s41598-020-65871-8.pdf)
- [View Online](https://www.nature.com/articles/s41598-020-65871-8)

### How to Share a Secret (1979)

Adi Shamir - Communications of the ACM

The original groundbreaking paper introducing Shamir's Secret Sharing scheme.

- [Download PDF](https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf)
- [View Online](https://dl.acm.org/doi/10.1145/359168.359176)

### BGW Protocol for MPC (1988)

Ben-Or, Goldwasser, Wigderson - STOC

Foundational work on secure multi-party multiplication protocols.

- [Download PDF](https://dl.acm.org/doi/pdf/10.1145/62212.62213)
- [View Online](https://dl.acm.org/doi/10.1145/62212.62213)

Tip: These PDFs provide the theoretical foundation for the concepts implemented in this visualizer. They are ideal for academic study and deeper understanding.

## About This Visualizer

This educational tool was built to make Shamir secret sharing and secure multi-party computation more accessible and understandable through interactive visualization. It is based on research in secure computation and privacy-preserving protocols.
`;

function normalizeContent(content: string): string {
    return content.replace(/\r\n/g, "\n").trim();
}

export function getBuiltInDocContent(sectionId: string): string {
    return BUILT_IN_DOC_CONTENT[sectionId] || "";
}

export function resolveEditorDocContent(sectionId: string, savedContent: string): string {
    const fallbackContent = getBuiltInDocContent(sectionId);
    const trimmedSaved = normalizeContent(savedContent);

    if (trimmedSaved.length === 0) {
        return fallbackContent;
    }

    const legacy = LEGACY_PLACEHOLDER_CONTENT[sectionId];
    if (legacy && trimmedSaved === normalizeContent(legacy)) {
        return fallbackContent;
    }

    if (sectionId === "references" && trimmedSaved === normalizeContent(LEGACY_REFERENCES_FULL_CONTENT)) {
        return fallbackContent;
    }

    return savedContent;
}