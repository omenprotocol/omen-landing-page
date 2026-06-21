# Omen Protocol

**Trust infrastructure for the Sui agentic economy.**
Built solo for Sui Overflow 2026 — Agentic Web track.

🔗 **[Live demo →](#)** _(add your GitHub Pages URL here once deployed)_

---

## The problem

Sui is building the most capable agentic economy in crypto. It has no accountability layer.

Every AI agent trading on Sui today operates without a verified human behind it. Every protocol deployed is anonymous until something goes wrong. There is no on-chain way to know who is responsible — not for institutions trying to allocate capital compliantly, not for protocols integrating autonomous agents, and not for the everyday user about to sign a transaction.

## What Omen does

Omen gives every protocol founder a **soulbound on-chain identity** and ties every **AI agent** they deploy back to that identity, permanently. If the agent misbehaves, the consequence cascades automatically — to the agent, and to the human behind it. No committee vote. No appeal. No escape.

Three primitives, all live on Sui testnet right now:

| Primitive | What it does |
|---|---|
| **OmenBadge** | Soulbound identity for a verified human founder. Permanent, non-transferable, carries a trust score. |
| **AgentBadge** | Cryptographically tethers an AI agent's wallet to its founder's OmenBadge. Logic stored on Walrus. |
| **Automatic slash** | When an agent is flagged, its trust score drops to zero and the founder's score is penalised 50% — on-chain, instantly, publicly. |

This isn't simulated. We minted real badges and fired a **real slash transaction** on testnet to prove it — see proof below.

---

## Try it yourself — live, right now

Paste a verified founder address:
```
0x4315fca49167973c154a038ba9b8f6afd5bf9d50ab7e46e8dbac04d3427dbe7f
```

Paste a registered, active AI agent tethered to that founder:
```
0x3c1a1e2f7dc555883030b5bbca7bbcae33a2bc657a05708d01ca3b14326e9bd6
```

Paste literally anything else and watch it correctly return **not verified**.

Every lookup queries the Sui testnet RPC directly from your browser — no backend, no API key, no cache. The chain is the database.

---

## On-chain proof — verify everything yourself

| | |
|---|---|
| **Package** (7 modules) | [`0x8c6b81...b195`](https://suiscan.xyz/testnet/object/0x8c6b81be2c7dd72e240215e5dccc6134761bab482b59d77e4e972699d862b195) |
| **OmenRegistry** | [`0xd6e81a...76f1`](https://suiscan.xyz/testnet/object/0xd6e81aaefafd01ebfe9dd9b810d3d13f90b5adf9b1177028fb081c01f2d176f1) |
| **Genesis OmenBadge** — trust score 85 | [`0x40da9d...3091`](https://suiscan.xyz/testnet/object/0x40da9d9395fccd3e4613f8d7679fe385990d6142975affa91c02355658003091) — `hasPublicTransfer: false`, soulbound confirmed |
| **AgentBadge** (active) | [`0x2173f5...92ab`](https://suiscan.xyz/testnet/object/0x2173f5212c14871238ca66fb73a420cdd457e5514043fc64bd5e7fee8bea92ab) — tethered to the founder, logic on Walrus |
| **Agent logic on Walrus** | [Read the blob ↗](https://aggregator.walrus-testnet.walrus.space/v1/blobs/RDWaoEaHVH8_yjztiNlQ9RbtzM0UqVarX-OKPh3_DDo) |
| **Real on-chain slash** | [`GWb3kaSf...ZVN`](https://suiscan.xyz/testnet/tx/GWb3kaSfbCHdTsDrKyQovsH6Wr5N7bE4XbXJFHhBgZVN) — agent score 100→40, founder score cascaded 85→55 |
| **Deploy transaction** | [`GYL9sk...XsMQ`](https://suiscan.xyz/testnet/tx/GYL9skMmjfVV94qduSzQdmJQpmUwSKUnGaV3De8LXsMQ) |

Every link above resolves to real, live, queryable state on Sui testnet. Nothing in this repo is mocked.

---

## Why this matters — the missing layer

Capability-based agent controls (spend caps, leverage limits) answer *what an agent is allowed to do*. Omen answers *who is responsible when it does it anyway*. Sui's agentic economy needs both layers. Today, almost nothing on Sui has either — Omen ships the second one, live, with a tested kill switch.

| | No identity layer | Capability limits | **Omen** |
|---|---|---|---|
| Human identity verified | No | Not required | **Yes — soulbound badge** |
| Consequence when agent misbehaves | None | Capability revoked | **Automatic cascading slash** |
| Is the consequence public | N/A | Depends | **Yes — on-chain, permanent** |
| Founder bears any cost | No | No | **Yes — 50% cascades to founder** |
| Audit trail storage | None | Not specified | **Walrus blob, on-chain reference** |

---

## Stack

Vanilla HTML, CSS, JavaScript. Three files — `index.html`, `style.css`, `app.js`. No framework, no build step, no npm install for the frontend. Hosted free on GitHub Pages.

```bash
git clone https://github.com/omenprotocol/omen-landing-page.git
cd omen-landing-page
python3 -m http.server 8080
```

Open `http://localhost:8080`.

---

## Ecosystem fit

Built to gate trades for protocols already live on Sui — Cetus, DeepBook, Aftermath, Turbos, Bluefin for DEX routing; Scallop, Navi, Suilend, Kriya, FlowX for lending and yield agents; any AI agent framework needing on-chain accountability; and institutional capital (Bitwise and Canary Capital have both filed for Spot SUI ETFs) that legally cannot interact with anonymous counterparties.

## Roadmap

- **Mainnet** — targeting Q1 2027, pending third-party audit
- **Reviews module** — already deployed, activation next, for community-driven trust scoring
- **First integrations** — DeepBook and Cetus
- **No token planned** — Omen is public good infrastructure

## Security, stated plainly

Not yet audited. Admin-gated minting during this testnet phase. Epoch-based sybil resistance enforced at the contract level. Social recovery via guardian proposals exists but is untested. No dispute/appeal process yet — known gap, on the roadmap.

---

## Related repos

- **[omen-contracts](https://github.com/omenprotocol/omen-contracts)** — Move source, deployed on Sui testnet
- **[omen-sdk](https://github.com/omenprotocol/omen-sdk)** — TypeScript client, `getBadge()` / `getAgentBadge()`
- **[omen-backend](https://github.com/omenprotocol/omen-backend)** — off-chain indexing infrastructure (not required for the demo)

## Built by

**Cmg** ([@01CryptoGen](https://twitter.com/01CryptoGen)) — solo, self-taught programmer and student, building from a university campus in Nigeria. First Sui hackathon. First Move contracts ever written. Every line shipped inside the Sui Overflow 2026 build window.

## License

MIT
