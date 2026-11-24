const siteLanguage = document.getElementById("site-language");
const languageTrigger = siteLanguage.querySelector(".language-trigger");
const languageMenu = siteLanguage.querySelector(".language-menu");
const languageCurrent = siteLanguage.querySelector(".language-current");
const languageMode = siteLanguage.querySelector(".language-mode");
const languageButtons = [...languageMenu.querySelectorAll("[data-language]")];
const languageOptions = new Map(languageButtons
  .filter(button => button.dataset.language)
  .map(button => [button.dataset.language, button]));
const englishLanguage = "en";
const languageStorageKey = "furry-temple-site-language";
const siteCatalogs = globalThis.furryTempleLocales = new Map();
const catalogLoads = new Map();
let latestLanguageRequest = 0;

const localizedBindings = [null, "aria-label", "alt", "content"].flatMap(attribute => {
  const binding = attribute ? `data-i18n-${attribute}` : "data-i18n";
  return Array.from(document.querySelectorAll(`[${binding}]`), element => ({
    element,
    attribute,
    key: element.getAttribute(binding),
    english: attribute ? element.getAttribute(attribute) : element.textContent,
  }));
});

function resolveBrowserLanguage(rawLanguage) {
  const locale = rawLanguage.trim().toLowerCase().replaceAll("_", "-");
  if (languageOptions.has(locale)) return locale;

  const [language, ...subtags] = locale.split("-");
  if (language === "pt") {
    return subtags.length === 0 || subtags.includes("br") ? "pt-br" : englishLanguage;
  }
  if (language === "zh" && subtags.some(subtag => ["hant", "tw", "hk", "mo"].includes(subtag))) {
    return englishLanguage;
  }
  return languageOptions.has(language) ? language : englishLanguage;
}

function savedSiteLanguage() {
  try {
    const saved = localStorage.getItem(languageStorageKey);
    return languageOptions.has(saved) ? saved : null;
  } catch {
    return null;
  }
}

let manualLanguage = savedSiteLanguage();

function currentBrowserLanguage() {
  return resolveBrowserLanguage(navigator.language || navigator.languages?.[0] || "");
}

function loadSiteCatalog(language) {
  if (siteCatalogs.has(language)) return siteCatalogs.get(language);
  if (catalogLoads.has(language)) return catalogLoads.get(language);

  // Classic scripts also load when index.html is opened directly from the folder.
  const load = new Promise(resolve => {
    const script = document.createElement("script");
    script.src = `locales/${language}.js`;
    const finish = () => {
      script.remove();
      catalogLoads.delete(language);
      resolve(siteCatalogs.get(language));
    };
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", finish, { once: true });
    document.head.append(script);
  });
  catalogLoads.set(language, load);
  return load;
}

async function renderSiteLanguage(language) {
  const request = ++latestLanguageRequest;
  const catalog = language === englishLanguage ? null : await loadSiteCatalog(language);
  if (request !== latestLanguageRequest) return;

  const activeLanguage = catalog ? language : englishLanguage;
  const option = languageOptions.get(activeLanguage);
  document.documentElement.lang = option.lang;
  languageCurrent.lang = option.lang;
  languageCurrent.textContent = option.textContent;

  for (const { element, attribute, key, english } of localizedBindings) {
    const value = catalog?.[key] ?? english;
    if (attribute) element.setAttribute(attribute, value);
    else element.textContent = value;
  }
}

function updateLanguagePreference() {
  languageMode.hidden = manualLanguage !== null;
  for (const button of languageButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.language === (manualLanguage ?? "")));
  }
  void renderSiteLanguage(manualLanguage ?? currentBrowserLanguage());
}

function closeLanguageMenuAndFocusTrigger() {
  siteLanguage.open = false;
  languageTrigger.focus();
}

languageMenu.addEventListener("click", event => {
  const button = event.target.closest("[data-language]");
  if (!button) return;

  manualLanguage = button.dataset.language || null;
  try {
    if (manualLanguage) localStorage.setItem(languageStorageKey, manualLanguage);
    else localStorage.removeItem(languageStorageKey);
  } catch {
    // Language switching still works if storage is disabled.
  }
  updateLanguagePreference();
  closeLanguageMenuAndFocusTrigger();
});

siteLanguage.addEventListener("keydown", event => {
  if (event.key === "Escape" && siteLanguage.open) {
    event.preventDefault();
    closeLanguageMenuAndFocusTrigger();
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  event.preventDefault();
  if (!siteLanguage.open) {
    siteLanguage.open = true;
    languageMenu.querySelector('[aria-pressed="true"]').focus();
    return;
  }

  const direction = event.key === "ArrowDown" ? 1 : -1;
  const index = languageButtons.indexOf(document.activeElement);
  const next = index < 0 && direction < 0 ? languageButtons.length - 1 : index + direction;
  languageButtons[(next + languageButtons.length) % languageButtons.length].focus();
});

siteLanguage.addEventListener("focusout", event => {
  if (event.relatedTarget && !siteLanguage.contains(event.relatedTarget)) siteLanguage.open = false;
});

document.addEventListener("click", event => {
  if (siteLanguage.open && !siteLanguage.contains(event.target)) siteLanguage.open = false;
});

window.addEventListener("languagechange", () => {
  if (manualLanguage === null) void renderSiteLanguage(currentBrowserLanguage());
});

updateLanguagePreference();
siteLanguage.hidden = false;
