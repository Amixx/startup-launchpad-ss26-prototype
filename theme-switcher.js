// Standalone brand-palette switcher. Self-contained: no dependency on app.js.
(function () {
  var THEMES = [
    { id: "", name: "Blueprint", swatch: "#1f6feb", note: "Signal blue on cool slate — trustworthy, but generic SaaS." },
    { id: "baustelle", name: "Baustelle", swatch: "#d9541c", note: "Construction orange — sector-native, energetic, differentiated." },
    { id: "aktenzeichen", name: "Aktenzeichen", swatch: "#9a6b1f", note: "Ink + brass — legal authority, premium, evidence." },
    { id: "vermessung", name: "Vermessung", swatch: "#0c7c8c", note: "Surveyor teal — calm, technical alternative to blue." },
  ];
  var KEY = "nubo-theme";

  function apply(id) {
    if (id) document.documentElement.setAttribute("data-theme", id);
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  var saved = "";
  try { saved = localStorage.getItem(KEY) || ""; } catch (e) {}
  apply(saved);

  // The picker is a demo affordance — only show it when ?brand is in the URL.
  // A palette chosen once still persists via localStorage without the param.
  var gated = false;
  try { gated = new URLSearchParams(location.search).has("brand"); } catch (e) {}
  if (!gated) return;

  function build() {
    var wrap = document.createElement("div");
    wrap.style.cssText =
      "position:fixed;right:14px;bottom:14px;z-index:9999;font-family:var(--mono);" +
      "background:#fff;border:1px solid rgba(14,26,36,.14);border-radius:6px;" +
      "box-shadow:0 10px 30px rgba(15,23,42,.16);padding:8px;min-width:150px";

    var label = document.createElement("div");
    label.textContent = "BRAND PALETTE";
    label.style.cssText =
      "font-size:10px;letter-spacing:.08em;color:var(--muted);margin:2px 4px 6px;text-transform:uppercase";
    wrap.appendChild(label);

    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.title = t.note;
      b.style.cssText =
        "display:flex;align-items:center;gap:8px;width:100%;border:none;background:none;" +
        "padding:6px 4px;border-radius:4px;cursor:pointer;font:inherit;font-size:12px;color:var(--ink);text-align:left";
      var dot = document.createElement("span");
      dot.style.cssText =
        "width:14px;height:14px;border-radius:50%;flex:0 0 auto;background:" +
        t.swatch + ";box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)";
      var name = document.createElement("span");
      name.textContent = t.name;
      b.appendChild(dot);
      b.appendChild(name);
      b.addEventListener("mouseenter", function () { b.style.background = "rgba(14,26,36,.05)"; });
      b.addEventListener("mouseleave", function () { mark(); });
      b.addEventListener("click", function () { apply(t.id); mark(); });
      b.dataset.themeId = t.id;
      wrap.appendChild(b);
    });

    function mark() {
      var cur = document.documentElement.getAttribute("data-theme") || "";
      wrap.querySelectorAll("button").forEach(function (btn) {
        var active = btn.dataset.themeId === cur;
        btn.style.fontWeight = active ? "700" : "400";
        btn.style.background = active ? "rgba(14,26,36,.06)" : "none";
      });
    }

    document.body.appendChild(wrap);
    mark();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", build);
  else build();
})();
