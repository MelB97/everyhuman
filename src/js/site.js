// Mobile menu
(function () {
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
    document.body.classList.toggle("menu-open", !open);
  });
})();

// Contact form: show the right tip for each choice, send accounts enquiries to the
// accounts inbox, and stop clothing-order messages before they're sent.
(function () {
  var form = document.querySelector("[data-enquiry]");
  if (!form) return;
  var about = form.querySelector("select[name=about]");
  var formName = form.querySelector("input[name=form-name]");
  var fields = form.querySelector("[data-fields]");
  var tips = form.querySelectorAll("[data-show]");
  function update() {
    var v = about.value;
    tips.forEach(function (t) { t.hidden = t.getAttribute("data-show") !== v; });
    formName.value = v === "accounts" ? "accounts" : "enquiry";
    var stop = v === "clothing";
    fields.hidden = stop;
    fields.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = stop; });
  }
  about.addEventListener("change", update);
  update();
})();

// Staff request form: only show the questions that matter for the chosen request
(function () {
  var form = document.querySelector("[data-team-form]");
  if (!form) return;
  var parts = {};
  form.querySelectorAll("[data-part]").forEach(function (el) { parts[el.getAttribute("data-part")] = el; });
  var show = {
    "Add a new team member": ["person", "details", "consent", "notes", "submit"],
    "Remove a team member": ["person", "leaving", "notes", "submit"],
    "Update a team member": ["person", "details", "consent", "notes", "submit"],
    "Other website change": ["other", "notes", "submit"]
  };
  var need = {
    "Add a new team member": ["person_name", "job_title", "person_location", "consent"],
    "Remove a team member": ["person_name"],
    "Update a team member": ["person_name"],
    "Other website change": ["page", "notes"]
  };
  function update() {
    var picked = form.querySelector("input[name=request]:checked");
    var v = picked ? picked.value : "";
    Object.keys(parts).forEach(function (k) { parts[k].hidden = (show[v] || []).indexOf(k) === -1; });
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.name === "request" || el.name === "requested_by" || el.name === "bot-field" || el.type === "hidden") return;
      el.required = (need[v] || []).indexOf(el.name) !== -1;
    });
    var opt = form.querySelector("[data-notes-opt]");
    if (opt) opt.hidden = v === "Other website change";
  }
  form.querySelectorAll("input[name=request]").forEach(function (r) { r.addEventListener("change", update); });
  update();
})();

