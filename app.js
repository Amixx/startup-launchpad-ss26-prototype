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
  selectedPricingRowId: "C03",
};

const screens = [
  { id: "s1", silo: "site", number: "01", render: planInbox },
  { id: "s2", silo: "site", number: "02", render: revisionCloudReview },
  { id: "s3", silo: "site", number: "02b", render: aiProcessing },
  { id: "s4", silo: "site", number: "03", render: planClassification },
  { id: "s8b", silo: "commercial", number: "04", render: evidenceGraph },
  { id: "s8c", silo: "commercial", number: "05", render: pricingEvidenceMap },
  { id: "s13", silo: "legal", number: "06", render: signoffExport },
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
  state.selectedPricingRowId = "C03";
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

// Bausoll confidence climbs as the plan/document matrix and the change notice are completed:
// 68 % initial AI pre-check → +14 checked source docs → +13 cost/risk estimate → 95 %.
// Approval closes the final wording risk downstream.
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

// <!-- ============ SHARED DESKTOP FRAME ============ -->
function browser(content, url = "app.nubo.bau/nachtraege", laptop = false) {
  return `<div class="${laptop ? "frame-laptop" : "frame-browser"}"><div class="browser-chrome"><div class="dots"><span></span><span></span><span></span></div><div class="url">${url}</div><div class="mono" style="text-align:right;color:rgba(14,26,36,.48)">${SCENARIO.product.name}</div></div><div class="browser-body">${content}</div></div>`;
}

function planInbox() {
  return browser(
    html`<div class="dashboard-grid">
      <div class="panel">
        <div class="kicker">Planprüfung · ${SCENARIO.project}</div>
        <h2>Neue Planrevision mit Nachtragspotenzial</h2>
        <p>${SCENARIO.note}</p>
        <div class="kpis">
          <div class="mini-panel kpi">
            <span class="mono">Revisionspaket</span><strong>${SCENARIO.eventId}</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">Unterlagen</span><strong>6</strong>
          </div>
          <div class="mini-panel kpi">
            <span class="mono">Start Ausführung</span><strong style="color:var(--flag)">9T</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Planstand</th>
              <th>Status</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Grundriss A‑203</td>
              <td>Rev. 08</td>
              <td>${chip("Revisionswolke", "flag")}</td>
              <td>Achse B4 markiert</td>
            </tr>
            <tr class="highlight" tabindex="0" data-next>
              <td>Brandschutzbericht</td>
              <td>Rev. 08</td>
              <td>${chip("Konflikt", "flag")}</td>
              <td>F90 statt F0</td>
            </tr>
            <tr>
              <td>Bauphysikkatalog</td>
              <td>Rev. 03</td>
              <td>${chip("ungeprüft")}</td>
              <td>Raumabschluss offen</td>
            </tr>
          </tbody>
        </table>
      </div>
      <aside class="panel">
        <div class="kicker">Workflow-Hinweis</div>
        <h3>Planänderung vor Baustelle</h3>
        <p>
          Viele SF-Bau-Nachträge entstehen nicht erst auf der Baustelle, sondern
          wenn neue Pläne und Berichte eintreffen und gegen das Bausoll geprüft
          werden müssen.
        </p>
        ${chip("Bausoll ist der Maßstab", "blue")}
        ${chip("Komplettheitsklausel", "flag")}<br /><br />${button(
          "Revisionswolke prüfen",
        )}
      </aside>
    </div>`,
    "app.nubo.bau/planpruefung",
  );
}

function revisionCloudReview() {
  return browser(
    html`<div class="panel">
      <div class="kicker">Revisionsvergleich · ${SCENARIO.eventId}</div>
      <h2>Was hat sich gegenüber dem Vertragsstand geändert?</h2>
      <div class="plan-review-grid">
        <div class="plan-sheet">
          <div class="revision-cloud cloud-a">F0</div>
          <div class="wall-line"></div>
          <div class="plan-label">A‑203 Rev. 03 · Vertragsbasis</div>
        </div>
        <div class="vs"><span>↔</span></div>
        <div class="plan-sheet is-new">
          <div class="revision-cloud cloud-b">F90</div>
          <div class="wall-line is-flagged"></div>
          <div class="plan-label">BSK Rev. 08 · neue Anforderung</div>
        </div>
        <aside class="mini-panel">
          <h3>Automatisch erkannt</h3>
          <div class="checklist">
            <div class="check"><span>Revisionswolke Achse B4</span><b>✓</b></div>
            <div class="check"><span>F0 ↔ F90 Widerspruch</span><b>✓</b></div>
            <div class="check open"><span>Bauphysik-Gegencheck fehlt</span><b>!</b></div>
          </div>
        </aside>
      </div>
      <br />${button("Bausoll-Abgleich starten")}
    </div>`,
    "app.nubo.bau/planpruefung",
  );
}

function aiProcessing() {
  return browser(
    html`<div class="panel processing-panel">
      <div class="spinner-ring"></div>
      <div>
        <div class="kicker">Planpaket wird strukturiert…</div>
        <h2>Revision, Berichte und Bausoll werden abgeglichen</h2>
        <p>Nubo ordnet die Änderung automatisch den Vertragsunterlagen zu.</p>
      </div>
    </div>`,
    "app.nubo.bau/planpruefung",
  );
}

function planClassification() {
  const sum = SCENARIO.aiSummary;
  const termChip = chip(`${sum.terminauswirkung.duration}`, "flag");
  const manualItems = SCENARIO.smartActions
    .filter((a) => !a.auto)
    .map(
      (action) => `<div class="check open">
        <span>${action.icon} ${action.task}</span><b>offen</b>
      </div>`,
    )
    .join("");
  const autoItems = SCENARIO.smartActions
    .filter((a) => a.auto)
    .map(
      (action) => `<div class="check">
        <span>${action.icon} ${action.task}</span><b>✓</b>
      </div>`,
    )
    .join("");

  return browser(
    html`<div class="panel">
      <div class="kicker">KI-Vorprüfung</div>
      <h2>Mögliche geänderte Leistung erkannt</h2>
      <div class="resolve-layout">
        <div class="mini-panel">
          <h3>${sum.what}</h3>
          <div class="metadata-grid">
            ${chip(sum.location.bauteil, "blue")} ${chip(sum.location.geschoss, "blue")}
            ${termChip}
          </div>
          <div class="soll-ist-compare">
            <div class="compare-row soll"><span class="compare-label">Bausoll</span><span class="compare-val">${sum.spiegel.soll}</span></div>
            <div class="compare-row ist"><span class="compare-label">Neue Revision</span><span class="compare-val">${sum.spiegel.ist}</span></div>
          </div>
          <p style="margin-top:14px">${sum.instruction}</p>
        </div>
        <div>
          <h3>Prüfaufgaben</h3>
          <div class="checklist">
            ${autoItems}
            ${manualItems}
          </div>
        </div>
      </div>
      <br />${button("An Projektteam übergeben")}
    </div>`,
    "app.nubo.bau/planpruefung",
  );
}

// <!-- ============ SILO 2: ÄNDERUNGSMITTEILUNG ============ -->

function evidenceGraph() {
  const cards = SCENARIO.demoWorkflow.evidenceCards;
  const resolved = state.groundResolved;
  const pct = claimCompleteness();

  function renderCard(c) {
    const open = c.id === "D04" && !resolved;
    return `<div class="mini-panel ${open ? "is-open-doc" : ""}">
      <div class="metadata-grid" style="margin-bottom:6px">
        ${chip(c.id, "blue")} ${chip(c.type)}
      </div>
      <strong>${c.title}</strong>
      <p class="mono" style="color:var(--muted);font-size:12px;margin:4px 0 0">${c.role}</p>
      ${open
        ? `<p class="mono" style="color:var(--flag);font-size:11px;margin:6px 0 0">⚠ ${c.note}</p>`
        : `<p class="mono" style="color:var(--ok);font-size:11px;margin:6px 0 0">✓ geprüft</p>`}
    </div>`;
  }

  return browser(
    html`<div class="panel">
      <h2>Bausoll-Nachweis · ${SCENARIO.claimId}</h2>
      <p>Die Änderungsmitteilung wird nicht aus Baustellenfotos gebaut, sondern aus dem prüfbaren Abgleich aller relevanten Plan- und Vertragsunterlagen.</p>
      <div class="doc-matrix">
        ${cards.map(renderCard).join("")}
      </div>
      <p class="mono" style="margin:18px 0 5px">Bausoll-Prüfung ${pct} %</p>
      <div class="meter" style="--value:${pct}%"><span></span></div>
      <br /><button
        class="btn ${resolved ? "ok" : ""}"
        type="button"
        data-resolve-ground
      >
        ${resolved ? "Bauphysik geprüft" : "Bauphysik prüfen"}
      </button>
      ${button("Weiter →")}
    </div>`,
    "app.nubo.bau/aenderungsmitteilungen",
  );
}

function pricingEvidenceMap() {
  const rows = SCENARIO.demoWorkflow.pricingRows;
  const resolved = state.heightResolved;
  const pct = claimCompleteness();
  const isFixed = (r) => r.id === "C03" && resolved;

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

  const riskChip = selFixed
    ? chip("geklärt", "ok")
    : sel.risk === "red"
      ? chip("Komplettheitsrisiko", "flag")
      : `<span class="chip" style="background:rgba(255,200,60,.15);color:#ffc83c">offen</span>`;
  const detailBody = selFixed
    ? `<p style="margin:0;color:var(--ok);font-size:13px">✓ ${sel.missingProof}</p>`
    : `<p style="font-size:13px;margin:0 0 12px;color:var(--muted)">${sel.weakness}</p>
       <p style="margin:0;color:var(--ok);font-size:13px">→ ${sel.missingProof}</p>`;

  return browser(
    html`<div class="panel">
      <h2>Änderungsmitteilung vorbereiten · ${SCENARIO.claimId}</h2>
      <div class="resolve-layout">
        <div style="display:flex;flex-direction:column;gap:4px">
          ${costLines}
        </div>
        <div style="border-left:3px solid ${borderColor};padding-left:14px;align-self:flex-start">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px">
            <strong>${sel.id} · ${sel.description}</strong>
            ${riskChip}
          </div>
          <div style="margin-bottom:10px">${sel.evidence.map((e) => chip(e, "blue")).join(" ")}</div>
          ${detailBody}
        </div>
      </div>
      <p class="mono" style="margin:18px 0 5px">Entscheidungsvorlage ${pct} %</p>
      <div class="meter" style="--value:${pct}%"><span></span></div>
      <br /><button
        class="btn ${resolved ? "ok" : ""}"
        type="button"
        data-resolve-height
      >
        ${resolved ? "Risikoargument ergänzt" : "Komplettheitsargument ergänzen"}
      </button>
      <div class="sum" style="margin-top:14px">
        ${SCENARIO.pricing.basis} · ${SCENARIO.pricing.total}
      </div>
      <br />${button("Zur Freigabe übergeben")}
    </div>`,
    "app.nubo.bau/aenderungsmitteilungen",
  );
}

// <!-- ============ SILO 3: FREIGABE ============ -->
function signoffExport() {
  return browser(
    html`<div class="doc-preview">
      <aside class="panel">
        <div class="kicker">Status</div>
        <h2 style="color:var(--ok);font-size:24px;line-height:1.08;overflow-wrap:anywhere">Änderungsmitteilung freigegeben</h2>
        <p>Die Entscheidungsvorlage ist bereit für Export und AG-Abstimmung.</p>
        <div class="metadata-grid">
          ${chip(SCENARIO.claimId, "blue")}
          ${chip(SCENARIO.pricing.total, "ok")} ${chip("vor Ausführung", "ok")}
        </div>
        <button class="btn ok" type="button" data-export>
          Änderungsmitteilung exportieren (PDF)</button
        ><br /><br />${button("Neu starten", "data-restart")}
      </aside>
      <div class="document">
        <div class="kicker">Dokumentvorschau</div>
        <h3>Änderungsmitteilung · ${SCENARIO.claimId}</h3>
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
              <td>ca.-Kosten</td>
              <td><strong>${SCENARIO.pricing.total}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`,
    "app.nubo.bau/freigabe",
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
