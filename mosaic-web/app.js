// Mosaic web demo — no server, no runtime API calls.
// Screens mirror the original iOS app: Sign-in -> Import (drag & drop) -> Mosaic's Read -> Learn.

const state = {
  view: "signin",          // signin | import | analysis | learn
  reports: [],
  ai: {},
  learn: [],
  selectedId: null,
  imported: new Set(),     // report ids that have been "imported"
};

// Fake source filenames for the synthetic reports (what you "drag in").
const FILE_NAMES = {
  "alice-johnson": "AnnualCreditReport_Sep2026.pdf",
  "marcus-lee": "Experian_FullReport_2026-09.pdf",
  "priya-patel": "CreditKarma_Export_Sep2026.pdf",
};

const money = (n) => "$" + Number(n).toLocaleString("en-US");
const typeLabel = {
  credit_card: "Credit card", auto_loan: "Auto loan", student_loan: "Student loan",
  mortgage: "Mortgage", collection: "Collection",
};
const app = () => document.getElementById("app");

// Tab-bar glyphs, matching the app's SF Symbols (house / envelope / book / exit).
const ICON = {
  house: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2 2.8 10.4a1 1 0 0 0 .6 1.8H5v8.1a.7.7 0 0 0 .7.7h4v-5.4h4.6V21h4a.7.7 0 0 0 .7-.7v-8.1h1.6a1 1 0 0 0 .6-1.8Z"/></svg>`,
  envelope: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6.6A1.6 1.6 0 0 1 4.6 5h14.8A1.6 1.6 0 0 1 21 6.6v.3l-9 5.3-9-5.3Zm0 2.4 8.5 5a1 1 0 0 0 1 0l8.5-5v8.4A1.6 1.6 0 0 1 19.4 19H4.6A1.6 1.6 0 0 1 3 17.4Z"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.4 3h11.2A1.4 1.4 0 0 1 19 4.4v13.2H6.4a1.3 1.3 0 0 0 0 2.6H19V21H6.4A3 3 0 0 1 3.4 18V6A3 3 0 0 1 6.4 3Z"/></svg>`,
  exit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.6 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h4.6v-2.2H6a.8.8 0 0 1-.8-.8V6a.8.8 0 0 1 .8-.8h4.6Zm5.1 3.7-1.6 1.6 2.6 2.6H9.4v2.2h7.3l-2.6 2.6 1.6 1.6L21 12Z"/></svg>`,
};

async function load() {
  const [r, a, l] = await Promise.all([
    fetch("data/reports.json").then((x) => x.json()),
    fetch("data/ai.json").then((x) => x.json()),
    fetch("data/learn.json").then((x) => x.json()),
  ]);
  state.reports = r.reports;
  state.ai = a.content;
  state.learn = l.articles;
  render();
}

function go(view, id) {
  state.view = view;
  if (id) state.selectedId = id;
  render();
  window.scrollTo(0, 0);
}

function render() {
  // The read screen needs an imported report; fall back to import if there isn't one.
  if (state.view === "analysis" && !state.selectedId) state.view = "import";

  if (state.view === "signin") return renderSignin();
  if (state.view === "import") return renderShell(renderImport());
  if (state.view === "analysis") return renderShell(renderAnalysis());
  if (state.view === "learn") return renderShell(renderLearn());
}

// ---------- Sign-in (mirrors WelcomeView) ----------
function renderSignin() {
  app().innerHTML = `
    <div class="signin-wrap">
      <div class="signin-mark">
        <span class="logo"></span>
        <span class="wordmark">Mosaic</span>
      </div>
      <h1>See what changed on your credit report.</h1>
      <p class="tagline">
        Review report changes and organize your next step. Mosaic keeps you in control
        and never submits anything for you.
      </p>
      <div class="signin-cta">
        <button class="btn primary block" id="signin-btn">Sign in to Mosaic</button>
        <button class="btn block" id="privacy-btn">How Mosaic protects your privacy</button>
        <div class="card privacy-note" id="privacy-note" hidden>
          <div class="eyebrow">On-device by design</div>
          <p class="learn-p">
            Your PDF is read and redacted on your device. Only masked facts are ever used to
            generate a summary, and nothing is filed or mailed without you.
          </p>
        </div>
        <p class="signin-note">Demo — authentication is simulated (Auth0 in the real app). No account needed.</p>
      </div>
    </div>`;
  document.getElementById("signin-btn").onclick = () => go("import");
  const note = document.getElementById("privacy-note");
  document.getElementById("privacy-btn").onclick = () => { note.hidden = !note.hidden; };
}

