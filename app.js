const state = {
  current: 0,
  exported: false,
};

const screens = [
  { id: "capture", silo: "site", render: renderCapture },
  { id: "claim", silo: "claim", render: renderClaimFile },
  { id: "decision", silo: "decision", render: renderDecision },
];

const stage = document.querySelector("#stage");
const rail = document.querySelector("#rail");
const status = document.querySelector("#status");
const readout = document.querySelector("#readout");
const toast = document.querySelector("#toast");

function languageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedLanguage = (params.get("lang") ?? "").toLowerCase();

  return Object.prototype.hasOwnProperty.call(I18N, requestedLanguage)
    ? requestedLanguage
    : "en";
}

function setLanguageParam(language) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState({}, "", url);
}

function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (values[i] ?? ""), "");
}

function chip(text, type = "") {
  return `<span class="chip ${type}">${text}</span>`;
}

function button(text, attrs = "data-next") {
  return `<button class="btn" type="button" ${attrs}>${text}</button>`;
}

function applyLanguage() {
  const staticCopy = I18N[currentLanguage].static;
  document.documentElement.lang = currentLanguage;
  document.querySelector(".brand__tag").textContent = staticCopy.brandTag;
  document.querySelector(".nav-hint").textContent = staticCopy.navHint;
  document.querySelector(".footer-nav [data-prev]").textContent =
    staticCopy.back;
  document.querySelector(".footer-nav [data-restart]").textContent =
    staticCopy.restart;
  document.querySelector("#toast").textContent = staticCopy.toast;
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.lang === currentLanguage,
    );
    button.setAttribute(
      "aria-pressed",
      button.dataset.lang === currentLanguage ? "true" : "false",
    );
  });
}

function renderShell() {
  document.querySelector("[data-wordmark]").textContent = SCENARIO.product.name;
  rail.innerHTML = SCENARIO.roles
    .map(
      (role) => `<div class="rail__node" data-rail="${role.id}">
        <span class="rail__kicker">${role.device}</span>
        <span class="rail__name">${role.label}</span>
        <span class="rail__meta">${role.persona}</span>
      </div>`,
    )
    .join("");
}

function render() {
  const screen = screens[state.current];
  stage.innerHTML = `<section class="screen is-active pitch-screen" data-screen="${screen.id}">${screen.render()}</section>`;
  updateRail(screen);
  status.innerHTML = screenLabel(screen.silo);
  readout.textContent = "";
  document.querySelector(".footer-nav [data-prev]").disabled =
    state.current === 0;
  document.querySelector(".footer-nav [data-next]").textContent =
    state.current === screens.length - 1
      ? I18N[currentLanguage].static.restartNext
      : I18N[currentLanguage].static.next;
  document.querySelector(".footer-nav [data-restart]").style.display =
    state.current === screens.length - 1 ? "none" : "";
  stage.querySelectorAll("[data-next]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      next();
    }),
  );
  stage.querySelectorAll("[data-export]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      exportPdf();
    }),
  );
  stage.querySelectorAll("[data-restart]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      restart();
    }),
  );
  applyLanguage();
}

function screenLabel(silo) {
  return SCENARIO.roles.find((r) => r.id === silo)?.label ?? silo;
}

function updateRail(screen) {
  const order = ["site", "claim", "decision"];
  const index = order.indexOf(screen.silo);
  rail.querySelectorAll("[data-rail]").forEach((node) => {
    const nodeIndex = order.indexOf(node.dataset.rail);
    node.classList.toggle("is-active", node.dataset.rail === screen.silo);
    node.classList.toggle("is-done", nodeIndex < index);
  });
}

function next() {
  if (state.current === screens.length - 1) return restart();
  state.current += 1;
  render();
}

function prev() {
  if (state.current === 0) return;
  state.current -= 1;
  render();
}

function restart() {
  state.current = 0;
  state.exported = false;
  toast.classList.remove("is-visible");
  render();
}

