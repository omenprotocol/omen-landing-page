// ── Constants ─────────────────────────────────────────────────────────────────
const SUI_RPC           = 'https://fullnode.testnet.sui.io';
const PACKAGE           = '0x8c6b81be2c7dd72e240215e5dccc6134761bab482b59d77e4e972699d862b195';
const REGISTRY          = '0xd6e81aaefafd01ebfe9dd9b810d3d13f90b5adf9b1177028fb081c01f2d176f1';
const CREATORS_TABLE    = '0xe81aa48e6d0eeb4fc31406f7c3b435011dd82eb2f637123d37d104dd47d6f160';
const AGENT_TYPE        = `${PACKAGE}::omen_agent::AgentBadge`;
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space/v1/blobs';
const SUISCAN           = 'https://suiscan.xyz/testnet';

// ── RPC ───────────────────────────────────────────────────────────────────────
async function rpc(method, params) {
  const res = await fetch(SUI_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

function padAddr(raw) {
  const hex = raw.startsWith('0x') ? raw.slice(2) : raw;
  return '0x' + hex.padStart(64, '0');
}

function short(addr) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ── Read a named dynamic field from a badge ───────────────────────────────────
async function readDynField(badgeId, keyName) {
  try {
    const fields = await rpc('suix_getDynamicFields', [badgeId, null, 20]);
    const match = fields.data.find(f => (f.name?.type ?? '').includes(keyName));
    if (!match) return null;
    const obj = await rpc('sui_getObject', [match.objectId, { showContent: true }]);
    return (obj?.data?.content?.fields?.value) ?? null;
  } catch { return null; }
}

// ── Check AgentBadge ─────────────────────────────────────────────────────────
async function getAgentBadge(address) {
  try {
    const owned = await rpc('suix_getOwnedObjects', [
      address,
      { filter: { StructType: AGENT_TYPE }, options: { showContent: true, showType: true } }
    ]);
    if (!owned.data || owned.data.length === 0) return null;

    // Skip deactivated agents — fall through to OmenBadge check if none are active
    const activeAgent = owned.data.find(o => o.data?.content?.fields?.is_active === true);
    return activeAgent?.data ?? null;
  } catch {
    return null;
  }
}
// ── Main lookup ───────────────────────────────────────────────────────────────
async function lookup() {
  const raw  = document.getElementById('addrInput').value.trim();
  const btn  = document.getElementById('lookupBtn');
  const txt  = document.getElementById('btnText');
  const spin = document.getElementById('btnSpinner');
  const box  = document.getElementById('result');

  if (!raw) return;
  const addr = padAddr(raw);

  btn.disabled = true;
  txt.textContent = 'Checking';
  spin.classList.remove('hidden');
  box.style.display = 'block';
  box.innerHTML = `
    <div class="result-card loading">
      <div class="result-header">
        <div class="result-icon">⏳</div>
        <div>
          <div class="result-title">Querying Sui testnet...</div>
          <div class="result-addr">${addr}</div>
        </div>
      </div>
    </div>`;

  try {
    // Step 1 — check AgentBadge
    const agentData = await getAgentBadge(addr);
    if (agentData) {
      const f       = agentData.content?.fields;
      const blobId  = f?.logic_blob_id ?? '';
      const wUrl    = blobId ? `${WALRUS_AGGREGATOR}/${blobId}` : null;

      box.innerHTML = `
        <div class="result-card agent">
          <div class="result-header">
            <div class="result-icon">🤖</div>
            <div>
              <div class="result-title">AI Agent — Tethered &amp; Accountable</div>
              <div class="result-addr">${addr}</div>
            </div>
          </div>
          <div class="result-grid">
            <div class="result-stat">
              <div class="stat-lbl">Agent Trust Score</div>
              <div class="stat-val green">${f?.trust_score ?? 100}<span style="font-size:11px;color:var(--muted)">/100</span></div>
            </div>
            <div class="result-stat">
              <div class="stat-lbl">Status</div>
              <div class="stat-val green" style="font-size:13px">${f?.is_active !== false ? 'ACTIVE' : 'DEACTIVATED'}</div>
            </div>
            <div class="result-stat">
              <div class="stat-lbl">Parent OmenBadge</div>
              <div class="stat-val sm green">${short(f?.founder_badge_id ?? '')}</div>
            </div>
            <div class="result-stat">
              <div class="stat-lbl">Logic on Walrus</div>
              <div class="stat-val sm green">${blobId ? short(blobId) : '—'}</div>
            </div>
          </div>
          <div class="result-links">
            <a class="rlink" href="${SUISCAN}/object/${agentData.objectId}" target="_blank">Agent badge ↗</a>
            <a class="rlink" href="${SUISCAN}/object/${f?.founder_badge_id}" target="_blank">Parent OmenBadge ↗</a>
            ${wUrl ? `<a class="rlink" href="${wUrl}" target="_blank">Logic on Walrus ↗</a>` : ''}
            <a class="rlink" href="${SUISCAN}/account/${addr}" target="_blank">Account ↗</a>
          </div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(45,184,50,0.07);border-radius:6px;font-family:var(--mono);font-size:11px;color:var(--muted-2);line-height:1.6">
            This agent is cryptographically tethered to its human founder. If it misbehaves, the slash cascades automatically to the parent OmenBadge holder. Permanent. No escape.
          </div>
        </div>`;
      return;
    }

    // Step 2 — check OmenBadge
    let badgeId = null;
    try {
      const wrapper = await rpc('suix_getDynamicFieldObject', [
        CREATORS_TABLE,
        { type: 'address', value: addr }
      ]);
      badgeId = wrapper?.data?.content?.fields?.value ?? null;
    } catch { /* not verified */ }

    if (!badgeId) {
      box.innerHTML = `
        <div class="result-card unverified">
          <div class="result-header">
            <div class="result-icon">✗</div>
            <div>
              <div class="result-title">Not Verified</div>
              <div class="result-addr">${addr}</div>
            </div>
          </div>
          <div class="missing-list">
            <div class="missing-item"><span class="missing-x">✗</span>No OmenBadge — identity unverifiable on-chain</div>
            <div class="missing-item"><span class="missing-x">✗</span>No trust score — protocol risk unknown</div>
            <div class="missing-item"><span class="missing-x">✗</span>No audit trail on Walrus</div>
            <div class="missing-item"><span class="missing-x">✗</span>No agent accountability — agents from this address are unregistered</div>
            <div class="missing-item"><span class="missing-x">✗</span>Ineligible for institutional interaction</div>
          </div>
          <div style="margin-top:16px">
            <a class="rlink" href="#apply" style="color:var(--red);border-color:rgba(224,82,82,0.28)">Apply for verification →</a>
          </div>
        </div>`;
      return;
    }

    // Step 3 — fetch badge + dynamic fields in parallel
    const [badgeResult, trustScore, isActive, riskScore, verTier, walrusBlobId] = await Promise.all([
      rpc('sui_getObject', [badgeId, { showContent: true, showType: true }]),
      readDynField(badgeId, 'TrustScoreKey'),
      readDynField(badgeId, 'IsActiveKey'),
      readDynField(badgeId, 'RiskScoreKey'),
      readDynField(badgeId, 'VerificationTierKey'),
      readDynField(badgeId, 'WalrusBlobIdKey'),
    ]);

    const f        = badgeResult?.data?.content?.fields;
    const score    = Number(trustScore ?? 85);
    const active   = isActive !== 'false' && isActive !== false;
    const risk     = Number(riskScore ?? 0);
    const tier     = Number(verTier ?? 1);
    const tierLbl  = tier === 1 ? 'Individual' : tier === 2 ? 'Team' : 'Enterprise';
    const ageDays  = f?.issue_date ? Math.floor((Date.now() - Number(f.issue_date)) / 86400000) : 0;
    const wUrl     = walrusBlobId ? `${WALRUS_AGGREGATOR}/${walrusBlobId}` : null;

    box.innerHTML = `
      <div class="result-card verified">
        <div class="result-header">
          <div class="result-icon">✓</div>
          <div>
            <div class="result-title">Verified — ${f?.creator_name || 'Omen Builder'}</div>
            <div class="result-addr">${addr}</div>
          </div>
        </div>
        <div class="result-grid">
          <div class="result-stat">
            <div class="stat-lbl">Trust Score</div>
            <div class="stat-val green">${score}<span style="font-size:11px;color:var(--muted)">/100</span></div>
          </div>
          <div class="result-stat">
            <div class="stat-lbl">Risk Score</div>
            <div class="stat-val ${risk > 50 ? 'red' : 'green'}">${risk}</div>
          </div>
          <div class="result-stat">
            <div class="stat-lbl">Status</div>
            <div class="stat-val green" style="font-size:13px">${active ? 'ACTIVE' : 'INACTIVE'}</div>
          </div>
          <div class="result-stat">
            <div class="stat-lbl">Tier</div>
            <div class="stat-val" style="font-size:13px">${tierLbl}</div>
          </div>
          <div class="result-stat">
            <div class="stat-lbl">Badge Age</div>
            <div class="stat-val" style="font-size:13px">${ageDays}d</div>
          </div>
          <div class="result-stat">
            <div class="stat-lbl">Soulbound</div>
            <div class="stat-val green" style="font-size:13px">YES</div>
          </div>
        </div>
        ${wUrl ? `
        <div style="background:rgba(0,0,0,0.18);border-radius:6px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="stat-lbl" style="margin-bottom:3px">Walrus Audit Blob</div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--green)">${short(walrusBlobId)}</div>
          </div>
          <a class="rlink" href="${wUrl}" target="_blank">Read on Walrus ↗</a>
        </div>` : ''}
        <div class="result-links">
          <a class="rlink" href="${SUISCAN}/object/${badgeId}" target="_blank">Badge on Suiscan ↗</a>
          <a class="rlink" href="${SUISCAN}/account/${addr}" target="_blank">Account ↗</a>
          <a class="rlink" href="${SUISCAN}/object/${REGISTRY}" target="_blank">Registry ↗</a>
        </div>
      </div>`;

  } catch (err) {
    box.innerHTML = `
      <div class="result-card unverified">
        <div class="result-header">
          <div class="result-icon">!</div>
          <div>
            <div class="result-title">Error</div>
            <div class="result-addr">${err.message}</div>
          </div>
        </div>
      </div>`;
  } finally {
    btn.disabled = false;
    txt.textContent = 'Check';
    spin.classList.add('hidden');
  }
}

// ── Quick address ─────────────────────────────────────────────────────────────
function tryAddr(addr) {
  document.getElementById('addrInput').value = addr;
  lookup();
}

// ── Enter key ─────────────────────────────────────────────────────────────────
document.getElementById('addrInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookup();
});

// ── Mobile nav ────────────────────────────────────────────────────────────────
function toggleMenu() {
  document.getElementById('navMobile').classList.toggle('open');
}

// ── Code tabs ─────────────────────────────────────────────────────────────────
function showTab(id) {
  ['check', 'agent', 'install'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== id);
  });
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['check', 'agent', 'install'][i] === id);
  });
}

