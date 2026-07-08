const state = {
  current: 0,
  exported: false,
  autoTimer: null,
};

const screens = [
  { id: "capture", silo: "site", render: renderCapture },
  {
    id: "processing",
    silo: "claim",
    render: renderProcessing,
    autoAdvance: 2300,
  },
  { id: "claim", silo: "claim", render: renderClaimFile },
  { id: "send", silo: "decision", render: renderSendStatus },
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
  if (state.autoTimer) {
    clearTimeout(state.autoTimer);
    state.autoTimer = null;
  }
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
  if (screen.autoAdvance) {
    state.autoTimer = setTimeout(next, screen.autoAdvance);
  }
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
  if (state.autoTimer) {
    clearTimeout(state.autoTimer);
    state.autoTimer = null;
  }
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

function phone(content, className = "") {
  return `<div class="frame-phone pitch-phone ${className}"><div class="phone-glass">${content}</div></div>`;
}

function renderCapture() {
  return html`<div class="capture-only">
    ${phone(
      html`<div class="phone-status"><span>10:42</span><span>Nubo</span></div>
        <div class="cam-view">
          <img
            src="pipe-strike.png"
            alt="Excavator exposing a damaged underground pipe"
            loading="eager"
          />
          <div class="cam-top">
            <span>10:42</span>
            <div class="cam-top-ctrls">
              <span>⚡ Auto</span><span>HDR</span>
            </div>
          </div>
          <div class="cam-reticle"></div>
          <div class="cam-geo">
            <span class="cam-geo-dot"></span
            ><span
              >${SCENARIO.capture.location}<br />${SCENARIO.capture.coordinates}<br />${SCENARIO.capture.time}</span
            >
          </div>
          <div class="voice-rec">
            <div><span class="rec-dot"></span>REC voice note</div>
            <div class="voice-wave">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
        </div>
        <div class="cam-bar">
          <div class="cam-modes">
            <span>VIDEO</span><span class="is-active">PHOTO</span
            ><span>PANO</span>
          </div>
          <div class="cam-actions">
            <span class="cam-thumb"></span>
            <button
              class="cam-shutter"
              type="button"
              data-next
              aria-label="Shutter"
            ></button>
            <span class="cam-flip">⟳</span>
          </div>
        </div>`,
      "camera-phone",
    )}
  </div>`;
}

function renderProcessing() {
  return browser(
    html`<div class="processing-demo">
      <div class="ai-spinner"></div>
      <div class="processing-title">Building claim file</div>
      <div class="processing-list">
        <div><b></b><span>Reading site capture</span></div>
        <div><b></b><span>Matching plan set</span></div>
        <div><b></b><span>Calculating cost impact</span></div>
      </div>
    </div>`,
  );
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
        <section class="panel evidence-photo evidence-photo--large">
          <img
            src="pipe-strike.png"
            alt="Excavator exposing a damaged underground pipe"
          />
          <div class="evidence-meta">
            <div>
              <span>GPS</span><strong>${SCENARIO.capture.coordinates}</strong>
            </div>
            <div>
              <span>Time</span><strong>${SCENARIO.capture.time}</strong>
            </div>
            <div>
              <span>Voice</span><strong>${SCENARIO.capture.voice}</strong>
            </div>
          </div>
        </section>
        <section class="panel claim-middle">
          <div>
            <div class="kicker">AI summary</div>
            <div class="fact-row">
              <span>Claim basis</span><strong>${SCENARIO.ai.cause}</strong>
            </div>
            <div class="fact-row">
              <span>Extra work</span><strong>${SCENARIO.ai.work}</strong>
            </div>
          </div>
          <div>
            <div class="kicker">Packet</div>
            <div class="doc-list compact-doc-list">
              <div class="check"><span>Photo + timestamp</span><b>✓</b></div>
              <div class="check">
                <span>Voice note transcript</span><b>✓</b>
              </div>
              <div class="check"><span>Plan extract</span><b>✓</b></div>
              <div class="check open">
                <span>Site-supervisor confirmation</span><b>!</b>
              </div>
            </div>
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

function renderSendStatus() {
  return browser(
    html`<div class="send-status">
      <div class="send-icon">
        <div class="send-spinner"></div>
        <div class="send-check">✓</div>
      </div>
      <div class="send-copy">
        <div class="kicker">Owner packet</div>
        <h1><span>Sending to owner</span><span>Sent</span></h1>
        <p>${SCENARIO.claimId} · ${SCENARIO.value} · ${SCENARIO.deadline}</p>
      </div>
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