function exportPdf() {
  state.exported = true;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function browser(content, url = "app.nubo.ai/claims") {
  return `<div class="frame-browser pitch-browser"><div class="browser-chrome"><div class="dots"><span></span><span></span><span></span></div><div class="url">${url}</div><div class="mono" style="text-align:right;color:rgba(var(--ink-rgb),.48)">${SCENARIO.product.name}</div></div><div class="browser-body">${content}</div></div>`;
}

function phone(content) {
  return `<div class="frame-phone pitch-phone"><div class="phone-glass">${content}</div></div>`;
}

function siteScene() {
  return `<svg class="site-scene" viewBox="0 0 1200 760" role="img" aria-label="Excavator exposing a damaged underground pipe in a trench">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dbeafe" />
        <stop offset="1" stop-color="#fef3c7" />
      </linearGradient>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9a6b3a" />
        <stop offset="1" stop-color="#5b351f" />
      </linearGradient>
    </defs>
    <rect width="1200" height="760" fill="url(#sky)" />
    <rect y="300" width="1200" height="460" fill="#c99055" />
    <path d="M0 376 C160 332 268 356 430 330 C628 298 770 322 1200 286 L1200 760 L0 760 Z" fill="#a86f3f" />
    <path d="M168 462 C310 402 888 390 1038 462 L942 760 L250 760 Z" fill="url(#soil)" />
    <path d="M238 570 C360 536 805 522 958 558" fill="none" stroke="#f7d7a4" stroke-width="28" stroke-linecap="round" opacity="0.65" />
    <g transform="translate(664 228)">
      <rect x="-154" y="108" width="245" height="76" rx="12" fill="#f2b705" />
      <rect x="-78" y="30" width="116" height="92" rx="10" fill="#f6c343" />
      <rect x="-56" y="46" width="72" height="55" rx="5" fill="#1f2937" opacity="0.86" />
      <rect x="-178" y="184" width="312" height="42" rx="21" fill="#262626" />
      <circle cx="-110" cy="205" r="18" fill="#525252" />
      <circle cx="-38" cy="205" r="18" fill="#525252" />
      <circle cx="36" cy="205" r="18" fill="#525252" />
      <path d="M36 52 C162 44 225 126 242 246" fill="none" stroke="#111827" stroke-width="25" stroke-linecap="round" />
      <path d="M238 242 L304 318" fill="none" stroke="#111827" stroke-width="22" stroke-linecap="round" />
      <path d="M296 304 L352 326 L304 358 Z" fill="#3f3f46" />
    </g>
    <g transform="translate(248 520)">
      <path d="M0 72 C170 20 418 2 688 38" fill="none" stroke="#cbd5e1" stroke-width="82" stroke-linecap="round" />
      <path d="M376 33 L478 48" stroke="#111827" stroke-width="88" stroke-linecap="round" />
      <path d="M374 32 L478 48" stroke="#ef4444" stroke-width="64" stroke-linecap="round" />
      <path d="M470 50 C512 68 500 116 450 120" fill="none" stroke="#60a5fa" stroke-width="12" stroke-linecap="round" opacity="0.92" />
    </g>
    <g transform="translate(60 354)">
      <path d="M0 118 L42 10 L84 118 Z" fill="#f97316" />
      <rect x="20" y="58" width="44" height="16" fill="#fff" />
      <rect x="-8" y="118" width="100" height="16" rx="4" fill="#7c2d12" />
    </g>
    <g transform="translate(1032 328)">
      <path d="M0 118 L42 10 L84 118 Z" fill="#f97316" />
      <rect x="20" y="58" width="44" height="16" fill="#fff" />
      <rect x="-8" y="118" width="100" height="16" rx="4" fill="#7c2d12" />
    </g>
  </svg>`;
}

function renderCapture() {
  return html`<div class="capture-only">
    ${phone(
      html`<div class="phone-status"><span>10:42</span><span>Nubo</span></div>
        <div class="cam-view">
          ${siteScene()}
          <div class="cam-top"><span>Evidence</span><span>LIVE</span></div>
          <div class="cam-reticle"></div>
          <div class="pipe-tag">Pipe hit</div>
          <div class="cam-geo">
            <span class="cam-geo-dot"></span
            ><span
              >${SCENARIO.capture.location}<br />${SCENARIO.capture.time}</span
            >
          </div>
        </div>
        <div class="capture-dock">
          ${chip("Photo", "ok")} ${chip("Voice", "ok")} ${chip("GPS", "ok")}
          <button class="btn" type="button" data-next>Save evidence</button>
        </div>`,
    )}
  </div>`;
}

function renderClaimFile() {
  return browser(
    html`<div class="claim-hero compact">
        <div>
          <div class="kicker">Claim file · ${SCENARIO.claimId}</div>
          <h1>${SCENARIO.incident}</h1>
        </div>
        <div class="value-card">
          <span>Total claim</span>
          <strong>${SCENARIO.value}</strong>
          <em>${SCENARIO.deadline}</em>
        </div>
      </div>
      <div class="claim-grid">
        <section class="panel evidence-photo">
          ${siteScene()}
          <div class="photo-caption">${SCENARIO.capture.source}</div>
        </section>
        <section class="panel">
          <div class="kicker">AI summary</div>
          <div class="fact-row">
            <span>What happened</span><strong>${SCENARIO.incident}</strong>
          </div>
          <div class="fact-row">
            <span>Why claimable</span><strong>${SCENARIO.ai.cause}</strong>
          </div>
          <div class="fact-row">
            <span>Extra work</span><strong>${SCENARIO.ai.work}</strong>
          </div>
          <div class="fact-row warning">
            <span>Still needed</span><strong>${SCENARIO.ai.missing}</strong>
          </div>
        </section>
        <section class="panel money-panel">
          <div class="kicker">Money impact</div>
          ${SCENARIO.money
            .map(
              ([label, amount]) =>
                `<div class="money-line"><span>${label}</span><strong>${amount}</strong></div>`,
            )
            .join("")}
          <div class="money-total">
            <span>Total claim</span><strong>${SCENARIO.value}</strong>
          </div>
        </section>
      </div> `,
  );
}

function renderDecision() {
  return browser(
    html`<div class="decision-layout">
      <section class="panel decision-main">
        <div class="kicker">Owner packet</div>
        <h1>Ready to send</h1>
        <div class="decision-number">${SCENARIO.value}</div>
        <div class="metadata-grid">
          ${chip("Facts", "ok")} ${chip("Costs", "ok")}
          ${chip("Deadline", "ok")}
        </div>
        <button class="btn ok" type="button" data-export>Send to owner</button>
      </section>
      <section class="panel document-preview">
        <div class="kicker">Attachments</div>
        <h2>${SCENARIO.incident}</h2>
        <div class="doc-list">
          ${SCENARIO.documents
            .map(
              (item) => `<div class="check"><span>${item}</span><b>✓</b></div>`,
            )
            .join("")}
        </div>
        <div class="claim-summary-card">
          <span>Total claim</span>
          <strong>${SCENARIO.value}</strong>
          <small>${SCENARIO.deadline}</small>
        </div>
      </section>
    </div>`,
  );
}

currentLanguage = languageFromUrl();
renderShell();
render();
document
  .querySelector(".footer-nav [data-next]")
  .addEventListener("click", next);
document
  .querySelector(".footer-nav [data-prev]")
  .addEventListener("click", prev);
document
  .querySelector(".footer-nav [data-restart]")
  .addEventListener("click", restart);
document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    setLanguageParam(currentLanguage);
    renderShell();
    render();
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.closest("button")) return;
  if (event.key === "ArrowRight" || event.key === "Enter") next();
  if (event.key === "ArrowLeft") prev();
  if (event.key.toLowerCase() === "r") restart();
});
