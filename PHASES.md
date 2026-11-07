# PHASES: kya implement kiya aur kaise (phase by phase)

Ye file padh ke samajh aa jaana chahiye ki har phase mein kya bana, kaunsi files hain, code andar se kaise kaam
karta hai, aur khud kaise try karna hai. Interview ke liye English notes aur difficulties
[AIPREP.md](AIPREP.md) mein hain.

**Ek rule poore project mein follow hua hai:** LLM sirf decide karta hai aur samjhata hai. Saara math (prime,
threshold, shares, secret) deterministic TypeScript code karta hai, aur us code ke unit tests hain. LLM khud koi
number nahi banata.

---

## Quick map

| Phase | Kya bana                                       | Main files                                                                                 | LLM? | Tests                    |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- | ------------------------ |
| 0     | Setup: AI SDK, model config, env               | `src/lib/ai/model.ts`, `.env.example`                                                      | –    | –                        |
| 1     | Federated Learning + Shamir secure aggregation | `src/lib/fl/*`, `src/app/federated/`                                                       | Nahi | 18 (`fl.test.ts`)        |
| 2     | Deterministic MPC tools (validate, diagnose…)  | `src/lib/mpc/tools.ts`                                                                     | Nahi | 21 (`mpc-tools.test.ts`) |
| 3     | Cryptography Copilot (AI agent)                | `src/lib/ai/copilotTools.ts`, `src/app/api/copilot/`, `src/app/copilot/`                   | Haan | 5 + 5                    |
| 4     | NL-to-MPC protocol engine                      | `src/lib/mpc/{protocolSchema,compiler}.ts`, `src/app/api/nl-to-mpc/`, `src/app/nl-to-mpc/` | Haan | 14 + eval 15/15          |
| 5     | Fallback, error handling, docs, polish         | `src/lib/ai/{fallback,errors}.ts`, READMEs                                                 | –    | 10                       |

Purane math tests (27) mila ke total **100 tests** hain. Sab pass hote hain.

```bash
cd shamir-secret
npm run dev        # http://localhost:3000
npm run test       # 100 tests
```

---

## Phase 0: Setup

**Kyun:** AI features ke liye LLM library aur API key chahiye thi, aur ek jagah se model choose ho, taaki baad mein
model badalna aasaan ho.

**Kya kiya:**

- Packages install kiye:
  - `ai` (Vercel AI SDK v7)
  - `@ai-sdk/google` (Gemini provider)
  - `@ai-sdk/react` (`useChat` hook)
  - `zod` (schemas)
- **`src/lib/ai/model.ts`:** `getModel()` function. Ye `.env` se `GEMINI_API_KEY` padhta hai aur model return karta
  hai. Phase 5 mein ise fallback chain bana diya gaya.
- **`.env.example`:** saare env variables ke naam, bina values ke. `.gitignore` mein `!.env.example` add kiya,
  kyunki `.env*` sab ignore ho raha tha.

**Model kaise chuna:** ek chhoti script se teen models test kiye:

- `gemini-2.5-flash` ne 404 diya (naye users ke liye band ho chuka hai)
- `gemini-flash-latest` ne 503 diya (high demand)
- `gemini-3.5-flash` chal gaya, to wahi default bana

---

## Phase 1: Federated Learning + Shamir secure aggregation

**Resume bullet:** PPML pipeline: Shamir + Federated Learning, secure gradient aggregation.

**Idea simple shabdon mein:** 5 hospitals ek ML model train karna chahte hain, lekin koi apna data ya model update
server ko nahi dikhana chahta. Har hospital apna update Shamir shares mein tod ke baakiyon ko bhejta hai. Server ko
sirf **sabka total** milta hai, kisi ek ka update kabhi nahi.

### Files aur kaam

