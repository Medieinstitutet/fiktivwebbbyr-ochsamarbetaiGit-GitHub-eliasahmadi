/* ===== Helpers */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/* ===== År i footer */
$("#year").textContent = new Date().getFullYear();

/* ===== Tema (dark/light) – sparar val i localStorage */
(() => {
  const root = document.documentElement;
  const KEY = "theme";
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const saved = localStorage.getItem(KEY);
  root.dataset.theme = saved || (mql.matches ? "dark" : "light");
  $("[data-action='toggle-theme']").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, root.dataset.theme);
  });
})();

/* ===== Mobilmeny */
(() => {
  const btn = $("[data-action='toggle-menu']");
  const nav = $("#primary-nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  // Stäng på länk-klick
  $$("#primary-nav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }));
})();

/* ===== Smooth scroll + scrollspy */
(() => {
  $$("#primary-nav a").forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        $(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", href);
      }
    });
  });

  const links = $$("#primary-nav a[data-spy]");
  const sections = links.map(l => $(l.getAttribute("href")));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === `#${ent.target.id}`));
      }
    });
  }, { rootMargin: "-50% 0px -45% 0px", threshold: 0.01 });
  sections.forEach(s => s && obs.observe(s));
})();

/* ===== Reveal on scroll */
(() => {
  const obs = new IntersectionObserver((ents) => {
    ents.forEach(ent => ent.target.classList.toggle("visible", ent.isIntersecting));
  }, { threshold: 0.1 });
  $$("[data-observe]").forEach(el => obs.observe(el));
})();

