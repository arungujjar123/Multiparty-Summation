# Shamir MPC Visualizer

An interactive web application that simulates and visualizes Shamir secret sharing for summation and multiplication (resharing). Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Interactive Control Panel**: Set parameters (prime p, n players, threshold t, secrets a and b, RNG seed)
- **Polynomial Generation**: Automatically generates f(x) and g(x) and computes shares
- **Player Grid Visualization**: Each player displays their shares f(i), g(i), h_sum(i), h_prod(i)
- **Step-through Flow**: Play/Pause/Next/Prev controls for educational walkthrough
- **Summation Protocol**: Local sum computation and Lagrange reconstruction
- **Multiplication with Resharing**: Local product → resharing animation → T(j) aggregation → reconstruction
- **Math Inspector**: Modal showing Lagrange interpolation details with KaTeX rendering
- **Secure RNG**: Uses crypto.getRandomValues() for secure randomness
- **Input Validation**: Prime validation and parameter checks

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
shamir-secret/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── ControlPanel.tsx
│   │   ├── PlayersGrid.tsx
│   │   ├── Stepper.tsx
│   │   ├── NetworkMatrix.tsx
│   │   └── LagrangeModal.tsx
│   └── lib/
│       └── math/               # Core math library
│           ├── shamir.ts       # Main Shamir logic
│           ├── polynomial.ts   # Polynomial utilities
│           ├── lagrange.ts     # Lagrange interpolation
│           └── resharing.ts    # Multiplication resharing
├── tests/                      # Unit tests
│   └── math.test.ts
├── .vscode/                    # VSCode settings
├── jest.config.js
├── tsconfig.json
├── next.config.ts
└── package.json
```

## Example Usage

### Basic Summation Example

1. Set parameters: p=11, n=7, t=3, a=4, b=2
2. Click "Generate" to create shares
3. Use Stepper to walk through summation protocol
4. See reconstruction of a+b (mod p)

### Multiplication with Resharing

1. Set same parameters as above
2. Step through to multiplication phase
3. Watch animated resharing between players
4. See T-shares aggregation and final reconstruction of a×b (mod p)

## Security Notes

- Uses `crypto.getRandomValues()` for secure random number generation
- Prime validation before computation
- BigInt arithmetic for all modular operations
- Input sanitization and bounds checking

## Development Workflow

This project follows a phased development approach:

- **Phase 0**: Project setup ✅
- **Phase 1**: Core math library with tests ✅
- **Phase 2**: Basic UI & control flow ✅
- **Phase 3**: Multiplication resharing visualization ✅
- **Phase 4**: Math inspector & KaTeX ✅
- **Phase 5**: Tests, polish, export ✅

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Math Rendering**: KaTeX
- **Testing**: Jest + ts-jest
- **Linting**: ESLint (Next.js recommended config)
- **Formatting**: Prettier

## Contributing

1. Follow the atomic task list in phases
2. Ensure all tests pass before committing
3. Run linter and formatter
4. No `any` types without documented justification

## License

MIT