| File                              | Kya karti hai                                                            |
| --------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/fl/fixedPoint.ts`        | Float ↔ field element conversion                                         |
| `src/lib/fl/random.ts`            | Secure random (`crypto.getRandomValues`) + seeded random (tests ke liye) |
| `src/lib/fl/dataset.ts`           | Synthetic 2-class data, clients mein non-IID split                       |
| `src/lib/fl/model.ts`             | Logistic regression: gradient, loss, accuracy, local training            |
| `src/lib/fl/secureAggregation.ts` | **Core protocol**                                                        |
| `src/lib/fl/trainer.ts`           | FedAvg training loop (secure + plaintext baseline)                       |
| `src/app/federated/page.tsx`      | UI: controls, charts, "server ne kya dekha" table                        |
| `src/components/LineChart.tsx`    | Bina library ka SVG line chart                                           |

### Step 1: Fixed-point encoding (`fixedPoint.ts`)

Shamir integers mod p par kaam karta hai, lekin model updates floats hain (jaise -0.0342). Isliye:

- **Encode:** `round(x × 2¹⁶) mod p`. Negative number `p − |v|` ban jaata hai.
- **Decode:** agar value `> p/2` hai to use negative maano, phir `2¹⁶` se divide karo.
- **Prime p = 2⁶¹ − 1** (Mersenne prime). Itna bada hai ki 5–12 clients ke scaled updates ka sum bhi wrap nahi hota.
  Bahut bada value aaye to `encodeFixed` error deta hai (overflow guard).

### Step 2: Secure aggregation (`secureAggregation.ts` → `secureAggregate()`)

Maan lo n clients hain, threshold t hai, aur har update vector ki d dimensions hain:

1. **Share:** har client i apne har coordinate k ke liye random polynomial banata hai, `P(0) = encode(update[k])`
   aur degree t−1. Phir client j ko `P(j)` bhejta hai. Client ka id hi uska x-coordinate hai.
2. **Local sum:** har client j apne paas aaye saare shares ko add karta hai: `S_j = Σ P_i(j) mod p`. Addition linear
   hai, to `S_j` total ka share ban jaata hai.
3. **Reconstruct:** server kisi bhi t online clients ke `S_j` leta hai aur `lagrangeAtZero` (existing code) se x=0 par
   interpolate karta hai. Isse encoded total milta hai, use decode kar lo.
4. **Dropout:** `offlineClients` woh clients hain jo share bhejne ke baad offline ho gaye. Agar kam se kam t online
   hain to sab theek chalta hai, warna clear error milta hai.

Return value mein `sum`, saare `messages`, aur `serverView` (server ko sirf ye dikha) hote hain. UI isi ko dikhata hai.

### Step 3: FedAvg trainer (`trainer.ts` → `runFederatedTraining()`)

Har round mein:

1. Har client global weights se `localSteps` baar gradient descent karta hai.
2. Client bhejta hai `[n_k × Δw₁, n_k × Δw₂, n_k × Δb, n_k]`, yaani sample count se weighted update aur khud sample
   count. Sample count bhi secret rehta hai.
3. Secure aggregation se total aata hai, aur naye weights = `w + Σ(n_k·Δw) / Σ n_k`.
4. **Saath mein plaintext FedAvg** bhi same data par chalta hai. Dono ka loss/accuracy har round log hota hai, aur
   `aggregationError` (secure sum aur plain sum ka max fark) bhi.

### Kaise pata ki sahi hai?

- UI mein dono curves (plaintext vs secure) ek ke upar ek aati hain.
- Measured (5 clients, t=3, 30 rounds): accuracy **94.5%** dono mein, max error **~2×10⁻⁵** (sirf rounding).
  1–2 clients offline hone par bhi same accuracy.
- Tests check karte hain:
  - secure sum = plain sum
  - t−1 shares se galat value aati hai (privacy)
  - server view mein koi raw update nahi hai
  - dropout aur galat inputs

### Try karo

`/federated` kholo → clients, threshold, offline clients set karo → **Run federated training**. Neeche wali table
dekho: left mein asli updates hain, right mein server ko mile random jaise numbers.

### Existing code mein do changes

- **`src/lib/math/shamir.ts`:** `randomBigInt` pehle sirf `window.crypto` use karta tha, isliye server par throw karta
  tha. Ab `globalThis.crypto` use karta hai, jo browser aur Node dono mein chalta hai. Phase 3 ke tools server par
  chalte hain, isliye ye zaroori tha.
- **`src/lib/math/lagrange.ts`:** naya `lagrangeAt(points, x, p)` add kiya. Ye kisi bhi x par interpolate karta hai,
  aur Phase 2 mein corrupted share pakadne ke kaam aata hai.

---

## Phase 2: Deterministic MPC tool layer

**Kyun:** Phase 3 aur 4 mein LLM ko math nahi karna hai. Isliye saare math functions pehle bana ke test kiye, jo baad
mein LLM ke "tools" bane.

**File:** `src/lib/mpc/tools.ts`. Sab pure functions hain. Input number ya string le sakte hain, aur output mein
BigInt **string** ban ke aata hai, kyunki JSON 2⁵³ ke baad number ki precision kho deta hai.

### Functions

**`validateParams({ p, n, t, operation, maxSecret, numInputs })`**

- Errors:
  - p prime nahi hai
  - t > n
  - p ≤ n
  - multiplication mein n < 2t−1
  - sum ya product p ko cross kar jaaye (wrap ho jaaye). Product ke liye `maxSecret^numInputs` check hota hai.
- Warnings: t=1 (koi secrecy nahi), t=n (ek party gayi to kuch nahi hoga), p chhota hai.
- `securityNotes`: "kitne log collude karke bhi kuch nahi jaan sakte", "kitne offline ho sakte hain".

**`nextPrime(x)`:** x se bada sabse chhota prime. Phase 3 mein add hua.

**`generateShares(...)` / `reconstruct(...)`:** existing `createShares` aur `lagrangeAtZero` ke wrappers, validation
ke saath.

**`diagnoseReconstruction({ shares, p, t, expectedSecret })`:** sabse important function. Ye bataata hai ki
reconstruction kyun fail hua:

1. p prime nahi hai → `NOT_PRIME`
2. Har share check: x=0 (`INVALID_X_ZERO`), value field se bahar (`OUT_OF_FIELD`, matlab shayad galat prime),
   duplicate (`DUPLICATE_SHARE`), same x par alag y (`CONFLICTING_DUPLICATE`)
3. t se kam valid shares → `INSUFFICIENT_SHARES` + "X aur shares chahiye"
4. **Corrupted share dhundhna:** har t-size subset se polynomial banao, aur gino ki kitne shares us par fit hote hain.
   Jis polynomial par t se zyada shares fit hon, wahi sahi hai. Jo shares fit nahi hote, woh corrupt hain →
   `CORRUPTED_SHARES` + index + recovered secret.
   - Rule: t+1 shares se corruption **detect** hoti hai, aur t+2e shares se e corrupt shares **locate** hote hain.
5. Koi degree-(t−1) polynomial fit nahi hota, lekin bade degree ka hota hai → `THRESHOLD_MISMATCH` ("dealer ne shayad
   t=4 use kiya")
6. Sirf t shares hain → `UNDETECTABLE_WITH_T_SHARES` (t points par hamesha koi na koi polynomial fit ho jaata hai)
7. Expected secret diya hai aur recovered = expected mod p → `SECRET_EXCEEDS_PRIME`

Return value mein `status` (ok / repaired / failed), `causes`, `badShareIndices`, `recoveredSecret` aur `fixes` hote hain.

### Try karo

Tests padho: `tests/mpc-tools.test.ts`. Har failure mode ka ek example hai, jaise ek share ko jaan-boojh ke corrupt
karke check karna ki wahi index pakda jaata hai.

---

## Phase 3: Cryptography Copilot (AI agent)

**Resume bullet:** Agentic Copilot, function calling, (t, n) verify + reconstruction debugging.

**Idea:** user chat mein sawal poochta hai. LLM decide karta hai ki kaunsa tool call karna hai, tool math karta hai,
aur LLM result samjhata hai. Zaroorat ho to ek ke baad ek kai tools chalata hai (multi-step agent).

### Files aur flow

```
copilot/page.tsx (useChat)
   │  POST messages
   ▼