/* ===== KPI up-räknare */
(() => {
  const counters = $$("[data-counter]");
  const obs = new IntersectionObserver((ents) => {
    ents.forEach(ent => {
      if (ent.isIntersecting) {
        const el = ent.target;
        const target = +el.dataset.counter;
        let cur = 0;
        const step = Math.max(1, Math.round(target / 60));
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = cur;
        }, 16);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.9 });
  counters.forEach(c => obs.observe(c));
})();

/* ===== Portfolio (render + filter + modal) */
const PROJECTS = [
  { id: 1, title: "Snabb företagslandning", cat: "web", tags: ["HTML", "CSS", "SEO"], desc: "Lättvikt, fokus på CWV.", url: "#", hue: 210 },
  { id: 2, title: "UI kit & komponenter", cat: "ui", tags: ["Designsystem", "WCAG"], desc: "Skalbara UI-mönster.", url: "#", hue: 270 },
  { id: 3, title: "E-handel demo", cat: "ecom", tags: ["Kassa-flöde", "Access"], desc: "Klarna-liknande checkout.", url: "#", hue: 160 },
  { id: 4, title: "Blogg med microdata", cat: "web", tags: ["Schema", "OpenGraph"], desc: "Rikare SERP-träffar.", url: "#", hue: 20 },
  { id: 5, title: "Dashboard UI", cat: "ui", tags: ["Cards", "Charts"], desc: "Datatät layout.", url: "#", hue: 320 },
  { id: 6, title: "Headless produktlista", cat: "ecom", tags: ["API", "Filter"], desc: "Snabb katalog.", url: "#", hue: 45 }
];

(() => {
  const grid = $("#portfolio-grid");
  const modal = $("#project-modal");
  const mTitle = $("#modal-title");
  const mTags = $("#modal-tags");
  const mMedia = $("#modal-media");
  const mDesc = $("#modal-desc");
  const mLink = $("#modal-link");

  function card(p) {
    const el = document.createElement("article");
    el.className = "card project";
    el.dataset.cat = p.cat;
    el.innerHTML = `
      <div class="thumb" style="--h:${p.hue}"></div>
      <div class="body">
        <h3>${p.title}</h3>
        <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <p class="muted">${p.desc}</p>
        <div class="row">
          <button class="btn ghost" data-id="${p.id}">Läs mer</button>
        </div>
      </div>
    `;
    return el;
  }

  function render(list = PROJECTS) {
    grid.innerHTML = "";
    list.forEach(p => grid.appendChild(card(p)));
    $$("[data-id]", grid).forEach(btn => btn.addEventListener("click", () => open(+btn.dataset.id)));
  }

  function open(id) {
    const p = PROJECTS.find(x => x.id === id);
    if (!p) return;
    mTitle.textContent = p.title;
    mTags.textContent = [p.cat.toUpperCase(), ...p.tags].join(" • ");
    mMedia.innerHTML = `<div class="thumb" style="--h:${p.hue}; border-radius:12px;"></div>`;
    mDesc.textContent = p.desc;
    mLink.href = p.url;
    modal.showModal();
  }

  $("[data-action='close-modal']").addEventListener("click", () => $("#project-modal").close());
  $("#project-modal").addEventListener("click", (e) => {
    if (e.target.nodeName === "DIALOG") e.target.close();
  });

  // Filter
  const chips = $$(".chip");
  chips.forEach(c => c.addEventListener("click", () => {
    chips.forEach(x => x.classList.remove("is-active"));
    c.classList.add("is-active");
    const f = c.dataset.filter;
    render(f === "all" ? PROJECTS : PROJECTS.filter(p => p.cat === f));
  }));

  render();
})();

/* ===== Testimonials (karusell) */
(() => {
  const data = [
    { quote: "Rapp leverans och riktigt snygg finish.", who: "Sara, caféägare" },
    { quote: "Vi ökade laddhastigheten och rankingen direkt.", who: "Jonas, e-handel" },
    { quote: "Tydlig process och bra kommunikation.", who: "Mina, konsult" }
  ];

  const track = $("#carousel-track");
  track.innerHTML = data.map(d => `
    <li class="slide">
      <p>"${d.quote}"</p>
      <p class="who">— ${d.who}</p>
    </li>
  `).join("");

  let idx = 0;
  function show(i) {
    idx = (i + data.length) % data.length;
    const offset = -idx * 100;
    track.style.transform = `translateY(${offset}%)`;
  }
  // gör vertikal "slide" via CSS grid height-hack
  track.style.transition = "transform .4s";
  track.style.willChange = "transform";
  track.style.gridAutoRows = "1fr";

  $("[data-action='prev']").addEventListener("click", () => show(idx - 1));
  $("[data-action='next']").addEventListener("click", () => show(idx + 1));
  setInterval(() => show(idx + 1), 4500);
})();

/* ===== Kontaktformulär validering */
(() => {
  const form = $("#contact-form");
  const errors = {
    name: "Ange ditt namn.",
    email: "Ange en giltig e-postadress.",
    budget: "Välj budget.",
    message: "Beskriv ditt behov (minst 20 tecken).",
    consent: "Du måste godkänna kontakt."
  };
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(id, msg = "") {
    const field = $(`#${id}`);
    const small = $(`[data-error-for='${id}']`);
    if (msg) {
      field.setAttribute("aria-invalid", "true");
      if (small) small.textContent = msg;
    } else {
      field.removeAttribute("aria-invalid");
      if (small) small.textContent = "";
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const budget = $("#budget").value;
    const message = $("#message").value.trim();
    const consent = $("#consent").checked;

    if (!name) { setError("name", errors.name); ok = false; } else setError("name");
    if (!emailRe.test(email)) { setError("email", errors.email); ok = false; } else setError("email");
    if (!budget) { setError("budget", errors.budget); ok = false; } else setError("budget");
    if (message.length < 20) { setError("message", errors.message); ok = false; } else setError("message");
    if (!consent) { $("#consent").focus(); ok = false; }

    const feedback = $(".form-feedback");
    if (ok) {
      feedback.textContent = "Tack! Vi återkommer inom kort 🙌";
      form.reset();
      setTimeout(() => feedback.textContent = "", 3500);
    } else {
      feedback.textContent = "Kolla fälten ovan.";
    }
  });
})();

/* ===== Back to top */
(() => {
  const btn = $("#to-top");
  window.addEventListener("scroll", () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.classList.toggle("show", y > 640);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
