# AIPREP: AI work on the Shamir MPC platform

Interview prep notes: what I built, the problems I hit, and how I solved them.

> **Is file ko kaise padhein:** har section mein pehle **English** hai, jo interview mein seedha bolne ke liye hai.
> Uske neeche **🇮🇳 Hinglish** block hai, jo wahi baat aasaan bhasha mein samjhata hai. Pehle Hinglish padh ke samjho,
> phir English wala version bolne ki practice karo.

---

## 1. One-line summary

I added three AI / privacy-preserving ML features to a Next.js Shamir Secret Sharing visualizer:
**federated learning with Shamir secure aggregation**, an **LLM agent ("Cryptography Copilot") that verifies
MPC parameters and debugs failed reconstructions with function calling**, and a **natural-language-to-MPC
engine** that turns plain-English confidentiality requirements into validated protocols.

The design rule behind all of it: **the LLM decides and explains, deterministic code computes.**
Every number a user sees (primes, thresholds, shares, secrets) comes from unit-tested TypeScript, never
from the model.

> **🇮🇳 Hinglish:** Ek existing Shamir Secret Sharing visualizer (Next.js) mein maine teen AI features jode:
>
> 1. **Federated learning:** kai clients milke ML model train karte hain, aur kisi ka data ya update server ko nahi
>    dikhta.
> 2. **Cryptography Copilot:** ek AI agent jo tools call karke check karta hai ki parameters safe hain, aur batata
>    hai ki shares se secret wapas kyun nahi ban raha.
> 3. **NL-to-MPC:** English mein likhi requirement ko poore protocol mein badal deta hai.
>
> Sabse important rule: **LLM sirf decide karta hai aur samjhata hai, math kabhi nahi karta.** Prime, threshold,
> shares, secret, ye sab tested TypeScript code calculate karta hai.

---

## 2. Architecture

```
Browser (Next.js pages)
  /federated   ─► src/lib/fl/*        (runs fully in the browser, no LLM)
  /copilot     ─► POST /api/copilot   ─► streamText agent loop ─► tools ─► src/lib/mpc/tools.ts ─► src/lib/math/*
  /nl-to-mpc   ─► POST /api/nl-to-mpc ─► Output.object extraction ─► src/lib/mpc/compiler.ts ─► tools.ts
                                         │
                       src/lib/ai/model.ts: Gemini fallback chain (429/404/5xx/timeout → next model)
                       src/lib/ai/errors.ts: provider errors → clean 429/503/504 messages
                       src/lib/server/rateLimit.ts: per-user hourly limit in MongoDB (TTL index)
```

Stack: Next.js 16, TypeScript, Vercel AI SDK v7, Google Gemini, zod, MongoDB, Jest.

> **🇮🇳 Hinglish:** Teen pages hain:
>
> - `/federated`: poora browser mein chalta hai, LLM nahi lagta.
> - `/copilot`: API route par AI agent loop chalta hai. Agent tools call karta hai, aur tools Shamir math wale
>   functions chalate hain.
> - `/nl-to-mpc`: LLM text se facts nikaalta hai, aur compiler un facts se protocol banata hai.
>
> Teeno ke neeche kuch common cheezein hain: model ki fallback chain (ek model fail ho to doosra), errors ko saaf
> message mein badalna, aur per-user rate limit (MongoDB mein).

---

## 3. What I built

### 3.1 Privacy-preserving federated learning (`/federated`)

**Files:** `src/lib/fl/{fixedPoint,random,dataset,model,secureAggregation,trainer}.ts`, `src/app/federated/page.tsx`

- K clients each hold a private, non-IID slice of a synthetic 2-class dataset and train logistic regression locally.
- Each round is FedAvg: a client sends `[n_k · Δw_k, n_k]` (sample-weighted update plus sample count), so even the
  dataset size stays private.