api/copilot/route.ts
   1. Login check (session cookie)       → nahi to 401
   2. Rate limit (30/hour/user, MongoDB) → zyada ho to 429
   3. streamText({ model, system prompt, tools: copilotTools, stopWhen: isStepCount(6) })
   4. Stream wapas browser ko (text + tool calls)
   ▼
lib/ai/copilotTools.ts → lib/mpc/tools.ts (Phase 2)
```

| File                              | Kya karti hai                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/lib/ai/copilotTools.ts`      | 5 tools ki definition (zod input schema + description + `execute`) + system prompt                               |
| `src/app/api/copilot/route.ts`    | Agent loop chalane wala API route                                                                                |
| `src/lib/server/rateLimit.ts`     | Per-user hourly counter, MongoDB `rate_limits` collection, TTL index se purane records apne aap delete hote hain |
| `src/app/copilot/page.tsx`        | Chat UI: har tool call ek card mein (input/output), example prompts, Stop/Clear                                  |
| `src/components/SafeMarkdown.tsx` | LLM ka Markdown + LaTeX safely render karta hai                                                                  |

### Important details

- **Tools ke inputs string mein hain** (`"97"`, not 97), aur zod regex se check hote hain.
- **Tool error throw nahi karta.** `{ ok: false, error }` return karta hai, taaki agent user ko samjha sake ki kya
  galat hua.
