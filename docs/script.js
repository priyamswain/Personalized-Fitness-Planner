const form = document.getElementById("form");
const results = document.getElementById("results");
const errorBox = document.getElementById("error");
const SVG_NS = "http://www.w3.org/2000/svg";

// Safe DOM builders: text is always inserted as text, never as HTML.
function build(node, attrs, kids) {
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.setAttribute("class", v);
    else node.setAttribute(k, v);
  }
  for (const kid of kids) if (kid !== null && kid !== undefined) node.append(kid);
  return node;
}
const el = (tag, attrs = {}, ...kids) => build(document.createElement(tag), attrs, kids);
const svg = (tag, attrs = {}, ...kids) => build(document.createElementNS(SVG_NS, tag), attrs, kids);

const LABELS = {
  male: "Male", female: "Female", veg: "vegetarian", nonveg: "non-vegetarian",
  beginner: "beginner", intermediate: "intermediate", advanced: "advanced",
  lose: "fat loss", maintain: "maintenance", gain: "muscle gain",
};

function card(title, subtitle, ...body) {
  return el("section", { class: "card" },
    el("div", { class: "card-head" }, el("h2", {}, title), subtitle ? el("p", {}, subtitle) : null),
    ...body);
}

function caloriesCard(p) {
  const m = p.macros;
  const parts = [
    ["Protein", m.protein_g * 4, "--green"],
    ["Carbs", m.carbs_g * 4, "--amber"],
    ["Fat", m.fat_g * 9, "--rose"],
  ];
  const total = parts.reduce((a, b) => a + b[1], 0);
  const R = 54, C = 2 * Math.PI * R;
  const ring = svg("svg", { viewBox: "0 0 140 140", class: "donut", role: "img",
    "aria-label": "Calories split into protein, carbs and fat" },
    svg("circle", { cx: 70, cy: 70, r: R, fill: "none", stroke: "#edf1f6", "stroke-width": 14 }));
  let offset = 0;
  for (const [, kcal, color] of parts) {
    const len = (kcal / total) * C;
    ring.append(svg("circle", {
      cx: 70, cy: 70, r: R, fill: "none", "stroke-width": 14, transform: "rotate(-90 70 70)",
      style: `stroke:var(${color})`, "stroke-dasharray": `${Math.max(len - 2, 0)} ${C - len + 2}`,
      "stroke-dashoffset": -offset,
    }));
    offset += len;
  }
  return el("section", { class: "card" },
    el("div", { class: "kpi-label" }, "Daily calories"),
    el("div", { class: "donut-wrap" }, ring,
      el("div", { class: "donut-center" }, el("b", {}, String(p.calories)), el("span", {}, "kcal / day"))),
    el("div", { class: "legend" }, ...parts.map(([name, , color]) =>
      el("span", {}, el("i", { class: "dot", style: `background:var(${color})` }), name))));
}

function waterCard(p) {
  const fill = el("div", { class: "tank-fill" });
  const pct = Math.min((p.water_litres / 5) * 100, 100);
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.height = pct + "%"; }));
  const glasses = Math.round(p.water_litres * 4);
  return el("section", { class: "card" },
    el("div", { class: "kpi-label" }, "Daily water"),
    el("div", { class: "water-body" },
      el("div", { class: "tank", role: "img", "aria-label": `${p.water_litres} litres of water` }, fill),
      el("div", {},
        el("div", { class: "big" }, String(p.water_litres), el("small", {}, "litres")),
        el("div", { class: "sub" }, `About ${glasses} glasses of 250 ml. Drink more on training days and in hot weather.`))));
}

function bmiCard(p) {
  const { bmi, bmi_category: cat } = p.summary;
  const lo = 15, hi = 40;
  const pos = Math.min(Math.max((bmi - lo) / (hi - lo), 0), 1) * 100;
  const w = (a, b) => `flex:${b - a}`;
  const marker = el("div", { class: "bmi-marker" });
  requestAnimationFrame(() => requestAnimationFrame(() => { marker.style.left = pos + "%"; }));
  return el("section", { class: "card" },
    el("div", { class: "kpi-label" }, "Body mass index"),
    el("div", { class: "big" }, String(bmi), el("small", {}, cat)),
    el("div", { class: "bmi-scale", role: "img", "aria-label": `BMI ${bmi}, ${cat}` },
      el("div", { style: w(15, 18.5) }), el("div", { style: w(18.5, 25) }),
      el("div", { style: w(25, 30) }), el("div", { style: w(30, 40) }), marker),
    el("div", { class: "bmi-ticks" }, ...["15", "18.5", "25", "30", "40"].map(t => el("span", {}, t))),
    el("div", { class: "sub" }, `Maintenance is about ${p.summary.maintenance_calories} kcal a day.`));
}