- **Secure aggregation protocol:**
  1. Each client fixed-point-encodes its update into the field mod p = 2⁶¹ − 1 and Shamir-shares every coordinate
     (degree t−1), sending share j to client j.
  2. Each client adds the shares it received. Addition is linear, so these are shares of the sum.
  3. The server takes partial sums from any t online clients and Lagrange-interpolates at x=0.
- The server never sees an individual update. Any t−1 colluders learn nothing, and up to n−t clients may drop out
  after sharing.
- A plaintext FedAvg runs alongside as a correctness baseline. The UI plots both curves and shows "what the server
  saw" (random-looking field elements) next to the real updates.

**Measured** (5 clients, t=3, 30 rounds): 94.5% accuracy for both secure and plaintext; max aggregation error
2×10⁻⁵ (rounding only); loss gap ~9×10⁻⁹; same accuracy with 1–2 clients offline every round.

> **🇮🇳 Hinglish:** Socho 5 hospitals ek model train karna chahte hain, lekin koi apna data share nahi karna chahta.
>
> - Har hospital (client) apne data par locally train karta hai aur sirf apna **update** bhejta hai. Saath mein
>   sample count bhi bhejta hai, aur woh bhi secret rehta hai.
> - Update ko seedha nahi bhejta:
>   1. Pehle float ko integer (field element) mein badalta hai.
>   2. Phir uske **Shamir shares** banata hai aur har doosre client ko ek share deta hai.
>   3. Har client apne paas aaye shares ko jodta hai. Jodna linear hai, isliye ye jod **total ka share** ban jaata hai.
>   4. Server kisi bhi t clients ke jod leke Lagrange se total nikaal leta hai.
> - **Result:** server ko sirf total milta hai, kisi ek ka update kabhi nahi. t−1 log milke bhi kuch nahi jaan sakte,
>   aur n−t clients beech mein gayab ho jaayein tab bhi kaam chalta hai.
> - Saboot ke liye ek normal (plaintext) training bhi saath mein chalti hai. Dono ki accuracy same aati hai (94.5%),
>   aur fark sirf 0.00002 ka hai, jo rounding ki wajah se hai.

### 3.2 Deterministic MPC tool layer (`src/lib/mpc/tools.ts`)

Pure functions that the LLM uses as tools, all JSON-safe (BigInt as decimal strings):

- `validateParams`: prime p, t ≤ n, p > n, n ≥ 2t−1 for multiplication, and results that would wrap mod p.
  It also warns on degenerate thresholds and returns security properties (collusion and dropout tolerance).
- `nextPrime`, `generateShares`, `reconstruct`.
- `diagnoseReconstruction`: root cause for a failed reconstruction:
  - too few shares, duplicate or conflicting x, x=0, values outside the field (wrong prime)
  - **corrupted shares**: finds the degree-(t−1) polynomial agreeing with the most shares and flags the rest,
    which works when m ≥ t + 2e
  - **threshold mismatch**: detects when the dealer actually used a larger t
  - secret ≥ p (wrapped)
  - with exactly t shares, explains that corruption cannot be detected

> **🇮🇳 Hinglish:** Ye woh functions hain jo AI agent "tools" ki tarah use karta hai. Saara math yahin hota hai.
>
> - **`validateParams`:** check karta hai ki p prime hai, t ≤ n hai, multiplication ke liye n ≥ 2t−1 hai, aur result
>   p se bada hoke wrap toh nahi hoga. Ye bhi batata hai ki kitne log collude kar sakte hain aur kitne offline ho
>   sakte hain.
> - **`diagnoseReconstruction`:** sabse kaam ka function. Secret galat aa raha ho to wajah dhundhta hai:
>   - shares kam hain, duplicate hain, x=0 hai, ya galat prime use hua
>   - **corrupt share kaunsa hai:** saare t-size groups try karta hai, aur jis polynomial par sabse zyada shares fit
>     hote hain wahi sahi hai. Jo fit nahi hote, woh kharab hain.
>   - shayad dealer ne alag threshold use kiya tha
>
>   Rule yaad rakho: t+1 shares se galti pakdi ja sakti hai, aur t+2 shares se ek galat share ki jagah bhi pata chalti
>   hai.
>
> - Bade numbers string mein jaate hain, kyunki JSON 2⁵³ ke baad number ko galat kar deta hai.