- **System prompt ke rules:** koi number khud calculate mat karo, sirf tool se lo. Failure par pehle
  `diagnoseReconstruction` chalao. Prime chahiye to `nextPrime` aur phir `validateParams` chalao. Inputs missing hon
  to poocho.
- **SafeMarkdown:** LLM ka output untrusted hai. Isliye raw HTML escape hota hai, images aur `javascript:` links hata
  diye jaate hain, aur `$…$` math KaTeX se render hota hai. Iske 5 security tests hain.
- **Jest problem:** `ai` package sirf ESM hai, aur Jest use load nahi kar paata. Test mein `tool()` ko mock kiya, kyunki
  woh bas input waisa hi return karta hai.

### Live test (asli Gemini ke saath)

1. "Ye shares 42 nahi de rahe: (1,54),(2,80),(3,23),(4,71),(5,48), p=97, t=3": agent ne `diagnoseReconstruction`
   call kiya, **share #3 corrupt** bataya, aur 42 recover kiya.
2. "p=97, n=5, t=3 par 50 tak ke do numbers multiply karna safe hai?": agent ne `validateParams` (fail, kyunki
   2500 ≥ 97) → `nextPrime(2500)` = 2503 → `validateParams` (pass) chalaya. Teen tools apne aap.

### Try karo

Login karo → `/copilot` → koi example button dabao → tool card khol ke input/output dekho.

---

## Phase 4: NL-to-MPC protocol engine

**Resume bullet:** Natural Language → MPC protocol compiler.

**Idea:** user English mein likhta hai, jaise "7 hospitals total patients jaanna chahte hain, max 10,000 each, koi 3
milke kisi ka count na dekh sakein". System isse **p, n, t aur protocol steps** bana deta hai.

### Pipeline

```
English text
  │  (LLM: sirf facts nikaalo, math nahi)
  ▼
ProtocolSpec  { partyCount, operation, maxColluders, reconstructionThreshold, maxOffline, maxInputValue, … }
  │  (deterministic compiler)
  ▼
t aur p decide karo (har decision ka reason ke saath) → validateParams → protocol steps → visualizer link
```

### Files

