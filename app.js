const state = {
  current: 0,
  proofsResolved: false,
  legalResolved: false,
  exported: false,
  lastSilo: null,
  transcriptInterval: null,
  processingTimeout: null,
  toggledActions: {},
};

const screens = [
  { id: "s0", silo: "intro", number: "00", render: titleScreen },
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
  {
    id: "s9",
    silo: "commercial",
    number: "08",
    render: missingProofPricing,
  },
  {
    id: "s10",
    silo: "commercial",
    number: "09",
    render: commercialConfirm,
  },
  { id: "s11", silo: "legal", number: "10", render: legalQueue },
  { id: "s12", silo: "legal", number: "11", render: legalReview },
  { id: "s13", silo: "legal", number: "12", render: signoffExport },
  { id: "s14", silo: "recap", number: "13", render: recapScreen },
];

const stage = document.querySelector("#stage");
const rail = document.querySelector("#rail");
const status = document.querySelector("#status");
const readout = document.querySelector("#readout");
const toast = document.querySelector("#toast");

function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (values[i] ?? ""), "");
}

function chip(text, type = "") {
  return `<span class="chip ${type}">${text}</span>`;
}

function button(text, attrs = "data-next") {
  return `<button class="btn" type="button" ${attrs}>${text}</button>`;
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
  stage.querySelectorAll("[data-resolve-proofs]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      resolveProofs();
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
          clearInterval(state.transcriptInterval);
          state.transcriptInterval = null;
        }
      }, 100);
    }
  }
}

function baseSilo(silo) {
  if (silo.includes("commercial")) return "commercial";
  if (silo.includes("legal") || silo === "recap") return "legal";
  return "site";
}

function screenLabel(silo) {
  if (silo === "intro") return "";
  if (silo === "recap") return "Abschluss";
  return SCENARIO.roles.find((r) => r.id === silo)?.label ?? silo;
}