### 3.3 Cryptography Copilot (`/copilot`)

**Files:** `src/lib/ai/copilotTools.ts`, `src/app/api/copilot/route.ts`, `src/app/copilot/page.tsx`

- Vercel AI SDK `streamText` with 5 zod-typed tools and a multi-step loop (`stopWhen: isStepCount(6)`).
- The system prompt forbids the model from doing arithmetic; it must cite tool results.
- Tool errors come back as `{ ok: false, error }`, so the agent explains the problem instead of the request crashing.
- The UI shows each tool call as an expandable card (input and output), so answers are auditable.
- Sign-in required, with a per-user hourly rate limit.

**Verified live:** given 5 shares with one tampered, it called `diagnoseReconstruction`, named share #3 and still
recovered 42. Asked whether p=97, n=5, t=3 is safe for multiplying values up to 50, it chained
`validateParams` (fails: 2500 ≥ 97) → `nextPrime(2500)` = 2503 → `validateParams` (passes).

> **🇮🇳 Hinglish:** Ye ek chat hai jisme AI agent hai.
>
> - User sawal poochta hai. Model decide karta hai ki kaunsa tool chalana hai, tool math karta hai, aur model result
>   samjhata hai. Zaroorat ho to ek ke baad ek 6 steps tak tools chala sakta hai.
> - System prompt mein likha hai ki khud calculate mat karo, sirf tool ka result batao.
> - Tool fail ho to crash nahi hota. Error agent ko wapas milta hai aur woh user ko samjhata hai.
> - UI mein har tool call ka card dikhta hai, taaki user khud check kar sake ki AI ne kya kiya.
> - **Asli test:** 5 shares mein ek kharab tha. Agent ne bataya "share #3 kharab hai" aur phir bhi secret 42 nikaal
>   diya. Doosre sawal mein p=97 chhota tha, to agent ne khud naya prime 2503 dhundha aur use dobara check kiya. Teen
>   tools apne aap chale.

### 3.4 NL-to-MPC protocol engine (`/nl-to-mpc`)

**Files:** `src/lib/mpc/{protocolSchema,compiler}.ts`, `src/app/api/nl-to-mpc/route.ts`, `src/app/nl-to-mpc/page.tsx`

Pipeline: **English → LLM structured extraction (zod schema) → deterministic compiler → validator → steps + visualizer link**

- The LLM only extracts facts: party count, operation, max colluders, "any k can reconstruct", max offline, and
  input range, plus explicit `assumptions` and `ambiguities`.
- The compiler decides every parameter and records why:
  - "no c may collude" gives t = c+1; "any k can" gives t = k; "k offline" gives t = n−k; otherwise honest majority
  - p = smallest prime above the largest possible result (n·max for sums, max^k for products)
- It rejects impossible requirements with a concrete fix: privacy vs threshold conflicts, unmeetable availability,
  multiplication with n < 2t−1.
- The extracted spec is editable in the UI, and the compiler re-runs instantly in the browser with no extra LLM call.
- "Run in Visualizer" opens the existing visualizer pre-filled through URL params.

**Eval:** 15 labelled requirements in `scripts/nl-to-mpc-cases.json` (two must be rejected).
Result (one end-to-end run, 2026-11-05): **15/15 correct**, including both impossible requirements correctly
rejected, with a median extraction latency of 9.7s. Caveat: the cases were written by me, so the set is small and not
adversarial. It shows the pipeline works, not that it generalises. Next step is more varied, third-party phrasing.

