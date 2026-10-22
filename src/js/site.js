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