// ---------- App shell (top bar + floating tab bar) ----------
function renderShell(inner) {
  const tab = (v, label, icon, extra = "") =>
    `<button class="tab ${state.view === v ? "active" : ""} ${extra}" data-nav="${v}">
       ${ICON[icon]}<span>${label}</span>
     </button>`;

  const readTab = state.selectedId
    ? tab("analysis", "Read", "envelope")
    : `<button class="tab is-disabled" data-nav="import">${ICON.envelope}<span>Read</span></button>`;

  app().innerHTML = `
    <header class="app-header">
      <div class="brand">
        <span class="logo"></span>
        <span class="wordmark">Mosaic</span>
      </div>
      <span class="synthetic-badge">✦ SYNTHETIC DEMO DATA</span>
    </header>
    <main class="shell-main">${inner}</main>
    <nav class="tab-bar">
      ${tab("import", "Reports", "house")}
      ${readTab}
      ${tab("learn", "Learn", "book")}
      <button class="tab" data-nav="signin">${ICON.exit}<span>Sign out</span></button>
    </nav>`;

  app().querySelectorAll("[data-nav]").forEach((b) => {
    b.onclick = () => go(b.dataset.nav);
  });
  // re-bind screen-specific handlers
  if (state.view === "import") bindImport();
  if (state.view === "analysis") bindAnalysis();
}

// ---------- Import (drag & drop) ----------
function renderImport() {
  const files = state.reports.map((r) => {
    const done = state.imported.has(r.id);
    return `
      <div class="file-card" draggable="true" data-file="${r.id}" title="Drag me into the box (or click)">
        <span class="file-ico">📄</span>
        <div class="file-meta">
          <div class="file-name">${FILE_NAMES[r.id]}</div>
          <div class="file-sub">${r.name} · ${r.scenario}${done ? " · imported ✓" : ""}</div>
        </div>
      </div>`;
  }).join("");

  const resume = state.selectedId
    ? `<div class="tray-cta">
         <button class="btn lavender block" data-nav="analysis">
           <span class="badge">→</span> Open Mosaic's read
         </button>
       </div>`
    : "";

  return `
    <h2 class="screen-title">Import a credit report</h2>
    <p class="screen-sub">Drag one of your report files into the box below — or just click it. Your PDF is processed on-device; only masked facts are ever used.</p>

    ${resume}

    <div class="dropzone" id="dropzone">
      <div class="dz-inner">
        <div class="dz-ico">↓</div>
        <div class="dz-text">Drop a report here to analyze</div>
        <div class="dz-hint">synthetic files only — nothing is uploaded</div>
      </div>
    </div>

    <h3 class="tray-title eyebrow">Your files</h3>
    <div class="file-tray">${files}</div>
  `;
}

function bindImport() {
  const dz = document.getElementById("dropzone");
  app().querySelectorAll(".file-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.file);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", () => importReport(card.dataset.file));
  });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("over");
    const id = e.dataTransfer.getData("text/plain");
    if (id) importReport(id);
  });
}

// On-device processing animation, then show the analysis.
function importReport(id) {
  const steps = [
    "Encrypting file on device (AES-GCM)…",
    "Extracting text (PDFKit / OCR)…",
    "Redacting identifiers…",
    "Comparing against prior snapshot…",
  ];
  const dz = document.getElementById("dropzone");
  dz.classList.add("processing");
  dz.innerHTML = `<div class="dz-inner"><div class="proc-list" id="proc"></div></div>`;
  const proc = document.getElementById("proc");
  let i = 0;
  const tick = () => {
    if (i < steps.length) {
      const div = document.createElement("div");
      div.className = "proc-step";
      div.innerHTML = `<span class="spin">◔</span> ${steps[i]}`;
      proc.appendChild(div);
      if (i > 0) proc.children[i - 1].innerHTML = proc.children[i - 1].innerHTML.replace("◔", "✓").replace("spin", "ok");
      i++;
      setTimeout(tick, 420);
    } else {
      proc.lastChild.innerHTML = proc.lastChild.innerHTML.replace("◔", "✓").replace("spin", "ok");
      state.imported.add(id);
      setTimeout(() => go("analysis", id), 400);
    }
  };
  tick();
}

// ---------- Change detection ----------
function detectChanges(report) {
  const { baseline, current } = report;
  const changes = [];
  const baseAccounts = new Map(baseline.accounts.map((a) => [a.id, a]));

  current.accounts.forEach((a) => {
    if (!baseAccounts.has(a.id)) {
      const isCollection = a.type === "collection";
      changes.push({
        sev: isCollection ? "med" : "high",
        title: `New ${typeLabel[a.type] || a.type}: ${a.creditor}`,
        desc: `Opened ${a.opened} · balance ${money(a.balance)}. ` +
          (isCollection ? "A collection you may not recognize — worth validating."
                        : "You did not have this account in the previous snapshot."),
      });
    }
  });
  current.accounts.forEach((a) => {
    const prev = baseAccounts.get(a.id);
    if (prev && a.balance - prev.balance > 1500) {
      changes.push({
        sev: "low",
        title: `Balance increase: ${a.creditor}`,
        desc: `${money(prev.balance)} → ${money(a.balance)} (+${money(a.balance - prev.balance)}).`,
      });
    }
  });
  const baseInq = new Set(baseline.inquiries.map((i) => i.creditor + i.date));
  current.inquiries.forEach((i) => {
    if (i.type === "hard" && !baseInq.has(i.creditor + i.date)) {
      changes.push({
        sev: "med",
        title: `New hard inquiry: ${i.creditor}`,
        desc: `Dated ${i.date}. Confirm you applied for credit with this company.`,
      });
    }
  });
  return changes;
}