> **🇮🇳 Hinglish:** User English mein likhta hai, jaise "7 hospitals total patients jaanna chahte hain, koi 3 milke kisi
> ka count na dekh sakein".
>
> - **LLM ka kaam sirf facts nikaalna hai:** kitni parties hain, sum hai ya product, kitne log collude kar sakte hain,
>   kitne offline ho sakte hain, aur max value kya hai. Jo samajh na aaye woh "ambiguities" mein likhta hai.
> - **Compiler (normal code) baaki sab decide karta hai, aur har decision ka reason bhi deta hai:**
>   - "koi 3 milke na jaan sakein" → t = 3+1 = 4
>   - p = sabse chhota prime jo max possible total se bada ho
> - Impossible requirement ho to reject karta hai aur fix batata hai, jaise "1 party aur chahiye".
> - LLM ne kuch galat samjha ho to user UI mein khud field badal sakta hai. Compiler browser mein turant dobara chalta
>   hai.
> - **Test:** 15 examples mein se 15 sahi aaye, aur jo 2 impossible the woh sahi se reject hue. Lekin imaandari se:
>   examples maine khud likhe hain, set chhota hai.

### 3.5 Reliability and safety work

- **Model fallback chain** (`src/lib/ai/fallback.ts`): wraps several Gemini models into one `LanguageModel`. It moves
  to the next model on 429, 404, 5xx, network errors, or when a model doesn't start answering within 30s. It does
  not fall back on 400/401/403 or user aborts. Verified live: a retired model returned 404 and the next one answered.
- **Error mapping:** raw provider errors are logged but never returned. Users get a clear 429/503/504 message.
- **Safe Markdown rendering** of LLM output: raw HTML escaped, images and `javascript:` links dropped, KaTeX for math.
- **Tests:** 100 Jest tests in total, covering math, FL, MPC tools, compiler, Copilot tools, fallback and Markdown
  security.

> **🇮🇳 Hinglish:**
>
> - **Fallback:** teen Gemini models ki line lagi hai. Pehla model in cases mein agla model try hota hai:
>   - quota khatam (429)
>   - model band ho gaya (404)
>   - overload (5xx)
>   - network error
>   - 30 second tak jawab shuru hi na kare
>
>   Galat API key ya galat request par agla model try nahi hota, kyunki woh har model par fail hogi. Maine asli test
>   kiya: band model ne 404 diya aur agle model ne jawab de diya.
>
> - **Errors:** provider ka raw error sirf server log mein jaata hai. User ko saaf message milta hai.
> - **Safe Markdown:** AI ka jawab untrusted hai, isliye HTML escape hota hai aur khatarnaak links hata diye jaate hain.
>   Isse XSS attack se bachav hota hai.
> - **Tests:** total 100 tests hain, aur sab pass hote hain.

---

## 4. Difficulties and how I resolved them

