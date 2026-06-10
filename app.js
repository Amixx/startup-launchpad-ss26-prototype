const state = {
  current: 0,
  groundResolved: false,
  heightResolved: false,
  legalResolved: false,
  exported: false,
  lastSilo: null,
  transcriptInterval: null,
  processingTimeout: null,
  hotspotTimeout: null,
  toggledActions: {},
  selectedPricingRowId: "P05",
};

const screens = [
  { id: "s1", silo: "site", number: "01", render: siteHome },
  { id: "s2", silo: "site", number: "02", render: voiceCapture },
  { id: "s3", silo: "site", number: "02b", render: aiProcessing },
  { id: "s4", silo: "site", number: "03", render: aiSummaryActions },
  { id: "s5", silo: "site", number: "04", render: siteCapture },
  { id: "s6", silo: "site", number: "05", render: siteConfirm },
  {
    id: "s7",
    silo: "commercial",
    number: "06",
    render: commercialDashboard,
  },
  { id: "s8", silo: "commercial", number: "07", render: deviationHero },
  { id: "s8b", silo: "commercial", number: "07b", render: evidenceGraph },
  { id: "s8c", silo: "commercial", number: "07c", render: pricingEvidenceMap },
  {
    id: "s10",
    silo: "commercial",
    number: "08",
    render: commercialConfirm,
  },
  { id: "s11", silo: "legal", number: "09", render: legalQueue },
  { id: "s12", silo: "legal", number: "10", render: legalReview },
  { id: "s13", silo: "legal", number: "11", render: signoffExport },
];

const stage = document.querySelector("#stage");
const rail = document.querySelector("#rail");
const status = document.querySelector("#status");
const readout = document.querySelector("#readout");
const toast = document.querySelector("#toast");
const hotspotSelector = [
  "button:not([disabled])",
  "[data-next]",
  "[data-prev]:not([disabled])",
  "[data-restart]",
  "[data-resolve-proofs]",
  "[data-resolve-legal]",
  "[data-export]",
  "[data-toggle-action]",
  "[tabindex]",
].join(",");

function languageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedLanguage = (params.get("lang") ?? "").toLowerCase();

  return Object.prototype.hasOwnProperty.call(I18N, requestedLanguage)
    ? requestedLanguage
    : "de";
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

function isVisibleHotspot(el) {
  const box = el.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

function clearHotspotHints() {
  if (state.hotspotTimeout) {
    clearTimeout(state.hotspotTimeout);
    state.hotspotTimeout = null;
  }
  document
    .querySelectorAll(".hotspot-hint")
    .forEach((el) => el.classList.remove("hotspot-hint"));
}

function flashHotspots(targets = document.querySelectorAll(hotspotSelector)) {
  clearHotspotHints();
  const hotspots = [...targets].filter(isVisibleHotspot);
  if (!hotspots.length) return;

  hotspots.forEach((el) => el.classList.add("hotspot-hint"));
  state.hotspotTimeout = setTimeout(clearHotspotHints, 1600);
}

function translateText(text) {
  if (currentLanguage === "de") return text;
  return Object.entries(I18N.en.replace)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce(
      (value, [source, target]) => value.split(source).join(target),
      text,
    );
}

function translateTree(root) {
  if (currentLanguage === "de") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    // Collapse wrapped-line whitespace so multi-word translation keys match
    // (HTML renders consecutive whitespace as a single space, so this is invisible).
    node.nodeValue = translateText(node.nodeValue.replace(/\s+/g, " "));
  });
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
  translateTree(rail);
  translateTree(status);
  translateTree(stage);
}

function renderShell() {
  document.querySelector("[data-wordmark]").textContent = SCENARIO.product.name;
  rail.innerHTML =
    SCENARIO.roles
      .map(
        (role) => `<div class="rail__node" data-rail="${role.id}">
        <span class="rail__kicker">${role.device}</span>
        <span class="rail__name">${role.label}</span>
        <span class="rail__meta">${role.persona}</span>
      </div>`,
      )
      .join("") + `<div class="packet" id="packet">${SCENARIO.eventId}</div>`;
}