| File                                                          | Kya karti hai                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/mpc/protocolSchema.ts`                               | zod schema (LLM ka output kaisa dikhega) + extraction prompt                    |
| `src/lib/mpc/compiler.ts`                                     | `compileProtocol(spec)`: saare decisions                                        |
| `src/app/api/nl-to-mpc/route.ts`                              | `generateText` + `Output.object({ schema })`, temperature 0, login + rate limit |
| `src/app/nl-to-mpc/page.tsx`                                  | Text box → editable spec → parameters + reasons → steps → "Run in Visualizer"   |
| `src/app/visualizer/page.tsx`                                 | Naya: URL se pre-fill (`?p=&n=&t=&op=&secrets=`)                                |
| `scripts/nl-to-mpc-cases.json` + `scripts/eval-nl-to-mpc.mjs` | 15-case eval                                                                    |

### Compiler ke rules (`compiler.ts`)

- **n** = party count (kam se kam 2).
- **t:**
  - "koi c milke na jaan sakein" → t = c + 1 (kyunki t−1 shares kuch nahi bataate)
  - "koi bhi k milke nikaal sakein" → t = k
  - "k offline ho tab bhi chale" → t = n − k
  - kuch nahi diya → honest majority ⌊n/2⌋+1, warning ke saath
- **p:** sabse chhota prime jo max possible result se bada ho. Sum ke liye `inputs × max`, product ke liye
  `max^inputs`, share ke liye `max`. Range nahi di to 1000 maana jaata hai, warning ke saath.
- **Reject karta hai, fix ke saath:**
  - privacy aur threshold ka takraav ("any 2 can" + "no 3 may collude")
  - availability poori nahi ho sakti
  - multiplication mein n < 2t−1 ("1 party add karo ya t=… rakho")
- Decimal input (99.99) reject hota hai: "cents/paise mein badlo". `10,000` jaise commas apne aap hata diye jaate hain.

### UI ki khaas baat

Extracted spec **editable** hai. Agar LLM ne kuch galat samjha, to user khud field badal sakta hai, aur compiler
**browser mein turant** dobara chalta hai, bina doosri LLM call ke.

### Eval

`node --env-file=.env scripts/eval-nl-to-mpc.mjs` (dev server chalna chahiye)

- Ye har case ka validity, n, t, operation aur p expected answer se match karta hai.
- Result: **15/15 sahi**, dono impossible cases sahi se reject hue, median latency 9.7s.
- Dhyan rakho: cases maine khud likhe hain aur set chhota hai.
- Script free-tier ke hisaab se bani hai: har request ke beech 13s ka gap, quota khatam ho to ruk jaati hai, aur
  results `scripts/eval-results.json` mein save karti hai.

### Try karo

Login → `/nl-to-mpc` → example dabao → "Max colluders" badal ke dekho ki t aur errors kaise badalte hain →
"Run in Visualizer".

---

## Phase 5: Reliability, docs, polish

### Model fallback (`src/lib/ai/fallback.ts`)

- Kai models ko **ek model ki tarah** wrap karta hai (SDK ka `LanguageModel` interface), isliye routes ka code nahi
  badla.
- Default chain: `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-flash-lite-latest`. Free tier mein har model
  ka quota alag hai.
- **Agla model kab:** 429 (quota), 404 (model hata diya gaya), 5xx (overload), network error, ya **timeout** (30s mein
  pehla response nahi aaya). Testing mein `gemini-3.8-flash` minutes tak latka raha tha, isliye timeout zaroori tha.
- **Agla model kab nahi:** 400/401/403 (har model par fail hoga, jaise galat key) ya user ne Stop dabaya.
- **Streaming:** fallback sirf pehle chunk se pehle hota hai, taaki aadha jawab dobara shuru na ho.
- Response mein us model ka naam aata hai jisne asal mein jawab diya (UI mein "Extracted by …").
- Live check kiya: retired model ne 404 diya, aur agle ne jawab de diya.
- Config: `AI_MODELS`, `AI_ATTEMPT_TIMEOUT_MS` (`.env.example` dekho).

### Error handling (`src/lib/ai/errors.ts`)

- Provider ka raw error (jisme internal details ho sakti hain) sirf server log mein jaata hai.
- User ko saaf message milta hai: 429 (quota khatam), 503 (overload), 504 (timeout), 502 (key/config).
- SDK retries 0 kar diye, kyunki fallback pehle se doosra model try karta hai. Retry poori chain dobara chala ke quota
  barbaad karta tha.

### Docs aur UI polish

- `README.md`: AI features ki table, mermaid architecture diagram, measured results, setup, project structure.
- Root `README.md`: AI features ka pointer.
- `AIPREP.md`: interview notes, 20 difficulties + solutions, likely questions, resume bullets.
- Navbar: links badhne se overflow ho raha tha. Ab desktop menu `xl` se dikhta hai, aur icons sirf `2xl` par.

---

## Ek request ka poora safar (example)

User `/copilot` par likhta hai: _"p=97, n=4, t=3 multiplication ke liye theek hai?"_

1. `page.tsx` → `useChat` → `POST /api/copilot`
2. Route: login check → rate limit check → `streamText` shuru
3. `getModel()` → fallback chain → `gemini-3.5-flash` (quota khatam ho to lite model)
4. Model tool call bhejta hai: `validateParams({ p: "97", n: 4, t: 3, operation: "product" })`
5. `copilotTools.ts` → `tools.ts` → error: "Multiplication needs n ≥ 2t−1 = 5"
6. Result model ko wapas jaata hai → model `nextPrime` ya doosra tool chala sakta hai, max 6 steps
7. Model jawab likhta hai, jo stream hokar browser mein aata hai → `SafeMarkdown` render karta hai, aur tool card mein
   input/output dikhta hai

---

## Kya nahi kiya / limitations (imaandari se)

- **Threat model semi-honest hai.** Koi party jaan-boojh ke galat shares bheje to protocol use nahi rokta. Uske liye
  verifiable secret sharing (Feldman/Pedersen) chahiye.
- **FL simulation hai.** Saare clients ek hi browser tab mein chalte hain, asli network par nahi.
- **Eval chhota hai** (15 khud likhe hue cases, ek run).
- **Free tier** par roz ki limit kam hai, aur fallback bhi tabhi tak madad karta hai jab tak kisi model ka quota bacha
  ho.
- Naye pages browser mein visually test nahi hue. API aur logic test hue hain.
- Kuch bhi commit nahi hua hai. Saara kaam `feature/ai-features` branch par uncommitted pada hai.