| #   | Problem                                                                                                                      | Why it mattered                                                              | Resolution                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Shamir works over integers mod p, but model updates are floats, some negative                                                | Can't secret-share a float                                                   | Fixed-point encoding `round(x·2¹⁶) mod p`; values above p/2 decode as negative. Chose p = 2⁶¹−1 so a sum of K scaled updates never wraps, and added an overflow guard                                                                                  |
| 2   | How do I _prove_ secure aggregation is correct and private?                                                                  | "Trust me" isn't convincing in a demo or interview                           | Train a plaintext FedAvg alongside and plot both; log max aggregation error per round; show the server's view; tests that t−1 shares reconstruct garbage and that no raw update appears in the server view                                             |
| 3   | Clients drop out mid-round                                                                                                   | Real FL has stragglers                                                       | Shamir's threshold: any t partial sums suffice. Clients can go offline _after_ sharing; the trainer caps dropouts at n−t so aggregation never fails                                                                                                    |
| 4   | The existing `randomBigInt` threw on the server (only used `window.crypto`)                                                  | Copilot tools run in API routes                                              | Switched to `globalThis.crypto`, which works in browsers and Node 19+                                                                                                                                                                                  |
| 5   | Locating a corrupted share, not just detecting it                                                                            | Core of "root-cause debugging"                                               | Search all t-subsets, interpolate, count agreeing shares; the polynomial with > t agreements is the honest one. Documented the bound: t+1 shares detect, t+2e correct e errors. Added threshold-mismatch detection for when no degree-(t−1) fit exists |
| 6   | BigInts don't survive JSON / LLM tool calls (precision lost above 2⁵³)                                                       | Wrong primes or shares silently                                              | All tool inputs and outputs use decimal strings, validated by zod regex                                                                                                                                                                                |
| 7   | LLMs are bad at modular arithmetic                                                                                           | A hallucinated prime is a security bug                                       | Strict rule: the model never computes. Tools do all math; the system prompt makes the model cite tool output; the UI shows tool calls                                                                                                                  |
| 8   | AI SDK v7 was newer than what I knew (APIs renamed)                                                                          | Guessed APIs wouldn't compile                                                | Read the docs and `.d.ts` shipped inside `node_modules/ai`: `isStepCount`, `Output.object` instead of `generateObject`, `toUIMessageStream` + `createUIMessageStreamResponse`                                                                          |
| 9   | `ai` is ESM-only; Jest (CommonJS) couldn't load it                                                                           | Couldn't unit-test the tool wrappers                                         | Kept logic in pure modules; mocked `tool()` (an identity helper) in that one test                                                                                                                                                                      |
| 10  | Model availability: `gemini-2.5-flash` → 404 for new users, `gemini-flash-latest` → 503, `gemini-3.8-flash` hung for minutes | App would be dead or frozen                                                  | Probed models with a tiny script, chose `gemini-3.5-flash`, then built the fallback chain _with a per-attempt timeout_, because a hung model is worse than an erroring one                                                                             |
| 11  | Gemini free tier: 5 requests/min and 20/day per model                                                                        | My first eval burned the daily quota; 12/15 cases failed on quota, not logic | Set SDK retries to 0 (fallback already handles it and retries replayed the whole chain); eval spaces requests 13s apart, stops on the first 429, and saves results to JSON. Fallback to lite models (separate quotas) keeps the app usable             |
| 12  | Provider errors were returned raw as HTTP 500                                                                                | Leaks internals, confusing UX                                                | `describeAiError` maps to 429/503/504 with friendly text; full error only in server logs                                                                                                                                                               |
| 13  | LLM answers are Markdown + LaTeX; rendering untrusted HTML is an XSS risk                                                    | Plain text looked broken; naive `innerHTML` is unsafe                        | `SafeMarkdown`: separate `marked` instance that escapes raw HTML, drops images and non-http links, renders `$…$` with KaTeX; covered by security tests                                                                                                 |
| 14  | My own example prompt had wrong share values                                                                                 | The demo would have "found" 4 bad shares instead of 1                        | Verified it with the diagnose tool, fixed it, and added a test pinning the example's expected diagnosis                                                                                                                                                |
| 15  | "128-bit key" example would force the LLM to compute 2¹²⁸                                                                    | Breaks the "LLM never computes" rule                                         | Replaced it with a 6-digit PIN; the prompt tells the model to normalise numbers like "5 lakh" → 500000 only                                                                                                                                            |
| 16  | Gemini structured output may not support regex `pattern` in schemas                                                          | Extraction could fail                                                        | Removed the regex from the LLM schema; the compiler validates and normalises (`10,000` → `10000`, rejects `99.99`)                                                                                                                                     |
| 17  | Visualizer couldn't be opened with given parameters                                                                          | No way to "run" a compiled protocol                                          | Added URL-param prefill (`?p=&n=&t=&op=&secrets=`)                                                                                                                                                                                                     |
| 18  | Navbar overflowed with the new links                                                                                         | Layout broke on laptops                                                      | Desktop menu from `xl`, tighter padding, icons only on `2xl`                                                                                                                                                                                           |
| 19  | Dev-server hot reload occasionally dropped a stream / returned a 500                                                         | Looked like a bug                                                            | Reproduced: retry succeeded, so it was a recompile during the request, not the code                                                                                                                                                                    |
| 20  | I lost the first eval's per-case output by only reading the tail of the log                                                  | Couldn't tell which cases passed, and the quota was gone                     | The eval now prints each case as it finishes and writes everything to `scripts/eval-results.json`                                                                                                                                                      |