// ---------- Mosaic's Read (analysis) ----------
function renderAnalysis() {
  const report = state.reports.find((r) => r.id === state.selectedId);
  const ai = state.ai[report.id] || {};
  const changes = detectChanges(report);
  const delta = report.current.score - report.baseline.score;
  const deltaClass = delta < 0 ? "down" : delta > 0 ? "up" : "flat";
  const arrow = delta < 0 ? "↘" : delta > 0 ? "↗" : "→";
  const deltaText = delta === 0 ? "no change" : (delta > 0 ? "+" : "") + delta + " pts";

  return `
    <button class="link-back" data-nav="import">‹ Back to import</button>

    <section class="hero">
      <h2 class="hero-title">Your credit report</h2>
      <div class="hero-value">
        <span class="hero-arrow ${deltaClass}">${arrow}</span>${report.current.score}
      </div>
      <div class="hero-caption eyebrow">Credit score · ${deltaText} · was ${report.baseline.score}</div>
      <p class="hero-note"><strong>${changes.length}</strong> changes left to review</p>
    </section>

    <button class="btn lavender block tray-cta" data-nav="import">
      <span class="badge">+</span> Import another report
    </button>

    <div class="card">
      <div class="person-head">
        <div>
          <div class="name">${report.name}</div>
          <div class="ssn">SSN ${report.maskedSsn} · source ${FILE_NAMES[report.id]} (redacted) · ${report.baseline.date} → ${report.current.date}</div>
        </div>
        <span class="risk-badge risk-${ai.riskLevel || "Low"}">${ai.riskLevel || "—"} risk</span>
      </div>
    </div>

    <div class="card">
      <h3>Detected changes (${changes.length})</h3>
      ${changes.length
        ? changes.map((c) => `
          <div class="change sev-${c.sev}">
            <span class="dot"></span>
            <div class="body"><div class="title">${c.title}</div><div class="desc">${c.desc}</div></div>
          </div>`).join("")
        : `<p class="screen-sub" style="margin:0">No notable changes detected.</p>`}
    </div>

    <div class="ai-banner">
      <span class="spark">✦</span>
      <span>Summary and draft are pre-generated. Review the facts, edit the letter, then send it yourself — Mosaic never submits anything for you.</span>
    </div>

    <div class="card">
      <h3>Mosaic's read <span class="ai-tag">AI · pre-generated</span></h3>
      <p class="summary-text">${ai.summary || ""}</p>
      ${ai.recommendedActions ? `<ul class="actions-list">${ai.recommendedActions.map((a) => `<li>${a}</li>`).join("")}</ul>` : ""}
    </div>

    <div class="card">
      <h3>Recovery letter — review and edit before sending</h3>
      <textarea class="letter-area" id="letter">${ai.letter || ""}</textarea>
      <div class="letter-tools">
        <button class="btn primary" id="copy-btn">Copy</button>
        <button class="btn" id="download-btn">Download .txt</button>
      </div>
    </div>`;
}

function bindAnalysis() {
  const report = state.reports.find((r) => r.id === state.selectedId);
  app().querySelector(".link-back").onclick = () => go("import");
  document.getElementById("copy-btn").onclick = () => {
    navigator.clipboard.writeText(document.getElementById("letter").value);
    document.getElementById("copy-btn").textContent = "Copied ✓";
    setTimeout(() => (document.getElementById("copy-btn").textContent = "Copy"), 1500);
  };
  document.getElementById("download-btn").onclick = () => {
    const blob = new Blob([document.getElementById("letter").value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.id}-letter.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
}

// ---------- Learn ----------
function renderLearn() {
  return `
    <h2 class="screen-title">Learn</h2>
    <p class="screen-sub">Plain-language guidance. Educational only — not financial or legal advice.</p>
    <div class="learn-list">
      ${state.learn.map((a) => `
        <article class="card learn-card">
          <div class="learn-head"><h3>${a.title}</h3><span class="learn-tag">${a.tag}</span></div>
          ${a.body.map((p) => `<p class="learn-p">${p}</p>`).join("")}
        </article>`).join("")}
    </div>`;
}

load();