function render() {
  const screen = screens[state.current];
  if (state.transcriptInterval) {
    clearInterval(state.transcriptInterval);
    state.transcriptInterval = null;
  }
  if (state.processingTimeout) {
    clearTimeout(state.processingTimeout);
    state.processingTimeout = null;
  }
  clearHotspotHints();
  const silo = baseSilo(screen.silo);
  const isHandoff = state.lastSilo !== null && state.lastSilo !== silo;
  state.lastSilo = silo;
  toast.classList.remove("is-visible");
  stage.innerHTML = `<section class="screen is-active${isHandoff ? " is-handoff" : ""}" data-screen="${screen.id}">${screen.render()}</section>`;
  updateRail(screen);
  status.innerHTML = screenLabel(screen.silo);
  readout.textContent = `${state.current + 1} / ${screens.length} · ${SCENARIO.claimId}`;
  document.querySelector(".footer-nav [data-prev]").disabled =
    state.current === 0;
  document.querySelector(".footer-nav [data-next]").textContent =
    state.current === screens.length - 1
      ? I18N[currentLanguage].static.restartNext
      : I18N[currentLanguage].static.next;
  stage.querySelectorAll("[data-next]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      next();
    }),
  );
  stage.querySelectorAll("[data-restart]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      restart();
    }),
  );
  stage.querySelectorAll("[data-resolve-ground]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      resolveGround();
    }),
  );
  stage.querySelectorAll("[data-resolve-height]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      resolveHeight();
    }),
  );
  stage.querySelectorAll("[data-resolve-legal]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      resolveLegal();
    }),
  );
  stage.querySelectorAll("[data-export]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      exportPdf();
    }),
  );
  stage.querySelectorAll("[data-pricing-row]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedPricingRowId = el.dataset.pricingRow;
      render();
    }),
  );
  stage.querySelectorAll("[data-toggle-action]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const actionId = el.dataset.toggleAction;
      if (!state.toggledActions) {
        state.toggledActions = {};
      }
      state.toggledActions[actionId] = !state.toggledActions[actionId];
      render();
    });
  });
  applyLanguage();

  setTimeout(() => flashHotspots(stage.querySelectorAll(hotspotSelector)), 260);

  if (screen.id === "s3") {
    state.processingTimeout = setTimeout(() => {
      next();
    }, 1500);
  }

  if (screen.id === "s2") {
    const el = document.getElementById("live-transcript-text");
    if (el) {
      const fullText = translateText(SCENARIO.voiceTranscript);
      const words = fullText.split(" ");
      let currentWordIndex = 0;
      el.textContent = "";
      el.classList.add("live-cursor");

      state.transcriptInterval = setInterval(() => {
        if (currentWordIndex < words.length) {
          el.textContent += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          currentWordIndex++;
          const box = el.closest(".voice-transcript");
          if (box) {
            box.scrollTop = box.scrollHeight;
          }
        } else {
          el.classList.remove("live-cursor");
          el.closest(".voice-record-container")
            ?.querySelector(".mic-container")
            ?.classList.add("is-finished");
          clearInterval(state.transcriptInterval);
          state.transcriptInterval = null;
        }
      }, 100);
    }
  }
}

function baseSilo(silo) {
  if (silo.includes("commercial")) return "commercial";
  if (silo.includes("legal")) return "legal";
  return "site";
}

function screenLabel(silo) {
  return SCENARIO.roles.find((r) => r.id === silo)?.label ?? silo;
}

function updateRail(screen) {
  const active = screen.silo.includes("commercial")
    ? "commercial"
    : screen.silo.includes("legal")
      ? "legal"
      : "site";
  const order = ["site", "commercial", "legal"];
  const index = order.indexOf(active);
  rail.querySelectorAll("[data-rail]").forEach((node) => {
    const nodeIndex = order.indexOf(node.dataset.rail);
    node.classList.toggle("is-active", node.dataset.rail === active);
    node.classList.toggle(
      "is-done",
      nodeIndex < index,
    );
  });
  const packet = document.querySelector("#packet");
  packet.textContent = index === 0 ? SCENARIO.eventId : SCENARIO.claimId;
  packet.style.setProperty(
    "--packet-x",
    ["16%", "50%", "84%"][Math.max(0, index)],
  );
}

function next() {
  if (screens[state.current].id === "s8b" && !state.groundResolved) {
    state.groundResolved = true;
    return render();
  }
  if (screens[state.current].id === "s8c" && !state.heightResolved) {
    state.heightResolved = true;
    return render();
  }
  if (screens[state.current].id === "s12" && !state.legalResolved) {
    state.legalResolved = true;
    return render();
  }
  if (state.current === screens.length - 1) return restart();
  state.current += 1;
  render();
}