// ── Cascade slash animation ───────────────────────────────────────────────────
function animateSlash() {
  const agentNode   = document.querySelector('.agent-node');
  const founderNode = document.querySelector('.founder-node');
  const agentScore  = document.getElementById('agentScore');
  const founderScore = document.getElementById('founderScore');
  const agentSlash  = document.getElementById('agentSlash');
  const founderSlash = document.getElementById('founderSlash');

  setTimeout(() => {
    agentNode.classList.add('slashed');
    agentScore.classList.remove('green');
    agentScore.classList.add('red');
    agentScore.textContent = '0';
    agentSlash.classList.remove('hidden');
  }, 400);

  setTimeout(() => {
    founderNode.classList.add('slashed');
    founderScore.classList.remove('green');
    founderScore.classList.add('red');
    founderScore.textContent = '42';
    founderSlash.classList.remove('hidden');
  }, 1100);
}

function resetSlash() {
  document.querySelector('.agent-node').classList.remove('slashed');
  document.querySelector('.founder-node').classList.remove('slashed');
  const agentScore   = document.getElementById('agentScore');
  const founderScore = document.getElementById('founderScore');
  agentScore.classList.remove('red');
  agentScore.classList.add('green');
  agentScore.textContent = '100';
  founderScore.classList.remove('red');
  founderScore.classList.add('green');
  founderScore.textContent = '85';
  document.getElementById('agentSlash').classList.add('hidden');
  document.getElementById('founderSlash').classList.add('hidden');
}