### 🇮🇳 Hinglish: wahi 20 difficulties, aasaan bhasha mein

1. **Float aur prime field:** Shamir sirf integers (mod p) par kaam karta hai, lekin model updates decimal hain, aur
   kuch negative bhi.
   **Hal:** number ko 2¹⁶ se multiply karke round kiya (fixed-point). Negative number ko p ke upar wale hisse mein
   rakha. p = 2⁶¹−1 liya taaki sab ka total bhi wrap na ho.
2. **Saboot kaise doon ki sahi aur private hai?**
   **Hal:** saath mein normal training chalayi aur dono ke graph dikhaye. Har round ka error log kiya. Server ko kya
   dikha, woh bhi UI mein dikhaya. Tests likhe ki t−1 shares se galat value aati hai.
3. **Clients beech mein gayab ho jaate hain.**
   **Hal:** Shamir mein sirf t shares chahiye. Share bhejne ke baad n−t clients chale bhi jaayein to kaam chalta hai.
4. **Purana random function server par crash karta tha** (sirf `window.crypto` use karta tha).
   **Hal:** `globalThis.crypto` lagaya, jo browser aur Node dono mein chalta hai.
5. **Kharab share ko pakadna, sirf "kuch galat hai" kehna kaafi nahi tha.**
   **Hal:** saare t-groups try kiye. Jis polynomial par sabse zyada shares baithte hain, wahi sahi hai. t+1 shares se
   galti dikhti hai, t+2 se jagah bhi.
6. **Bade numbers JSON mein kharab ho jaate hain** (2⁵³ ke baad).
   **Hal:** saare numbers string mein bheje, aur zod se check kiye.
7. **LLM math mein kamzor hai.** Galat prime matlab security bug.
   **Hal:** LLM ko math karne hi nahi diya. Saara math tools karte hain.
8. **AI SDK v7 naya tha, aur functions ke naam badal gaye the.**
   **Hal:** `node_modules` ke andar ke docs aur type files padh ke sahi functions use kiye.
9. **`ai` package Jest mein load nahi hota tha** (ESM vs CommonJS).
   **Hal:** logic alag files mein rakha, aur us ek test mein `tool()` ko mock kiya.
10. **Models ki dikkat:** ek band ho gaya tha (404), ek busy tha (503), aur ek 3 minute tak latka raha.
    **Hal:** sabko test kiya, chalne wala chuna, phir fallback banaya jisme **timeout** bhi hai.
11. **Free tier mein sirf 5 requests/minute aur 20/day.** Pehla eval quota kha gaya, aur 12 cases quota ki wajah se fail
    hue, code ki wajah se nahi.
    **Hal:** retries band kiye, eval mein requests ke beech 13s ka gap rakha, 429 aate hi eval ruk jaata hai, aur
    results file mein save hote hain.
12. **Provider ka raw error user ko 500 ke saath dikh raha tha.**
    **Hal:** saaf message aur sahi status code (429/503/504). Poora error sirf server log mein.
13. **AI ka Markdown plain text mein bura dikh raha tha, aur seedha HTML lagana XSS ka khatra tha.**
    **Hal:** `SafeMarkdown` banaya, jo HTML escape karta hai, khatarnaak links hatata hai aur math KaTeX se dikhata hai.
14. **Mere hi example mein shares galat the.** Demo 1 ki jagah 4 kharab shares batata.
    **Hal:** tool se check kiya, theek kiya, aur test laga diya.
15. **"128-bit key" wala example LLM ko 2¹²⁸ calculate karne par majboor karta**, jo rule ke khilaaf tha.
    **Hal:** example 6-digit PIN wala kar diya.
