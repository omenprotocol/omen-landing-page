# Omen Protocol — Live Site

Trust infrastructure for the Sui agentic economy. Built for Sui Overflow 2026, Agentic Web track.

**[Live demo →](#)** _(add your GitHub Pages URL here once deployed)_

## What this is

A single static site — no framework, no build step, no backend. Every lookup hits the Sui testnet RPC directly from the browser. Paste any address, get a verified/unverified verdict in under two seconds.

## Stack

Vanilla HTML, CSS, JavaScript. Three files: `index.html`, `style.css`, `app.js`. Hosted free on GitHub Pages.

## Try it yourself

Paste a verified founder address:
```
0x4315fca49167973c154a038ba9b8f6afd5bf9d50ab7e46e8dbac04d3427dbe7f
```

Paste a registered AI agent:
```
0x3c1a1e2f7dc555883030b5bbca7bbcae33a2bc657a05708d01ca3b14326e9bd6
```

Both resolve live, every time, against the real on-chain registry.

## Run locally

```bash
git clone https://github.com/omenprotocol/omen-landing-page.git
cd omen-landing-page
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Related repos

- [omen-contracts](https://github.com/omenprotocol/omen-contracts) — Move source, deployed on testnet
- [omen-sdk](https://github.com/omenprotocol/omen-sdk) — TypeScript client, `getBadge()` / `getAgentBadge()`
- [omen-backend](https://github.com/omenprotocol/omen-backend) — off-chain indexing infrastructure (not required for the demo)

## Built by

Cmg ([@01CryptoGen](https://twitter.com/01CryptoGen)) — solo, self-taught, first Sui hackathon.

## License

MIT
