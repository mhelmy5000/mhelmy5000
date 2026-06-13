/* EA Strategy Builder — client-side state, persisted to localStorage. */
(function () {
  "use strict";

  const STORAGE_KEY = "ea-strategy-builder/v1";

  const defaultState = () => ({
    profile: { orgName: "", vision: "", horizon: "3" },
    drivers: [],
    capabilities: [],
    initiatives: [],
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      console.warn("Could not load saved state, starting fresh.", e);
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist state.", e);
    }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const IMPACT_LABEL = { 5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Minimal" };
  const VALUE_LABEL = { 5: "Very high", 4: "High", 3: "Medium", 2: "Low", 1: "Minimal" };
  const EFFORT_LABEL = { 1: "XS", 2: "S", 3: "M", 4: "L", 5: "XL" };

  /* ---------- Tabs ---------- */
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("is-active"));
      $$(".panel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      $(`.panel[data-panel="${tab.dataset.tab}"]`).classList.add("is-active");
      if (tab.dataset.tab === "roadmap") renderRoadmap();
    });
  });

  /* ---------- Profile ---------- */
  function bindProfile() {
    $("#orgName").value = state.profile.orgName;
    $("#vision").value = state.profile.vision;
    $("#horizon").value = state.profile.horizon;
    $("#orgName").addEventListener("input", (e) => { state.profile.orgName = e.target.value; save(); });
    $("#vision").addEventListener("input", (e) => { state.profile.vision = e.target.value; save(); });
    $("#horizon").addEventListener("change", (e) => { state.profile.horizon = e.target.value; save(); });
  }

  /* ---------- Drivers ---------- */
  $("#driverForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    state.drivers.push({
      id: uid(),
      title: f.title.value.trim(),
      category: f.category.value,
      impact: Number(f.impact.value),
    });
    f.reset();
    save();
    renderDrivers();
    renderOverview();
  });

  function renderDrivers() {
    const list = $("#driverList");
    if (!state.drivers.length) {
      list.innerHTML = '<li class="empty">No drivers yet — add the forces shaping your architecture.</li>';
      return;
    }
    const sorted = [...state.drivers].sort((a, b) => b.impact - a.impact);
    list.innerHTML = sorted
      .map((d) => {
        const cls = d.impact >= 5 ? "crit" : d.impact >= 4 ? "warn" : "accent";
        return `<li class="item" data-id="${d.id}">
          <div class="item-main">
            <div class="item-title">${esc(d.title)}</div>
            <div class="item-meta">
              <span class="tag">${esc(d.category)}</span>
              <span class="tag ${cls}">Impact: ${IMPACT_LABEL[d.impact]}</span>
            </div>
          </div>
          <button class="item-remove" data-remove="drivers" data-id="${d.id}" title="Remove">×</button>
        </li>`;
      })
      .join("");
  }

  /* ---------- Capabilities ---------- */
  $("#capForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    state.capabilities.push({
      id: uid(),
      title: f.title.value.trim(),
      domain: f.domain.value,
      current: Number(f.current.value),
      target: Number(f.target.value),
    });
    f.reset();
    save();
    renderCapabilities();
    renderOverview();
  });

  function renderCapabilities() {
    const list = $("#capList");
    if (!state.capabilities.length) {
      list.innerHTML = '<li class="empty">No capabilities yet — map and score what the business does.</li>';
      return;
    }
    const sorted = [...state.capabilities].sort(
      (a, b) => (b.target - b.current) - (a.target - a.current)
    );
    list.innerHTML = sorted
      .map((c) => {
        const gap = c.target - c.current;
        const cls = gap >= 3 ? "crit" : gap === 2 ? "warn" : gap === 1 ? "accent" : "good";
        const gapTxt = gap > 0 ? `+${gap}` : "✓";
        return `<li class="item" data-id="${c.id}">
          <div class="gap-pill ${cls}" title="Maturity gap">${gapTxt}</div>
          <div class="item-main">
            <div class="item-title">${esc(c.title)}</div>
            <div class="item-meta">
              <span class="tag">${esc(c.domain)}</span>
              <span class="tag">Now ${c.current} → Target ${c.target}</span>
            </div>
          </div>
          <button class="item-remove" data-remove="capabilities" data-id="${c.id}" title="Remove">×</button>
        </li>`;
      })
      .join("");
  }

  /* ---------- Initiatives ---------- */
  $("#initForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    state.initiatives.push({
      id: uid(),
      title: f.title.value.trim(),
      value: Number(f.value.value),
      effort: Number(f.effort.value),
      phase: f.phase.value,
    });
    f.reset();
    save();
    renderInitiatives();
    renderOverview();
  });

  const priority = (i) => i.value / i.effort;

  function renderInitiatives() {
    const list = $("#initList");
    if (!state.initiatives.length) {
      list.innerHTML = '<li class="empty">No initiatives yet — define the work that closes capability gaps.</li>';
      return;
    }
    const sorted = [...state.initiatives].sort((a, b) => priority(b) - priority(a));
    list.innerHTML = sorted
      .map((i) => {
        const p = priority(i);
        const cls = p >= 1.5 ? "good" : p >= 1 ? "accent" : "warn";
        return `<li class="item" data-id="${i.id}">
          <div class="gap-pill ${cls}" title="Priority (value ÷ effort)">${p.toFixed(1)}</div>
          <div class="item-main">
            <div class="item-title">${esc(i.title)}</div>
            <div class="item-meta">
              <span class="tag">${esc(i.phase)}</span>
              <span class="tag accent">Value: ${VALUE_LABEL[i.value]}</span>
              <span class="tag">Effort: ${EFFORT_LABEL[i.effort]}</span>
            </div>
          </div>
          <button class="item-remove" data-remove="initiatives" data-id="${i.id}" title="Remove">×</button>
        </li>`;
      })
      .join("");
  }

  /* ---------- Roadmap ---------- */
  function renderRoadmap() {
    const container = $("#roadmap");
    const phases = [
      { key: "Now", sub: "In flight / next 12 months" },
      { key: "Next", sub: "Following horizon" },
      { key: "Later", sub: "Backlog / future state" },
    ];
    container.innerHTML = phases
      .map((ph) => {
        const items = state.initiatives
          .filter((i) => i.phase === ph.key)
          .sort((a, b) => priority(b) - priority(a));
        const cards = items.length
          ? items
              .map(
                (i) => `<div class="lane-card">
                  <div class="lc-title">${esc(i.title)}</div>
                  <div class="lc-meta">Value ${VALUE_LABEL[i.value]} · Effort ${EFFORT_LABEL[i.effort]} · Priority ${priority(i).toFixed(1)}</div>
                </div>`
              )
              .join("")
          : '<div class="empty">No initiatives</div>';
        return `<div class="lane">
          <h3>${ph.key}</h3>
          <div class="lane-sub">${ph.sub}</div>
          ${cards}
        </div>`;
      })
      .join("");
  }

  /* ---------- Overview stats ---------- */
  function renderOverview() {
    $("#statDrivers").textContent = state.drivers.length;
    $("#statCaps").textContent = state.capabilities.length;
    $("#statInits").textContent = state.initiatives.length;

    const caps = state.capabilities;
    if (caps.length) {
      const avgGap = caps.reduce((s, c) => s + (c.target - c.current), 0) / caps.length;
      $("#statGap").textContent = avgGap.toFixed(1);
      const met = caps.filter((c) => c.current >= c.target).length;
      const pct = Math.round((met / caps.length) * 100);
      $("#healthFill").style.width = pct + "%";
      $("#healthLabel").textContent = `${met} of ${caps.length} capabilities at or above target (${pct}%).`;
    } else {
      $("#statGap").textContent = "—";
      $("#healthFill").style.width = "0%";
      $("#healthLabel").textContent = "Add capabilities to see target coverage.";
    }
  }

  /* ---------- Remove (event delegation) ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const { remove, id } = btn.dataset;
    state[remove] = state[remove].filter((x) => x.id !== id);
    save();
    renderAll();
  });

  /* ---------- Export / Import ---------- */
  function download(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  $("#exportJson").addEventListener("click", () => {
    download("ea-strategy.json", JSON.stringify(state, null, 2), "application/json");
  });

  $("#exportMd").addEventListener("click", () => {
    download("ea-strategy.md", buildReport(), "text/markdown");
  });

  $("#importJson").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        state = Object.assign(defaultState(), parsed);
        save();
        bindProfile();
        renderAll();
        alert("Strategy imported.");
      } catch (err) {
        alert("That file could not be read as a valid strategy export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("#resetAll").addEventListener("click", () => {
    if (!confirm("Clear the entire strategy? This cannot be undone.")) return;
    state = defaultState();
    save();
    bindProfile();
    renderAll();
  });

  function buildReport() {
    const p = state.profile;
    const lines = [];
    lines.push(`# Enterprise Architecture Strategy — ${p.orgName || "Untitled"}`);
    lines.push("");
    if (p.vision) lines.push(`> ${p.vision}`, "");
    lines.push(`**Planning horizon:** ${p.horizon} year(s)`, "");

    lines.push("## Drivers");
    if (state.drivers.length) {
      [...state.drivers]
        .sort((a, b) => b.impact - a.impact)
        .forEach((d) => lines.push(`- **${d.title}** — ${d.category}, impact: ${IMPACT_LABEL[d.impact]}`));
    } else lines.push("_None captured._");
    lines.push("");

    lines.push("## Capability Maturity");
    if (state.capabilities.length) {
      lines.push("| Capability | Domain | Now | Target | Gap |");
      lines.push("|---|---|:--:|:--:|:--:|");
      [...state.capabilities]
        .sort((a, b) => (b.target - b.current) - (a.target - a.current))
        .forEach((c) =>
          lines.push(`| ${c.title} | ${c.domain} | ${c.current} | ${c.target} | ${c.target - c.current} |`)
        );
    } else lines.push("_None captured._");
    lines.push("");

    lines.push("## Roadmap");
    ["Now", "Next", "Later"].forEach((phase) => {
      const items = state.initiatives
        .filter((i) => i.phase === phase)
        .sort((a, b) => priority(b) - priority(a));
      lines.push(`### ${phase}`);
      if (items.length) {
        items.forEach((i) =>
          lines.push(
            `- **${i.title}** — value: ${VALUE_LABEL[i.value]}, effort: ${EFFORT_LABEL[i.effort]}, priority: ${priority(i).toFixed(1)}`
          )
        );
      } else lines.push("_No initiatives._");
      lines.push("");
    });

    lines.push(`_Generated ${new Date().toISOString().slice(0, 10)} with EA Strategy Builder._`);
    return lines.join("\n");
  }

  /* ---------- Init ---------- */
  function renderAll() {
    renderDrivers();
    renderCapabilities();
    renderInitiatives();
    renderRoadmap();
    renderOverview();
  }

  bindProfile();
  renderAll();
})();