function macrosCard(p) {
  const m = p.macros;
  const items = [
    ["Protein", m.protein_g, "g", "--green", m.protein_g * 4],
    ["Carbs", m.carbs_g, "g", "--amber", m.carbs_g * 4],
    ["Fat", m.fat_g, "g", "--rose", m.fat_g * 9],
    ["Fibre", m.fiber_g, "g", "--blue", null],
  ];
  const total = m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9;
  return card("Daily macros", "Grams per day and share of your calories.",
    el("div", { class: "macros" }, ...items.map(([name, g, unit, color, kcal]) => {
      const share = kcal === null ? Math.min((g / 40) * 100, 100) : (kcal / total) * 100;
      return el("div", { class: "macro" },
        el("div", { class: "name" }, el("i", { class: "dot", style: `background:var(${color})` }), name),
        el("b", {}, String(g), el("small", {}, unit)),
        el("div", { class: "track" }, el("div", { style: `width:${share.toFixed(0)}%;background:var(${color})` })));
    })),
    el("p", { class: "foot" }, `Protein sources: ${p.protein_sources}.`));
}

function workoutCard(p) {
  const days = p.workout.days;
  const maxMin = Math.max(...days.map(d => d.minutes), 1);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const detail = el("div", { class: "day-detail", role: "tabpanel" });
  const tabs = days.map((d, i) => {
    const isToday = i === todayIdx;
    const btn = el("button", { type: "button", class: "day", role: "tab", "aria-selected": "false" },
      el("b", {}, d.day),
      el("span", { class: "bar" }, el("i", { style: `height:${(d.minutes / maxMin) * 100}%` })),
      el("small", {}, d.minutes ? `${d.minutes} min` : "Rest"));
    btn.addEventListener("click", () => select(i));
    return btn;
  });
  function select(i) {
    tabs.forEach((t, j) => t.setAttribute("aria-selected", String(i === j)));
    const d = days[i];
    const moves = d.details.split(/,\s*(?![^()]*\))/);
    detail.replaceChildren(
      el("h3", {}, d.focus),
      el("p", { class: "meta" }, (d.minutes ? `${d.minutes} minutes` : "Recovery day") + (i === todayIdx ? ", today" : "")),
      el("ul", { class: "ex-list" }, ...moves.map(x => el("li", {}, x))));
  }
  select(todayIdx);
  return card("Weekly exercise plan", p.workout.summary, el("div", { class: "days", role: "tablist" }, ...tabs), detail);
}

function mealsCard(p) {
  return card("Meal split", "How to spread your calories through the day.",
    el("div", { class: "meals" }, ...p.meals.map(x =>
      el("div", { class: "meal" },
        el("h3", {}, x.name),
        el("div", { class: "kcal" }, String(x.kcal), el("small", {}, " kcal")),
        el("p", {}, x.idea)))));
}

function nutrientsCard(p) {
  return card("Daily nutrient targets", "Based on your age, gender and meal type.",
    el("div", { class: "nutrients" }, ...p.micronutrients.map(n =>
      el("div", { class: "nut" },
        el("h3", {}, n.name), el("b", {}, `${n.amount} ${n.unit}`), el("p", {}, n.sources)))));
}

function render(p, input) {
  const who = `${LABELS[input.gender]}, ${input.age} years, ${input.height_cm} cm, ${input.weight_kg} kg. ` +
    `${LABELS[input.meal_type][0].toUpperCase()}${LABELS[input.meal_type].slice(1)}, ${LABELS[input.intensity]} level, ${LABELS[input.goal]} goal.`;
  const print = el("button", { type: "button", class: "ghost" }, "Save as PDF");
  print.addEventListener("click", () => window.print());

  results.replaceChildren(
    el("div", { class: "page-head" },
      el("div", {}, el("h1", {}, "Your fitness plan"), el("p", {}, who)), print),
    el("div", { class: "kpis" }, caloriesCard(p), waterCard(p), bmiCard(p)),
    macrosCard(p), workoutCard(p), mealsCard(p), nutrientsCard(p),
    el("p", { class: "note" }, p.note));
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  try {
    const input = Object.fromEntries(new FormData(form).entries());
    const plan = Planner.buildPlan(input);   // runs in the browser, no server needed
    render(plan, input);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