function prev() {
  // Mirror the in-place resolves so every "next" step is undoable with "back".
  if (screens[state.current].id === "s8c" && state.heightResolved) {
    state.heightResolved = false;
    return render();
  }
  if (screens[state.current].id === "s8b" && state.groundResolved) {
    state.groundResolved = false;
    return render();
  }
  if (screens[state.current].id === "s12" && state.legalResolved) {
    state.legalResolved = false;
    return render();
  }
  if (state.current === 0) return;
  state.current -= 1;
  render();
}

function restart() {
  state.current = 0;
  state.groundResolved = false;
  state.heightResolved = false;
  state.legalResolved = false;
  state.exported = false;
  state.lastSilo = null;
  state.selectedPricingRowId = "P05";
  toast.classList.remove("is-visible");
  render();
}

function resolveGround() {
  state.groundResolved = true;
  render();
}

function resolveHeight() {
  state.heightResolved = true;
  render();
}

// Claim completeness climbs as the two commercial maps are completed:
// 68 % captured on site → +14 entitlement evidence → +13 pricing evidence → 95 %.
// Legal closes the final 5 % (the BL‑44 reference) downstream.
function claimCompleteness() {
  return (
    68 + (state.groundResolved ? 14 : 0) + (state.heightResolved ? 13 : 0)
  );
}

function resolveLegal() {
  state.legalResolved = true;
  render();
}