16. **Gemini schema mein regex shayad support na kare.**
    **Hal:** regex hata ke check compiler mein daala (`10,000` → `10000`, `99.99` reject).
17. **Visualizer ko parameters ke saath kholne ka tarika nahi tha.**
    **Hal:** URL params (`?p=&n=&t=…`) ka support add kiya.
18. **Naye links se navbar toot raha tha.**
    **Hal:** desktop menu badi screen se dikhta hai, aur icons sirf bahut badi screen par.
19. **Dev server kabhi kabhi 500 deta tha ya stream tod deta tha.**
    **Hal:** dobara chalaya to theek chala. Wajah hot-reload ka recompile thi, code nahi.
20. **Pehle eval ka output kho diya** (sirf aakhri lines dekhi thi).
    **Hal:** ab har case ka result turant print hota hai aur `eval-results.json` mein save hota hai.

---

## 5. Likely interview questions

**Q: Why Shamir instead of homomorphic encryption or pairwise masking for secure aggregation?**
Shamir sharing is information-theoretically secure and cheap (just additions mod p). It also gives dropout
tolerance for free through the threshold. Pairwise masking (Bonawitz et al.) needs extra rounds to recover the masks
of dropped clients. The cost is O(n²) messages per round, which is fine for tens of clients.

> **🇮🇳 Hinglish:** Shamir sasta hai (sirf jodna hota hai), aur math se proven secure hai. Threshold ki wajah se dropout
> handling free mein mil jaati hai. Masking wale tareeke mein gayab clients ke mask recover karne ke liye extra rounds
> lagte hain. Kami ye hai ki messages n² hote hain, lekin das-bees clients ke liye ye theek hai.

**Q: What's the threat model?**
Semi-honest (honest-but-curious) parties, with up to t−1 colluding. A malicious party sending bad shares is not
prevented during aggregation. That would need verifiable secret sharing (Feldman/Pedersen commitments). The
Copilot's corruption detection is an offline debugging aid, not a protocol defence.

> **🇮🇳 Hinglish:** Maana hai ki parties protocol follow karti hain lekin jhaank sakti hain (semi-honest), aur t−1 tak
> mil sakti hain. Koi jaan-boojh ke galat share bheje to protocol use nahi rokta. Uske liye verifiable secret sharing
> chahiye. Copilot ka "kharab share pakadna" debugging ke liye hai, security guarantee nahi. Ye baat interview mein
> khud bata dena, achha impression padta hai.

**Q: Why must multiplication have n ≥ 2t−1?**
The product of two degree-(t−1) polynomials has degree 2(t−1), which needs 2t−1 points to interpolate before
resharing reduces it back to degree t−1.

> **🇮🇳 Hinglish:** Do degree-(t−1) polynomial multiply karo to degree 2(t−1) ban jaati hai. Use banane ke liye 2t−1
> points chahiye. Isliye kam se kam 2t−1 parties honi chahiye, phir resharing se degree wapas t−1 kar dete hain.

**Q: How do you stop the LLM from hallucinating numbers?**
It never produces them. Math lives in typed, tested tools. The model picks tools and explains results. Outputs are
validated by zod, and the UI shows every tool call. For NL-to-MPC the LLM only fills a fact schema, and the compiler
picks t and p by rule, with the reason recorded.

> **🇮🇳 Hinglish:** Simple: LLM number banata hi nahi. Number tools se aate hain, aur tools tested hain. UI mein har tool
> call dikhta hai, to koi bhi check kar sakta hai. NL-to-MPC mein LLM sirf form bharta hai, aur t, p compiler rule se
> chunta hai.

**Q: How did you evaluate the LLM part?**
A labelled set of 15 requirements (including two impossible ones that must be rejected), scored on validity, n, t,
operation and p, run end to end against the real API with rate-limit pacing. Compiler logic is covered separately
by unit tests without an LLM.