function updateRail(screen) {
  const active = screen.silo.includes("commercial")
    ? "commercial"
    : screen.silo.includes("legal")
      ? "legal"
      : screen.silo === "recap"
        ? "legal"
        : screen.silo === "intro"
          ? "site"
          : "site";
  const order = ["site", "commercial", "legal"];
  const index = order.indexOf(active);
  rail.querySelectorAll("[data-rail]").forEach((node) => {
    const nodeIndex = order.indexOf(node.dataset.rail);
    node.classList.toggle("is-active", node.dataset.rail === active);
    node.classList.toggle(
      "is-done",
      nodeIndex < index || screen.silo === "recap",
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
  if (screens[state.current].id === "s9" && !state.proofsResolved) {
    state.proofsResolved = true;
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
  if (screens[state.current].id === "s9" && state.proofsResolved) {
    state.proofsResolved = false;
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
  state.proofsResolved = false;
  state.legalResolved = false;
  state.exported = false;
  state.lastSilo = null;
  toast.classList.remove("is-visible");
  render();
}

function resolveProofs() {
  state.proofsResolved = true;
  render();
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

// <!-- ============ SILO 1: BAUSTELLE (screens 1–4) ============ -->
function titleScreen() {
  return html`<div class="title-card">
    <div>
      <div class="kicker" style="color:#82c7ff">Technischer Nachtrag</div>
      <h1>${SCENARIO.product.name}</h1>
      <div class="subtitle">${SCENARIO.product.tagline}</div>
      <p>${SCENARIO.product.context} ${SCENARIO.oneLine}</p>
      <div class="spine">
        ${SCENARIO.spine.map((s) => `<span>${s}</span>`).join("")}
      </div>
      ${button("Starten", "data-next")}
    </div>
    <div class="blueprint-card">
      <div class="kicker" style="color:#82c7ff">Aktueller Nachtrag</div>
      <h2 style="color:#fff">${SCENARIO.title}</h2>
      <p>${SCENARIO.project}<br />${SCENARIO.workPackage}</p>
      <div class="metadata-grid">
        ${chip(SCENARIO.claimId, "blue")} ${chip(SCENARIO.bausoll.lv, "blue")}
        ${chip(SCENARIO.bauist.extraQuantity, "flag")}
        ${chip(SCENARIO.pricing.total, "ok")}
      </div>
      <p class="mono" style="color:#dff1ff;margin:16px 0 0">
        Pfeiltasten ← → oder klicken
      </p>
    </div>
  </div>`;
}

function phone(content) {
  return `<div class="frame-phone"><div class="phone-glass"><div class="phone-status"><span>09:14</span><span>5G ▰▰▰ 84%</span></div><div class="phone-content">${content}</div></div></div>`;
}

function siteHome() {
  return phone(
    html`<div class="phone-head">
        <div>
          <div class="kicker">${SCENARIO.project}</div>
          <h2 class="phone-title">Ereignisse Baustelle</h2>
        </div>
        ${chip("Polier", "blue")}
      </div>
      <button
        class="btn"
        style="width:100%;height:78px;font-size:18px;display:flex;align-items:center;justify-content:center;gap:10px"
        type="button"
        data-next
      >
        <span>🎙️</span> Abweichung melden
      </button>
      <h3 style="margin-top:22px">Heute</h3>
      <div class="event-list">
        ${SCENARIO.siteEvents
          .map(
            (e) =>
              `<div class="event-row"><div class="event-icon">${e[0]}</div><div><strong>${e[1]}</strong><br><span class="mono" style="color:var(--muted)">${SCENARIO.workPackage}</span></div>${chip(e[2], e[2] === "Neu" ? "flag" : "")}</div>`,
          )
          .join("")}
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
        
        <div class="waveform">
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
        </div>

        <div class="mic-container">
          <div class="mic-pulse-ring"></div>
          <button class="mic-btn" type="button" data-next aria-label="Stop recording">⏹️</button>
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

  const locationHtml = `
    <div style="font-size: 11px; text-align: left; line-height: 1.4;">
      <div><strong>Bauteil:</strong> ${sum.location.bauteil}</div>
      <div><strong>Geschoss:</strong> ${sum.location.geschoss}</div>
      <div><strong>Achse:</strong> ${sum.location.achse}</div>
    </div>
  `;

  const spiegelHtml = `
    <div class="soll-ist-compare">
      <div class="compare-row soll">
        <span class="compare-label">Soll</span>
        <span class="compare-val">${sum.spiegel.soll}</span>
      </div>
      <div class="compare-row ist">
        <span class="compare-label">Ist</span>
        <span class="compare-val">${sum.spiegel.ist}</span>
      </div>
    </div>
  `;

  let causeLabel = sum.ursache;
  let causeType = "flag";
  if (sum.ursache === "ag_instruction") {
    causeLabel = "Anordnung durch AG / Architekt";
    causeType = "blue";
  } else if (sum.ursache === "changed_conditions") {
    causeLabel = "Geänderte Gegebenheiten vor Ort";
    causeType = "flag";
  } else if (sum.ursache === "plan_contradiction") {
    causeLabel = "Widerspruch in Planungsunterlagen";
    causeType = "flag";
  } else if (sum.ursache === "other") {
    causeLabel = "Sonstiges";
    causeType = "";
  }
  const causeHtml = chip(causeLabel, causeType);

  let termLabel = "";
  let termType = "ok";
  if (sum.terminauswirkung.status === "delay") {
    termLabel = `${sum.terminauswirkung.duration} Verzögerung erwartet`;
    termType = "flag";
  } else {
    termLabel = "Keine Verzögerung";
    termType = "ok";
  }
  const termHtml = chip(termLabel, termType);

  const rows = [
    { label: "Was", val: sum.what },
    { label: "Verortung", val: locationHtml },
    { label: "Soll-Ist-Abgleich", val: spiegelHtml },
    { label: "Ursache", val: causeHtml },
    { label: "Anordnung", val: sum.instruction },
    { label: "Termin", val: termHtml }
  ];

  const summaryRows = rows.map(row => `
    <div class="summary-row">
      <div class="summary-label">${row.label}</div>
      <div class="summary-val">${row.val}</div>
    </div>
  `).join('');

  const actionItems = SCENARIO.smartActions.map(action => {
    if (action.auto) {
      return `<div class="action-item is-auto">
        <div class="action-item-left">
          <span class="action-item-icon">${action.icon}</span>
          <span>${action.task}</span>
        </div>
        <div class="action-badge auto">${action.source}</div>
        <span class="action-status-icon">✓</span>
      </div>`;
    } else {
      const isPhoto = action.id === "action-photo";
      if (isPhoto) {
        return `<div class="action-item is-open" data-next style="cursor:pointer">
          <div class="action-item-left">
            <span class="action-item-icon">${action.icon}</span>
            <strong>${action.task}</strong>
          </div>
          <span class="action-status-icon">▢</span>
        </div>`;
      } else {
        return `<div class="action-item is-open">
          <div class="action-item-left">
            <span class="action-item-icon">${action.icon}</span>
            <strong>${action.task}</strong>
          </div>
          <span class="action-status-icon">▢</span>
        </div>`;
      }
    }
  }).join('');

  return phone(
    html`<div class="ai-container">
      <div class="ai-header">
        <div class="kicker">Geführte Strukturierung</div>
        <span class="ai-badge">✨ Strukturierter Entwurf</span>
      </div>
      
      <div class="ai-summary-card">
        <div class="summary-title">
          <h3>Mögliche Abweichung</h3>
          ${chip(SCENARIO.bausoll.lv, "blue")}
        </div>
        <div class="summary-grid">
          ${summaryRows}
        </div>
      </div>

      <div class="smart-actions-section">
        <div class="smart-actions-title">Erforderliche Nachweise</div>
        <div class="checklist">
          ${actionItems}
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

// <!-- ============ SILO 2: KAUFMÄNNISCH (screens 5–8) ============ -->
function browser(content, url = "app.nachweis.bau/nachtraege", laptop = false) {
  return `<div class="${laptop ? "frame-laptop" : "frame-browser"}"><div class="browser-chrome"><div class="dots"><span></span><span></span><span></span></div><div class="url">${url}</div><div class="mono" style="text-align:right;color:rgba(243,245,247,.58)">${SCENARIO.product.name}</div></div><div class="browser-body">${content}</div></div>`;
}

function commercialDashboard() {
  return browser(
    html`<div class="dashboard-grid">
      <div class="panel">
        <div class="kicker">Nachtrag-Dashboard</div>
        <h2>Offene Nachträge</h2>
        <div class="kpis">
          <div class="mini-panel kpi">
            <span class="mono">offen</span><strong>7</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">Volumen</span><strong>142k€</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">Fristen</span
            ><strong style="color:var(--flag)">3</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Status</th>
              <th>Frist</th>
              <th>Wert</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>N‑201</td>
              <td>Mehrstahl Decke C</td>
              <td>${chip("Prüfung", "blue")}</td>
              <td>8 Tage</td>
              <td>11.900 €</td>
            </tr>
            <tr class="highlight" tabindex="0" data-next>
              <td>${SCENARIO.claimId}</td>
              <td><strong>${SCENARIO.title}</strong></td>
              <td>${chip("Neu", "flag")}</td>
              <td>${chip("4 Tage", "flag")}</td>
              <td>${SCENARIO.pricing.total}</td>
            </tr>
            <tr>
              <td>N‑205</td>
              <td>Provisorische Entwässerung</td>
              <td>${chip("Entwurf")}</td>
              <td>12 Tage</td>
              <td>6.400 €</td>
            </tr>
          </tbody>
        </table>
      </div>
      <aside class="panel">
        <div class="kicker">Eingang von Baustelle</div>
        <h3>${SCENARIO.eventId}</h3>
        <p>${SCENARIO.note}</p>
        ${chip(SCENARIO.metadata[1], "blue")}
        ${chip(SCENARIO.bauist.depth, "flag")}<br /><br />${button(
          "N‑204 öffnen",
        )}
      </aside>
    </div>`,
  );
}

function deviationHero() {
  return browser(
    html`<div class="panel">
      <div class="kicker">Abweichung klar machen</div>
      <h2>Bausoll ↔ Bau-Ist</h2>
      <div class="spine">
        ${SCENARIO.spine.map((s) => `<span>${s}</span>`).join("")}
      </div>
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
          <h3>Nachweise · ${SCENARIO.eventId}</h3>
          <div class="metadata-grid">
            ${chip("Foto Felskante", "ok")} ${chip("GPS", "ok")}
            ${chip("Anordnung", "ok")} ${chip("Tiefenmaß?", "flag")}
          </div>
          <h3>Risk Check</h3>
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

function missingProofPricing() {
  const resolved = state.proofsResolved;
  return browser(
    html`<div class="resolve-layout">
      <div class="panel">
        <div class="kicker">Fehlende Nachweise zeigen</div>
        <h2>Nachweise vervollständigen</h2>
        <div class="checklist">
          ${SCENARIO.proofActions
            .map(
              (a) =>
                `<div class="check ${resolved ? "" : "open"}"><span>${a}</span><b>${resolved ? "✓" : "▢"}</b></div>`,
            )
            .join("")}
        </div>
        <p class="mono" style="margin:16px 0 5px">
          Vollständigkeit ${resolved ? "95" : "68"} %
        </p>
        <div class="meter" style="--value:${resolved ? "95" : "68"}%">
          <span></span>
        </div>
        <br /><button
          class="btn ${resolved ? "ok" : ""}"
          type="button"
          data-resolve-proofs
        >
          ${resolved ? "Nachweise vollständig" : "Fehlende Nachweise ergänzen"}
        </button>
      </div>
      <div class="panel">
        <div class="kicker">Preis belastbar machen</div>
        <h2>Urkalkulation-Fortschreibung</h2>
        <div class="pricing-grid">
          <div class="mini-panel">
            <span class="mono">Neue Position</span>
            <h3>${SCENARIO.pricing.newPosition}</h3>
          </div>
          <div class="mini-panel">
            <span class="mono">Menge</span>
            <h3>${SCENARIO.pricing.quantity}</h3>
          </div>
          <div class="mini-panel">
            <span class="mono">abgeleiteter EP</span>
            <h3>${SCENARIO.pricing.derivedEp}</h3>
          </div>
        </div>
        <p>
          ${SCENARIO.pricing.basis}: ${SCENARIO.pricing.devices}. Damit ist der
          Nachtrag nicht nur dem Grunde nach plausibel, sondern
          <strong>${SCENARIO.pricing.argument}</strong>.
        </p>
        <div class="sum">Nachtragssumme ≈ ${SCENARIO.pricing.total}</div>
        <br />${button(
          "Zur rechtlichen Prüfung übergeben",
          resolved ? "data-next" : "data-resolve-proofs",
        )}
      </div>
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
            <strong>Letzter 5%-Schritt:</strong> ${SCENARIO.finalGap}
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
        ><br /><br />${button("Weiter", "data-next")}
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

function recapScreen() {
  return html`<div class="title-card">
    <div>
      <div class="kicker" style="color:#82c7ff">Abschluss</div>
      <h1 style="font-size:clamp(42px,6vw,78px)">Ein lückenloser Nachweis.</h1>
      <p>
        Drei Rollen, drei Geräte, ein verbundener Nachtrag — von der Felskante
        bis zur belastbaren Nachtragsakte.
      </p>
      <div class="spine">
        ${SCENARIO.spine.map((s) => `<span>${s}</span>`).join("")}
      </div>
      <button class="btn" type="button" data-restart>Neu starten</button>
    </div>
    <div class="blueprint-card">
      <div class="timeline">
        <div class="mini-panel">
          <div class="kicker">Baustelle · 09:14</div>
          <h3>${SCENARIO.eventId}</h3>
          <p>Felskante mit Foto, GPS, Tiefe und Anordnung erfasst.</p>
        </div>
        <div class="mini-panel">
          <div class="kicker">Kaufmännisch</div>
          <h3>${SCENARIO.claimId}</h3>
          <p>
            Bausoll/Bau-Ist, fehlende Nachweise und ${SCENARIO.pricing.basis}
            geklärt.
          </p>
        </div>
        <div class="mini-panel">
          <div class="kicker">Recht</div>
          <h3>Freigegeben</h3>
          <p>
            Prüffähige Akte mit Begründung, Nachweisen und Kalkulation
            exportbereit.
          </p>
        </div>
      </div>
    </div>
  </div>`;
}

// <!-- ============ NAV / TRANSITIONS (JS) ============ -->
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
