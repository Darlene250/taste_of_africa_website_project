// ==========================================================
// Tastes of Africa - script.js
// Linked on every page. Each feature first checks that the
// elements it needs exist on the current page.
// ==========================================================

// ---------- Safe localStorage helpers ----------
// (localStorage can be blocked in some browsers, so we use try/catch)
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage not available: the site still works for this visit.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupMenu();
  setupFilters();
  setupFavorites();
  setupIngredientScaler();
  setupContactForm();
  setupNewsletter();
});

// ==========================================================
// 1. Dark / light mode toggle (remembered with localStorage)
// ==========================================================
function setupTheme() {
  const button = document.getElementById("theme-toggle");
  const root = document.documentElement;

  // Use the saved choice, or the visitor's system preference
  let theme = readStorage("toa-theme", null);
  if (theme === null) {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  applyTheme(theme);

  if (!button) return;
  button.addEventListener("click", () => {
    theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(theme);
    writeStorage("toa-theme", theme);
  });

  function applyTheme(value) {
    root.setAttribute("data-theme", value);
    if (button) {
      const isDark = value === "dark";
      button.textContent = isDark ? "Light mode" : "Dark mode";
      button.setAttribute("aria-pressed", String(isDark));
    }
  }
}

// ==========================================================
// 2. Mobile navigation menu
// ==========================================================
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

// ==========================================================
// 3. Interactive recipe filter (by region)
//    Buttons have data-filter, recipe cards have data-region.
// ==========================================================
function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll("[data-region]");
  if (buttons.length === 0 || cards.length === 0) return;

  const emptyMessage = document.getElementById("no-results");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter; // "all", "west-africa", ...

      // Highlight the active button
      buttons.forEach((b) => {
        const isActive = b === button;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });

      // Loop through the cards and show or hide each one
      let visible = 0;
      cards.forEach((card) => {
        const show = selected === "all" || card.dataset.region === selected;
        card.classList.toggle("hidden", !show);
        if (show) visible++;
      });

      if (emptyMessage) {
        emptyMessage.classList.toggle("hidden", visible !== 0);
      }
    });
  });
}

// ==========================================================
// 4. "Add to Favorites" (saved in localStorage)
// ==========================================================
function setupFavorites() {
  const buttons = document.querySelectorAll(".fav-btn");
  if (buttons.length === 0) return;

  const KEY = "toa-favorites";
  let favorites = readStorage(KEY, []);
  if (!Array.isArray(favorites)) favorites = [];

  const counter = document.getElementById("fav-count");

  function paint(button) {
    const saved = favorites.includes(button.dataset.id);
    button.classList.toggle("active", saved);
    button.setAttribute("aria-pressed", String(saved));
  }

  function updateCounter() {
    if (counter) counter.textContent = String(favorites.length);
  }

  // When the page loads, restore saved favorites
  buttons.forEach(paint);
  updateCounter();

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      if (favorites.includes(id)) {
        favorites = favorites.filter((item) => item !== id);
      } else {
        favorites.push(id);
      }
      writeStorage(KEY, favorites);

      // Update every button for this recipe (it may appear twice)
      buttons.forEach((b) => {
        if (b.dataset.id === id) paint(b);
      });
      updateCounter();
    });
  });
}

// ==========================================================
// 5. Ingredient scaler (recipe pages)
//    Each amount has data-base = quantity for the base servings.
// ==========================================================
function setupIngredientScaler() {
  const input = document.getElementById("servings");
  const list = document.getElementById("ingredients");
  if (!input || !list) return;

  const baseServings = Number(list.dataset.baseServings) || 4;
  const amounts = list.querySelectorAll(".amount");

  function format(number) {
    // Round to 2 decimals and drop useless zeros (2.50 -> 2.5)
    return String(Math.round(number * 100) / 100);
  }

  input.addEventListener("input", () => {
    const servings = Number(input.value);
    if (!Number.isFinite(servings) || servings < 1) return;

    const factor = servings / baseServings;
    amounts.forEach((span) => {
      span.textContent = format(Number(span.dataset.base) * factor);
    });
  });
}

// ==========================================================
// 6. Contact form validation + dynamic confirmation
// ==========================================================
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const messageInput = document.getElementById("message");
  const error = document.getElementById("message-error");
  const confirmation = document.getElementById("confirmation");
  const confirmText = document.getElementById("confirmation-text");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the browser from submitting the form

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    // The message must be longer than 20 characters
    if (message.length <= 20) {
      error.textContent =
        "Your message must be more than 20 characters (you typed " + message.length + ").";
      messageInput.setAttribute("aria-invalid", "true");
      messageInput.focus();
      return;
    }

    error.textContent = "";
    messageInput.removeAttribute("aria-invalid");

    // Hide the form and show a confirmation using the visitor's name.
    // textContent is used so nothing typed can run as code.
    form.classList.add("hidden");
    confirmText.textContent = "Thank you, " + name + "! We've received your message.";
    confirmation.classList.remove("hidden");
    confirmation.focus();
  });

  // Clear the error as soon as the message becomes long enough
  messageInput.addEventListener("input", () => {
    if (messageInput.value.trim().length > 20) {
      error.textContent = "";
      messageInput.removeAttribute("aria-invalid");
    }
  });
}

// ==========================================================
// 7. Footer newsletter sign-up (optional enhancement)
// ==========================================================
function setupNewsletter() {
  const forms = document.querySelectorAll(".newsletter-form");

  forms.forEach((form) => {
    const message = form.parentElement.querySelector(".newsletter-msg");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = form.querySelector("input[type='email']").value.trim();
      message.textContent = "Thanks for subscribing, " + email + "!";
      form.reset();
    });
  });
}