> **🇮🇳 Hinglish:** 15 English requirements banayi, har ek ka sahi jawab pehle se likha (n, t, operation, p, valid ya
> nahi), aur asli API par chalaya. 15/15 sahi aaye. Compiler ke alag se 14 tests hain jo LLM ke bina chalte hain.
> Sach bhi bolna: set chhota hai aur maine khud likha hai.

**Q: How does the fallback chain work?**
It wraps models behind the SDK's `LanguageModel` interface, so callers don't change. Each call tries models in
order. Retriable failures (429, 404, 5xx, network, timeout before the first token) move on to the next model;
non-retriable ones (400/401/403, user abort) are thrown at once. Streaming falls back only before the first chunk,
so an answer is never restarted halfway.

> **🇮🇳 Hinglish:** Teen models ko ek model ki tarah wrap kiya, to baaki code ko pata bhi nahi chalta. Ek fail ho
> (quota, band, busy, network, ya timeout) to agla try hota hai. Galat key par nahi, kyunki woh sab par fail hogi.
> Streaming mein agar jawab shuru ho chuka hai to beech mein model nahi badalta, taaki aadha jawab dobara na aaye.

**Q: What would you do next?**

- Run clients as real separate processes over a network.
- Add verifiable secret sharing for malicious security.
- Add differential privacy noise to the aggregate.
- Grow the eval set and track it in CI.
- Stream the Copilot's model choice to the UI.

> **🇮🇳 Hinglish:**
>
> - Clients ko asli alag machines par network ke through chalana. Abhi sab ek browser mein simulate hote hain.
> - Galat share bhejne wali party se bachne ke liye verifiable secret sharing.
> - Total mein differential privacy noise.
> - Bada eval set, jo CI mein chale.
> - Copilot UI mein dikhana ki kis model ne jawab diya.

---

## 6. Resume bullets (matching the actual code)

**AI Engineer Intern, IIIT Sri City (Prof. Kartik Sutradhar)**

- Built a privacy-preserving federated learning pipeline that combines FedAvg with Shamir secret-sharing secure
  aggregation (fixed-point encoding over GF(2⁶¹−1)). It matched plaintext accuracy (94.5%) with ≤2×10⁻⁵
  aggregation error, kept individual updates and dataset sizes hidden from the server, and tolerated client dropouts.
- Developed an agentic Cryptography Copilot with the Vercel AI SDK and Gemini function calling. It calls 5
  deterministic tools to verify (t, n) threshold parameters and to root-cause failed share reconstructions (locates
  corrupted shares, threshold mismatches and field errors), with a multi-model fallback chain and per-user rate
  limiting.
- Engineered a natural-language-to-MPC engine. An LLM extracts confidentiality constraints into a typed schema, and a
  deterministic compiler derives threshold and prime parameters, rejects infeasible requirements with fixes, and
  emits executable Shamir protocols. Evaluated on a 15-case labelled set (15/15 correct, including rejection of
  infeasible requirements).

Note: the resume previously said "LangChain / Vercel AI SDK". The code uses the **Vercel AI SDK only**, so the
bullets above say exactly that.

> **🇮🇳 Hinglish:** Resume English mein hi rahega, isliye ye bullets English mein hain. Har bullet ka matlab:
>
> 1. **FL bullet:** Shamir se secure aggregation wala federated learning banaya. Accuracy normal training jitni rahi
>    (94.5%), server ko kisi ka update nahi dikha, aur clients gayab hone par bhi chala.
> 2. **Copilot bullet:** AI agent banaya jo 5 tools se parameters check karta hai aur kharab shares dhundhta hai.
>    Saath mein model fallback aur rate limit bhi hai.
> 3. **NL-to-MPC bullet:** English requirement → LLM facts nikaalta hai → compiler t, p chunta hai aur protocol banata
>    hai. 15 mein se 15 test sahi.
>
> **Dhyan rakho:** resume mein abhi "LangChain" likha hai, lekin code mein LangChain use nahi hua. Use hata do, warna
> interview mein LangChain par sawal aaya to jawab nahi de paoge.