function exportPdf() {
  state.exported = true;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

// <!-- ============ SILO 1: BAUSTELLE ============ -->
function phone(content) {
  return `<div class="frame-phone"><div class="phone-glass"><div class="phone-status"><span>09:14</span><span>5G ▰▰▰ 84%</span></div><div class="phone-content">${content}</div></div></div>`;
}

function siteHome() {
  return phone(
    html`<div class="site-home">
        <div class="phone-head">
          <div>
            <div class="kicker">${SCENARIO.project}</div>
            <h2 class="phone-title">Ereignisse Baustelle</h2>
          </div>
          ${chip("Polier", "blue")}
        </div>
        <div class="site-home__action">
          <button class="btn site-home__button" type="button" data-next>
            <span>🎙️</span> Abweichung melden
          </button>
        </div>
      </div>`,
  );
}

function voiceCapture() {
  return phone(
    html`<div class="phone-head">
        <div>
          <div class="kicker">Sprachaufzeichnung</div>
          <h2 class="phone-title">Beschreibe die Abweichung</h2>
        </div>
        ${chip("NEU", "flag")}
      </div>
      <div class="voice-record-container">
        <div class="voice-status-label">Aufnahme läuft...</div>

        <div class="mic-container">
          <div class="mic-voice-ring ring-a"></div>
          <div class="mic-voice-ring ring-b"></div>
          <div class="mic-voice-ring ring-c"></div>
          <div class="mic-btn" role="img" aria-label="Recording in progress">
            ⏹️
          </div>
        </div>

        <div class="voice-transcript">
          <p class="mono" id="live-transcript-text"></p>
        </div>

        <button class="btn" style="width:100%" type="button" data-next>
          Sprachaufzeichnung beenden
        </button>
      </div>`
  );
}

function aiProcessing() {
  return phone(
    html`<div class="ai-processing-container">
      <div class="processing-spinner-box">
        <div class="spinner-ring"></div>
        <span class="system-badge-pulsing">✨ Strukturierung...</span>
      </div>
      <div class="processing-info" style="text-align: center; margin-top: 24px;">
        <div class="kicker">Sprachaufnahme wird verarbeitet...</div>
        <h3 class="phone-title" style="margin-top: 8px; font-size: 18px;">Analyse läuft...</h3>
      </div>
    </div>`
  );
}

function aiSummaryActions() {
  const sum = SCENARIO.aiSummary;

  let causeLabel = sum.ursache;
  let causeType = "flag";
  if (sum.ursache === "ag_instruction") { causeLabel = "Anordnung durch AG / Architekt"; causeType = "blue"; }
  else if (sum.ursache === "changed_conditions") causeLabel = "Geänderte Gegebenheiten vor Ort";
  else if (sum.ursache === "plan_contradiction") causeLabel = "Widerspruch in Planungsunterlagen";
  else if (sum.ursache === "other") { causeLabel = "Sonstiges"; causeType = ""; }

  const hasDelay = sum.terminauswirkung.status === "delay";
  const termChip = chip(
    hasDelay ? `${sum.terminauswirkung.duration} Verzögerung erwartet` : "Keine Verzögerung",
    hasDelay ? "flag" : "ok",
  );

  const rows = [
    { label: "Soll-Ist-Abgleich", val: `<div class="soll-ist-compare">
      <div class="compare-row soll"><span class="compare-label">Soll</span><span class="compare-val">${sum.spiegel.soll}</span></div>
      <div class="compare-row ist"><span class="compare-label">Ist</span><span class="compare-val">${sum.spiegel.ist}</span></div>
    </div>` },
    { label: "Ursache", val: chip(causeLabel, causeType) },
    { label: "Anordnung", val: sum.instruction },
  ];

  const summaryRows = rows.map(row => `
    <div class="summary-row">
      <div class="summary-label">${row.label}</div>
      <div class="summary-val">${row.val}</div>
    </div>
  `).join('');

  const manualItems = SCENARIO.smartActions
    .filter(a => !a.auto)
    .map(action => {
      const isPhoto = action.id === "action-photo";
      return `<div class="action-item is-open"${isPhoto ? ' data-next style="cursor:pointer"' : ''}>
        <div class="action-item-left">
          <span class="action-item-icon">${action.icon}</span>
          <strong>${action.task}</strong>
        </div>
        <span class="action-status-icon">▢</span>
      </div>`;
    }).join('');

  const autoTasks = SCENARIO.smartActions.filter(a => a.auto).map(a => a.task).join(' · ');
  const autoItem = `<div class="action-item is-auto">
    <div class="action-item-left">
      <span>${autoTasks}</span>
    </div>
    <div class="action-badge auto">Auto</div>
    <span class="action-status-icon">✓</span>
  </div>`;

  return phone(
    html`<div class="ai-container">
      <div class="ai-summary-card">
        <div class="summary-title">
          <h3>Mögliche Abweichung</h3>
          ${chip(SCENARIO.bausoll.lv, "blue")}
        </div>
        <div class="metadata-grid" style="margin:8px 0 4px">
          ${chip(sum.location.bauteil, "blue")} ${termChip}
        </div>
        <div class="summary-grid">
          ${summaryRows}
        </div>
      </div>

      <div class="smart-actions-section">
        <div class="smart-actions-title">Erforderliche Nachweise</div>
        <div class="checklist">
          ${manualItems}
          ${autoItem}
        </div>
      </div>

      <button class="btn" style="width:100%" type="button" data-next>
        Foto aufnehmen
      </button>
    </div>`
  );
}

function rockSvg() {
  return `<img src="excavation-evidence.png" alt="Baustellenfoto einer Baugrube mit freigelegter Felskante und gelbem Maßstab" loading="eager" /><span class="camera__stamp">AUTO: GPS · ZEIT · TIEFE</span>`;
}

function siteCapture() {
  return html`<div class="frame-phone camera-phone">
    <div class="phone-glass">
      <div class="cam-view">
        <div class="cam-task-banner">
          <span>📷</span> Aufgabe: Foto der Felskante mit Maßstab
        </div>
        <img
          src="excavation-evidence.png"
          alt="Baustellenfoto einer Baugrube mit freigelegter Felskante und gelbem Maßstab"
          loading="eager"
        />
        <div class="cam-top">
          <span>09:14</span>
          <div class="cam-top-ctrls"><span>⚡ Auto</span><span>HDR</span></div>
        </div>
        <div class="cam-reticle"></div>
        <div class="cam-flag">${SCENARIO.eventId}</div>
        <div class="cam-geo">
          <span class="cam-geo-dot"></span>
          <div>
            ${SCENARIO.metadata[0]}<br />${SCENARIO.metadata[1]} ·
            ${SCENARIO.metadata[3]}<br />${SCENARIO.metadata[4]}
          </div>
        </div>
      </div>
      <div class="cam-bar">
        <div class="cam-modes">
          <span>VIDEO</span><span class="is-active">FOTO</span><span>PANO</span>
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
      </div>
    </div>
  </div>`;
}

function siteConfirm() {
  const actionItems = SCENARIO.smartActions.map(action => {
    const isCompleted = true;
    return `<div class="action-item ${isCompleted ? 'is-auto' : 'is-open'}" style="padding: 6px 12px; font-size: 11px;">
      <div class="action-item-left">
        <span class="action-item-icon">${action.icon}</span>
        <span>${action.task}</span>
      </div>
      <span class="action-status-icon">${isCompleted ? '✓' : '▢'}</span>
    </div>`;
  }).join('');

  return phone(
    html`<div class="phone-head">
        <div>
          <div class="kicker">Übermittelt</div>
          <h2 class="phone-title">Ereignis ${SCENARIO.eventId} erfasst</h2>
        </div>
        ${chip("OK", "ok")}
      </div>
      <div class="camera" style="height:140px">${rockSvg()}</div>
      
      <div style="margin: 12px 0 16px;">
        <div class="smart-actions-title" style="font-size: 9px; margin-bottom: 6px;">Vollständiger Nachweis (100%)</div>
        <div class="checklist" style="gap: 4px;">
          ${actionItems}
        </div>
      </div>

      ${button("Weiter")}`
  );
}

function evidenceGraph() {
  const cards = SCENARIO.demoWorkflow.evidenceCards;
  const groundCards = cards.filter((c) => c.supports === "dem Grunde nach");
  const heightCards = cards.filter((c) => c.supports === "der Höhe nach");
  const resolved = state.groundResolved;
  const pct = claimCompleteness();

  function renderCard(c) {
    let noteHtml = "";
    if (c.note) {
      noteHtml = resolved
        ? `<p class="mono" style="color:var(--ok);font-size:11px;margin:6px 0 0">✓ Gegenzeichnung angefordert</p>`
        : `<p class="mono" style="color:var(--flag);font-size:11px;margin:6px 0 0">⚠ ${c.note}</p>`;
    }
    return `<div class="mini-panel">
      <div class="metadata-grid" style="margin-bottom:6px">
        ${chip(c.id, "blue")} ${chip(c.type, "")}
      </div>
      <strong>${c.title}</strong>
      <p class="mono" style="color:var(--muted);font-size:12px;margin:4px 0 0">${c.role}</p>
      ${noteHtml}
    </div>`;
  }

  return browser(
    html`<div class="panel">
      <h2>Nachweisstruktur · ${SCENARIO.claimId}</h2>
      <p>Das Baustellenereignis wurde klassifiziert und die Nachweise den Prüfkategorien zugeordnet.</p>
      <div class="resolve-layout">
        <div>
          <h3 style="margin-bottom:12px">${chip("dem Grunde nach", "blue")} Anspruchsbegründung</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${groundCards.map(renderCard).join("")}
          </div>
        </div>
        <div>
          <h3 style="margin-bottom:12px">${chip("der Höhe nach", "ok")} Preisnachweis</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${heightCards.map(renderCard).join("")}
          </div>
        </div>
      </div>
      <p class="mono" style="margin:18px 0 5px">Vollständigkeit ${pct} %</p>
      <div class="meter" style="--value:${pct}%"><span></span></div>
      <br /><button
        class="btn ${resolved ? "ok" : ""}"
        type="button"
        data-resolve-ground
      >
        ${resolved
          ? "AG-Gegenzeichnung angefordert"
          : "Fehlende Gegenzeichnung anfordern"}
      </button>
      ${button("Weiter →")}
    </div>`,
  );
}

function pricingEvidenceMap() {
  const rows = SCENARIO.demoWorkflow.pricingRows;
  const resolved = state.heightResolved;
  const pct = claimCompleteness();
  // The red lump-sum row (P05) is the gap that "Fehlende Nachweise ergänzen" closes.
  const isFixed = (r) => r.id === "P05" && resolved;

  const sel =
    rows.find((r) => r.id === state.selectedPricingRowId) ||
    rows.find((r) => r.risk === "red") ||
    rows[0];
  const selFixed = isFixed(sel);

  const borderColor = selFixed
    ? "var(--ok)"
    : sel.risk === "red"
      ? "var(--flag)"
      : "#ffc83c";

  const costLines = rows
    .map((r) => {
      const isSelected = r.id === sel.id;
      const dotColor = isFixed(r)
        ? "var(--ok)"
        : r.risk === "red"
          ? "var(--flag)"
          : "#ffc83c";
      return `<div
          data-pricing-row="${r.id}"
          style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;${isSelected ? "background:rgba(130,199,255,.1);outline:1px solid rgba(130,199,255,.4);" : ""}">
        <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>
        ${chip(r.id, "blue")}
        <span style="flex:1;font-size:13px">${r.description}</span>
        <span class="mono" style="font-size:12px;color:var(--muted)">${r.amount}</span>
      </div>`;
    })
    .join("");

  const selEvidenceChips = selFixed
    ? chip("Aufgeschlüsselt", "ok")
    : sel.evidence.length
      ? sel.evidence.map((e) => chip(e, "blue")).join(" ")
      : chip("Kein Nachweis", "flag");

  const riskChip = selFixed
    ? chip("Belegt", "ok")
    : sel.risk === "red"
      ? chip("Kritisch", "flag")
      : `<span class="chip" style="background:rgba(255,200,60,.15);color:#ffc83c">Offen</span>`;

  const detailBody = selFixed
    ? `<p style="margin:0;color:var(--ok);font-size:13px">✓ ${sel.missingProof}</p>`
    : `<p style="font-size:13px;margin:0 0 12px;color:var(--muted)">${sel.weakness}</p>
       <p style="margin:0;color:var(--ok);font-size:13px">→ ${sel.missingProof}</p>`;

  return browser(
    html`<div class="panel">
      <h2>Kostennachweis · ${SCENARIO.claimId}</h2>
      <div class="resolve-layout">
        <div style="display:flex;flex-direction:column;gap:4px">
          ${costLines}
        </div>
        <div style="border-left:3px solid ${borderColor};padding-left:14px;align-self:flex-start">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px">
            <strong>${sel.id} · ${sel.description}</strong>
            ${riskChip}
          </div>
          <div style="margin-bottom:10px">${selEvidenceChips}</div>
          ${detailBody}
        </div>
      </div>
      <p class="mono" style="margin:18px 0 5px">Vollständigkeit ${pct} %</p>
      <div class="meter" style="--value:${pct}%"><span></span></div>
      <br /><button
        class="btn ${resolved ? "ok" : ""}"
        type="button"
        data-resolve-height
      >
        ${resolved ? "Nachweise vollständig" : "Fehlende Nachweise ergänzen"}
      </button>
      <div class="sum" style="margin-top:14px">
        Urkalkulation fortgeschrieben · Nachtragssumme ≈ ${SCENARIO.pricing.total}
      </div>
      <br />${button("Weiter →")}
    </div>`,
  );
}

// <!-- ============ SILO 2: KAUFMÄNNISCH (screens 5–8) ============ -->
function browser(content, url = "app.nachweis.bau/nachtraege", laptop = false) {
  return `<div class="${laptop ? "frame-laptop" : "frame-browser"}"><div class="browser-chrome"><div class="dots"><span></span><span></span><span></span></div><div class="url">${url}</div><div class="mono" style="text-align:right;color:rgba(14,26,36,.48)">${SCENARIO.product.name}</div></div><div class="browser-body">${content}</div></div>`;
}

function commercialDashboard() {
  const lifecycle = [
    {
      label: "Erfasst",
      type: "blue",
      note: "Mitarbeiter hat Abweichung erkannt und angelegt",
    },
    {
      label: "In Bearbeitung",
      type: "flag",
      note: "Unterlagen und Preise werden ergänzt",
    },
    {
      label: "Intern geprüft",
      type: "ok",
      note: "technisch/kaufmännisch plausibilisiert",
    },
    {
      label: "Eingereicht / offen",
      type: "client",
      note: "beim AG, Antwortfrist läuft",
    },
    { label: "AG anerkannt", type: "ok", note: "vom Auftraggeber bestätigt" },
    { label: "AG abgelehnt", type: "reject", note: "Einwand bearbeiten" },
  ];
  const lifecycleLegend = lifecycle
    .map(
      (item) => `<div class="status-key">
        ${chip(item.label, item.type)}
        <span>${item.note}</span>
      </div>`,
    )
    .join("");

  return browser(
    html`<div class="dashboard-grid">
      <div class="panel">
        <div class="kicker">Nachtrag-Dashboard</div>
        <h2>Nachtragsübersicht</h2>
        <div class="kpis">
          <div class="mini-panel kpi">
            <span class="mono">Erfasst</span><strong>4</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">Volumen</span><strong>142k€</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">AG-Fristen</span
            ><strong style="color:var(--flag)">3</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Status</th>
              <th>AG-Antwort bis</th>
              <th>Nächster Schritt</th>
              <th>Wert</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>N‑201</td>
              <td>Mehrstahl Decke C</td>
              <td>${chip("In Bearbeitung", "flag")}</td>
              <td><span class="deadline-note">noch nicht eingereicht</span></td>
              <td>Mengennachweis fehlt</td>
              <td>11.900 €</td>
            </tr>
            <tr class="highlight" tabindex="0" data-next>
              <td>${SCENARIO.claimId}</td>
              <td><strong>${SCENARIO.title}</strong></td>
              <td>${chip("Erfasst", "blue")}</td>
              <td><span class="deadline-note">nach Einreichung T+7</span></td>
              <td>${chip("Nachweise prüfen", "flag")}</td>
              <td>${SCENARIO.pricing.total}</td>
            </tr>
            <tr>
              <td>N‑205</td>
              <td>Provisorische Entwässerung</td>
              <td>${chip("Eingereicht / offen", "client")}</td>
              <td><strong>17.06.</strong></td>
              <td>Antwort AG offen</td>
              <td>6.400 €</td>
            </tr>
          </tbody>
        </table>
        <div class="status-legend">
          ${lifecycleLegend}
        </div>
      </div>
      <aside class="panel">
        <div class="kicker">Eingang von Baustelle</div>
        <h3>${SCENARIO.eventId}</h3>
        <p>${SCENARIO.note}</p>
        ${chip(SCENARIO.metadata[1], "blue")}
        ${chip(SCENARIO.bauist.depth, "flag")}<br /><br />${button(
          "N‑204 öffnen",
        )}
        <div class="integration-note">
          <strong>Belegquellen:</strong>
          Nachweis bündelt relevante Belege aus Projektordnern, Tickets, Plänen
          und Baustellendokumentation in einen prüffähigen Nachtragsprozess.
        </div>
      </aside>
    </div>`,
  );
}

function deviationHero() {
  return browser(
    html`<div class="panel">
      <h2>Bausoll ↔ Bau-Ist</h2>
      <div class="compare">
        <div class="mini-panel">
          <h3>Bausoll</h3>
          <div class="spec-list">
            <div class="spec-line">
              <span>LV</span><strong>${SCENARIO.bausoll.lv}</strong>
            </div>
            <div class="spec-line">
              <span>Leistung</span
              ><strong>${SCENARIO.bausoll.description}</strong>
            </div>
            <div class="spec-line">
              <span>Menge</span><strong>${SCENARIO.bausoll.quantity}</strong>
            </div>
            <div class="spec-line">
              <span>EP</span><strong>${SCENARIO.bausoll.unitPrice}</strong>
            </div>
          </div>
        </div>
        <div class="vs"><span>ABW.</span></div>
        <div class="mini-panel">
          <h3>Bau-Ist</h3>
          <div class="spec-list">
            <div class="spec-line">
              <span>Befund</span><strong>${SCENARIO.bauist.description}</strong>
            </div>
            <div class="spec-line">
              <span>Tiefe</span><strong>${SCENARIO.bauist.depth}</strong>
            </div>
            <div class="spec-line">
              <span>Mehrmenge</span
              ><strong>${SCENARIO.bauist.extraQuantity}</strong>
            </div>
            <div class="spec-line">
              <span>Verfahren</span><strong>${SCENARIO.bauist.method}</strong>
            </div>
          </div>
        </div>
        <aside class="mini-panel">
          <h3>Risk Check · ${SCENARIO.eventId}</h3>
          <div class="checklist">
            ${SCENARIO.riskFlags
              .map(
                (r) =>
                  `<div class="check open"><span>${r}</span><b>!</b></div>`,
              )
              .join("")}
          </div>
          <p class="mono" style="margin:14px 0 5px">Vollständigkeit 68 %</p>
          <div class="meter"><span></span></div>
        </aside>
      </div>
      <br />${button("Nachweise prüfen")}
    </div>`,
  );
}

function commercialConfirm() {
  return browser(
    html`<div
      class="panel"
      style="text-align:center;max-width:720px;margin:70px auto"
    >
      <div class="kicker">Übergabe</div>
      <h2>Nachtragsakte ${SCENARIO.claimId} — 95 % bereit</h2>
      <p>
        Abweichung, Nachweise, Mengen und Urkalkulationsbezug sind strukturiert.
        Die Akte geht jetzt an Recht zur rechtlichen Freigabe.
      </p>
      <div class="metadata-grid" style="justify-content:center">
        ${chip("Bausoll/Bau-Ist geklärt", "ok")} ${chip("Frist gewahrt", "ok")}
        ${chip(SCENARIO.pricing.total, "ok")}
      </div>
      ${button("An Recht übergeben")}
    </div>`,
  );
}

// <!-- ============ SILO 3: RECHT (screens 9–11) ============ -->
function legalQueue() {
  return browser(
    html`<div class="panel">
      <div class="kicker">Freigabe-Queue</div>
      <h2>1 Nachtragsakte zur Freigabe</h2>
      <div class="queue-item" tabindex="0" data-next>
        <div>
          <h3>${SCENARIO.claimId} · ${SCENARIO.title}</h3>
          <p>${SCENARIO.project} · 95 % bereit · ${SCENARIO.pricing.total}</p>
          <div class="metadata-grid">
            ${chip("Frist gewahrt", "ok")}
            ${chip("1 offener Prüfpunkt", "flag")} ${chip("§ 2 VOB/B", "blue")}
          </div>
        </div>
        <button class="btn" type="button" data-next>Öffnen</button>
      </div>
    </div>`,
    "app.nachweis.bau/freigabe",
    true,
  );
}

function legalReview() {
  const resolved = state.legalResolved;
  const checks = SCENARIO.legalChecks.map((c) =>
    c[1] || resolved ? [c[0], true] : c,
  );
  return browser(
    html`<div class="panel">
      <div class="kicker">Rechtliche Prüfung</div>
      <h2>Belastbarkeit prüfen</h2>
      <div class="resolve-layout">
        <div>
          <div class="checklist">
            ${checks
              .map(
                (c) =>
                  `<div class="check ${c[1] ? "" : "open"}"><span>${c[0]}</span><b>${c[1] ? "✓" : "1 offen"}</b></div>`,
              )
              .join("")}
          </div>
          <div class="note-box">
            <strong>Offen:</strong> ${SCENARIO.finalGap}
          </div>
          <button
            class="btn ${resolved ? "ok" : ""}"
            type="button"
            data-resolve-legal
          >
            ${resolved
              ? "Letzter Prüfpunkt erledigt"
              : "Formulierung bestätigen"}
          </button>
        </div>
        <aside class="mini-panel">
          <h3>Begründungsentwurf</h3>
          <p>
            Die angetroffene Bodenklasse ${SCENARIO.bauist.description} weicht
            vom vertraglich geschuldeten ${SCENARIO.bausoll.description} ab. Die
            geänderte Leistung wurde angeordnet und fristgerecht angekündigt.
          </p>
          <div class="metadata-grid">
            ${chip(SCENARIO.bauist.order, resolved ? "ok" : "flag")}
            ${chip(SCENARIO.pricing.argument, "ok")}
          </div>
        </aside>
      </div>
      <br />${button(
        "Als belastbar bestätigen & freigeben",
        resolved ? "data-next" : "data-resolve-legal",
      )}
    </div>`,
    "app.nachweis.bau/freigabe",
    true,
  );
}

function signoffExport() {
  return browser(
    html`<div class="doc-preview">
      <aside class="panel">
        <div class="kicker">Status</div>
        <h2 style="color:var(--ok)">Belastbar – freigegeben</h2>
        <p>Die prüffähige Nachtragsakte ist bereit für Export und Versand.</p>
        <div class="metadata-grid">
          ${chip(SCENARIO.claimId, "blue")}
          ${chip(SCENARIO.pricing.total, "ok")} ${chip("Legal sign-off", "ok")}
        </div>
        <button class="btn ok" type="button" data-export>
          Nachtragsakte exportieren (PDF)</button
        ><br /><br />${button("Neu starten", "data-restart")}
      </aside>
      <div class="document">
        <div class="kicker">Dokumentvorschau</div>
        <h3>Prüffähige Nachtragsakte · ${SCENARIO.claimId}</h3>
        <p><strong>${SCENARIO.title}</strong><br />${SCENARIO.project}</p>
        <table>
          <tbody>
            ${SCENARIO.documentSections
              .map(
                (s) =>
                  `<tr><td>${s}</td><td>${chip("enthalten", "ok")}</td></tr>`,
              )
              .join("")}
            <tr>
              <td>Nachtragssumme</td>
              <td><strong>${SCENARIO.pricing.total}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`,
    "app.nachweis.bau/freigabe",
    true,
  );
}

// <!-- ============ NAV / TRANSITIONS (JS) ============ -->
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
document.addEventListener("click", (event) => {
  if (event.target.closest(hotspotSelector)) return;
  flashHotspots(stage.querySelectorAll(hotspotSelector));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.closest("button")) return;
  if (event.key === "ArrowRight" || event.key === "Enter") next();
  if (event.key === "ArrowLeft") prev();
  if (event.key.toLowerCase() === "r") restart();
});