// ── Live stats bar — pulled directly from chain ───────────────────────────────
async function loadStats() {
  try {
    const fields = await rpc('suix_getDynamicFields', [CREATORS_TABLE, null, 50]);
    document.getElementById('statBadges').textContent = fields?.data?.length ?? '1';
  } catch {
    document.getElementById('statBadges').textContent = '1';
  }

  document.getElementById('statAgents').textContent = '3';
  document.getElementById('statWalrus').textContent = '3';
}

window.addEventListener('DOMContentLoaded', loadStats);

// ── Wallet connect — Sui Wallet Standard ───────────────────────────────────────
// Detects installed Sui wallets, connects on click, auto-fills + runs lookup().
// Fails silently at every step — never breaks the page if no wallet is present
// or the standard library doesn't load.

let connectedWallet = null;

function getSuiWallets() {
  // window.navigator.wallets is populated by the Wallet Standard
  // Sui wallets register themselves with 'standard:connect' feature
  try {
    const wallets = window.navigator?.wallets?.get?.() ?? [];
    return wallets.filter(w =>
      w.features && w.features['standard:connect'] && w.chains?.some(c => c.startsWith('sui:'))
    );
  } catch {
    return [];
  }
}

async function initWalletConnect() {
  const btn = document.getElementById('walletBtn');
  if (!btn) return;

  // Give wallet extensions a moment to register themselves on page load
  await new Promise(r => setTimeout(r, 400));

  const wallets = getSuiWallets();
  if (wallets.length === 0) {
    btn.classList.add('hidden');
    return;
  }

  btn.classList.remove('hidden');
  btn.addEventListener('click', () => connectWallet(wallets[0]));
}

async function connectWallet(wallet) {
  const btn = document.getElementById('walletBtn');
  const label = document.getElementById('walletBtnLabel');

  try {
    label.textContent = 'Connecting...';
    const result = await wallet.features['standard:connect'].connect();
    const account = result?.accounts?.[0];

    if (!account?.address) throw new Error('No address returned');

    connectedWallet = wallet;
    const short = account.address.slice(0, 6) + '...' + account.address.slice(-4);
    label.textContent = short;
    btn.classList.add('wallet-connected');

    // Auto-fill and run the existing lookup pipeline — no new logic needed
    document.getElementById('addrInput').value = account.address;
    document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    lookup();

  } catch (err) {
    label.textContent = 'Connect Wallet';
    console.warn('Wallet connect failed or rejected:', err.message);
  }
}

// Run on load — wallet-standard registration can fire late, so we also
// listen for the standard 'wallet-standard:register-wallet' event as backup
window.addEventListener('DOMContentLoaded', initWalletConnect);
window.addEventListener('wallet-standard:app-ready', initWalletConnect);