// Staff induction: one section at a time, every answer must be right before moving on.
(function () {
  var root = document.querySelector("[data-induction]");
  if (!root) return;
  var data;
  try {
    var raw = JSON.parse(document.getElementById("induction-data").textContent);
    data = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch (e) { return; }
  var KEY = "eh-induction";
  var total = Number(root.dataset.total);
  var steps = root.querySelectorAll("[data-step]");
  var bar = root.querySelector("[data-bar]");
  var count = root.querySelector("[data-count]");
  var state = { step: "start", done: {}, wrong: 0, started: "" };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) state = saved; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // Shuffle so the right answer isn't always in the same spot
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  root.querySelectorAll("[data-q]").forEach(function (fs) {
    var id = fs.dataset.q, parts = id.split("-"), q = data[+parts[0]][+parts[1]];
    var multi = q.c.length > 1, box = fs.querySelector("[data-opts]"), fb = fs.querySelector("[data-fb]");
    var order = shuffle(q.o.map(function (_, i) { return i; }));
    order.forEach(function (i, k) {
      var lab = document.createElement("label"); lab.className = "ind-opt";
      var inp = document.createElement("input"); inp.type = multi ? "checkbox" : "radio"; inp.name = "q" + id; inp.value = i;
      lab.appendChild(inp); var sp = document.createElement("span"); sp.textContent = q.o[i]; lab.appendChild(sp); box.appendChild(lab);
    });
    function lock(ok) {
      fs.classList.toggle("is-right", ok);
      if (ok) {
        fs.querySelectorAll("input").forEach(function (inp) { inp.disabled = true; if (q.c.indexOf(+inp.value) > -1) { inp.checked = true; inp.parentNode.classList.add("is-correct"); } });
        var btn = fs.querySelector("[data-check]"); if (btn) btn.hidden = true;
        fb.className = "ind-fb ok"; fb.textContent = "Correct, well done.";
      }
    }
    function mark() {
      var picked = Array.prototype.map.call(fs.querySelectorAll("input:checked"), function (x) { return +x.value; }).sort();
      var right = q.c.slice().sort();
      var ok = picked.length === right.length && picked.every(function (v, i) { return v === right[i]; });
      fs.querySelectorAll(".ind-opt").forEach(function (l) { l.classList.remove("is-wrong"); });
      if (ok) { state.done[id] = true; lock(true); }
      else {
        state.wrong++;
        fs.querySelectorAll("input:checked").forEach(function (x) { if (q.c.indexOf(+x.value) < 0) x.parentNode.classList.add("is-wrong"); });
        fb.className = "ind-fb no";
        fb.textContent = multi ? "Not quite. Make sure you've chosen exactly " + q.c.length + " answers, then try again." : "Not quite. Review the section above and try again.";
      }
      save(); refresh();
    }
    if (multi) fs.querySelector("[data-check]").addEventListener("click", mark);
    else box.addEventListener("change", mark);
    if (state.done[id]) lock(true);
  });

  function sectionDone(i) {
    return data[i].every(function (_, k) { return state.done[i + "-" + k]; });
  }
  function refresh() {
    steps.forEach(function (st) {
      var n = st.querySelector("[data-next]"); if (!n) return;
      var i = +st.dataset.step, ok = sectionDone(i);
      n.disabled = !ok; var h = st.querySelector("[data-hint]"); if (h) h.hidden = ok;
    });
  }
  function show(step, focus) {
    state.step = step; save();
    steps.forEach(function (st) { st.hidden = st.dataset.step !== String(step); });
    var n = step === "start" ? 0 : step === "finish" ? total : +step;
    bar.style.width = Math.round((n / total) * 100) + "%";
    count.textContent = step === "start" ? "" : step === "finish" ? "All " + total + " sections complete" : "Section " + (n + 1) + " of " + total;
    if (focus) { var cur = root.querySelector('[data-step="' + step + '"]'); var h = cur && cur.querySelector("h2"); window.scrollTo({ top: root.querySelector("[data-bar]").getBoundingClientRect().top + window.scrollY - 100 }); if (h) h.focus({ preventScroll: true }); }
  }
  root.querySelector("[data-start]").addEventListener("click", function () {
    if (!state.started) state.started = new Date().toISOString();
    show(0, true);
  });
  root.querySelectorAll("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = +b.closest("[data-step]").dataset.step;
      if (!sectionDone(i)) return;
      show(i + 1 < total ? i + 1 : "finish", true);
    });
  });
  root.querySelectorAll("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = b.closest("[data-step]").dataset.step;
      show(s === "finish" ? total - 1 : +s > 0 ? +s - 1 : "start", true);
    });
  });
  var form = root.querySelector("[data-ind-form]");
  form.addEventListener("submit", function (e) {
    for (var i = 0; i < total; i++) if (!sectionDone(i)) { e.preventDefault(); show(i, true); return; }
    var fmt = function (d) { return d ? new Date(d).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" }) + " (AEST)" : ""; };
    form.querySelector('[data-f="started"]').value = fmt(state.started);
    form.querySelector('[data-f="completed"]').value = fmt(new Date().toISOString());
    form.querySelector('[data-f="sections"]').value = total + " of " + total;
    form.querySelector('[data-f="questions"]').value = Object.keys(state.done).length + " correct";
    form.querySelector('[data-f="wrong"]').value = String(state.wrong);
  });
  refresh();
  var resume = state.step;
  if (resume === "finish") { for (var i = 0; i < total; i++) if (!sectionDone(i)) { resume = i; break; } }
  show(resume, false);
})();

// Our Team: filter the support team by location
(function () {
  var bar = document.querySelector("[data-team-filter]");
  if (!bar) return;
  var list = bar.parentNode.querySelector(".team");
  var status = bar.parentNode.querySelector("[data-filter-status]");
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-filter]");
    if (!b) return;
    var f = b.dataset.filter, shown = 0;
    bar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    list.querySelectorAll(".person").forEach(function (p) {
      var on = f === "all" || p.dataset.group === f;
      p.hidden = !on; if (on) shown++;
    });
    if (status) status.textContent = "Showing " + shown + " team members";
  });
})();
