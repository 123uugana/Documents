import { apiFetch } from "./api.js";

const selectors = {
  modal: document.getElementById("modal"),
  navMenu: document.getElementById("navMenu"),
  menuBtn: document.getElementById("menuBtn"),
  formMessage: document.getElementById("formMessage"),
  featureList: document.getElementById("featureList"),
  aboutList: document.getElementById("aboutList"),
  sayList: document.getElementById("sayList"),
  memberCount: document.getElementById("memberCount"),
  eventCount: document.getElementById("eventCount"),
  tripCount: document.getElementById("tripCount"),
  communityCount: document.getElementById("communityCount"),
  showPhone: document.getElementById("showPhone"),
  showFacebook: document.getElementById("showFacebook"),
  showInstagram: document.getElementById("showInstagram"),
  authLink: document.getElementById("authLink"),
  logoutBtn: document.getElementById("logoutBtn")
};

let state = null;
let isAdmin = false;

init();

async function init() {
  bindUi();
  await checkAuth();
  await loadData();
}

function bindUi() {
  document.querySelectorAll("[data-logo-image]").forEach((image) => {
    image.addEventListener("error", () => image.classList.add("is-hidden"), { once: true });
  });

  document.querySelector("[data-open-modal]")?.addEventListener("click", openModal);
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  selectors.modal.addEventListener("click", closeModalOnBackdrop);
  selectors.menuBtn.addEventListener("click", toggleMenu);
  selectors.navMenu.addEventListener("click", closeMenuOnLink);
  selectors.logoutBtn?.addEventListener("click", logoutAdmin);

  document.getElementById("joinForm").addEventListener("submit", submitJoinForm);
  document.getElementById("featureForm").addEventListener("submit", addFeature);
  document.getElementById("aboutForm").addEventListener("submit", addAbout);
  document.getElementById("sayForm").addEventListener("submit", addSay);
  document.getElementById("contactForm").addEventListener("submit", saveContact);
  document.getElementById("membershipForm")?.addEventListener("submit", saveMembershipForm);

  document.getElementById("addEventBtn").addEventListener("click", () => updateStat("events", 1));
  document.getElementById("addTripBtn").addEventListener("click", () => updateStat("trips", 1));
  document.getElementById("addCommunityBtn").addEventListener("click", () => updateStat("community", 1));
  document.getElementById("removeMemberBtn").addEventListener("click", () => updateStat("members", -1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeMenu();
    }
  });
}

async function loadData() {
  try {
    state = await apiFetch("/api/data");
    renderAll();
  } catch (error) {
    showLoadError(error);
  }
}

function renderAll() {
  updateAdminUi();
  renderStats(state.stats);
  renderContact(state.contact);
  renderCards(selectors.featureList, state.features, renderFeatureCard);
  renderCards(selectors.aboutList, state.abouts, renderAboutCard);
  renderCards(selectors.sayList, state.says, renderSayCard);
}

function openModal() {
  selectors.modal.hidden = false;
  document.body.classList.add("menu-open");
  document.getElementById("name").focus();
}

function closeModal() {
  selectors.modal.hidden = true;
  selectors.formMessage.textContent = "";
  document.body.classList.remove("menu-open");
}

function closeModalOnBackdrop(event) {
  if (event.target === selectors.modal) {
    closeModal();
  }
}

function toggleMenu() {
  const isOpen = selectors.navMenu.classList.toggle("is-open");
  selectors.menuBtn.setAttribute("aria-expanded", String(isOpen));
  selectors.menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function closeMenuOnLink(event) {
  if (event.target.matches("a, button")) {
    closeMenu();
  }
}

function closeMenu() {
  selectors.navMenu.classList.remove("is-open");
  selectors.menuBtn.setAttribute("aria-expanded", "false");
  selectors.menuBtn.setAttribute("aria-label", "Open menu");
}

async function submitJoinForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const member = readForm(form, ["name", "phone", "bike"]);

  if (!member) {
    selectors.formMessage.textContent = "Бүх талбарыг бөглөнө үү.";
    return;
  }

  try {
    await createItem("members", member);
    selectors.formMessage.textContent = "Амжилттай илгээгдлээ.";
    form.reset();
  } catch (error) {
    selectors.formMessage.textContent = error.message;
  }
}

async function addFeature(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const item = readForm(form, ["featureTitle", "featureText"]);

  if (!item) return;

  await createItem("features", {
    title: item.featureTitle,
    text: item.featureText
  });

  form.reset();
}

async function addAbout(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const item = readForm(form, ["aboutInput"]);

  if (!item) return;

  await createItem("abouts", {
    text: item.aboutInput
  });

  form.reset();
}

async function addSay(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const item = readForm(form, ["sayText", "sayName"]);

  if (!item) return;

  await createItem("says", {
    text: item.sayText,
    name: item.sayName
  });

  form.reset();
}

async function saveContact(event) {
  event.preventDefault();

  const contact = {
    phone: document.getElementById("phoneContact").value.trim(),
    facebook: document.getElementById("facebookContact").value.trim(),
    instagram: document.getElementById("instagramContact").value.trim()
  };

  await apiFetch("/api/contact", {
    method: "PUT",
    body: JSON.stringify(contact)
  });

  event.currentTarget.reset();
  await loadData();
}

async function saveMembershipForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("membershipMessage");
  const data = new FormData(form);

  try {
    await apiFetch("/api/membership", {
      method: "POST",
      body: data
    });

    message.textContent = "Анкет амжилттай хадгалагдлаа.";
    form.reset();
    await loadData();
  } catch (error) {
    message.textContent = error.message;
  }
}

async function createItem(listName, item) {
  await apiFetch(`/api/${listName}`, {
    method: "POST",
    body: JSON.stringify(item)
  });

  await loadData();
}

async function updateItem(listName, id, item) {
  await apiFetch(`/api/${listName}/${id}`, {
    method: "PUT",
    body: JSON.stringify(item)
  });

  await loadData();
}

async function deleteItem(listName, id) {
  const ok = confirm("Устгах уу?");

  if (!ok) return;

  await apiFetch(`/api/${listName}/${id}`, {
    method: "DELETE"
  });

  await loadData();
}

async function updateStat(key, amount) {
  await apiFetch(`/api/stats/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ amount })
  });

  await loadData();
}

function readForm(form, fieldIds) {
  const values = {};

  for (const id of fieldIds) {
    const input = form.querySelector(`#${id}`);
    const value = input.value.trim();

    if (!value) {
      input.focus();
      return null;
    }

    values[id] = value;
  }

  return values;
}

function renderStats(stats) {
  selectors.memberCount.textContent = `${Math.max(0, stats.members || 0)}+`;
  selectors.eventCount.textContent = `${Math.max(0, stats.events || 0)}+`;
  selectors.tripCount.textContent = `${Math.max(0, stats.trips || 0)}+`;
  selectors.communityCount.textContent = Math.max(1, stats.community || 1);
}

function renderContact(contact = {}) {
  selectors.showPhone.textContent = contact.phone || "-";
  selectors.showFacebook.textContent = contact.facebook || "-";
  renderContactLink(selectors.showInstagram, contact.instagram, "Instagram");
}

function renderContactLink(container, value, label) {
  container.replaceChildren();

  if (!value || value === "-") {
    container.textContent = "-";
    return;
  }

  const link = document.createElement("a");
  link.href = normalizeUrl(value);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  container.append(link);
}

function normalizeUrl(value) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function renderCards(container, items, cardRenderer) {
  container.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "card";
    empty.textContent = "Одоогоор мэдээлэл алга.";
    container.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(cardRenderer(item)));
  container.append(fragment);
}

function renderFeatureCard(item) {
  const card = createCard();
  const title = document.createElement("h3");
  const text = document.createElement("p");

  title.textContent = item.title || "Гарчиггүй";
  text.textContent = item.text || "";

  card.append(title, text);

  if (isAdmin) {
    card.append(createCardActions(
      () => editFeature(item),
      () => deleteItem("features", item.id)
    ));
  }

  return card;
}

function renderAboutCard(item) {
  const card = createCard();
  const text = document.createElement("p");

  text.textContent = item.text || "";

  card.append(text);

  if (isAdmin) {
    card.append(createCardActions(
      () => editAbout(item),
      () => deleteItem("abouts", item.id)
    ));
  }

  return card;
}

function renderSayCard(item) {
  const card = createCard();
  const text = document.createElement("p");
  const name = document.createElement("h4");

  text.textContent = item.text || "";
  name.textContent = item.name ? `- ${item.name}` : "";

  card.append(text, name);

  if (isAdmin) {
    card.append(createCardActions(
      () => editSay(item),
      () => deleteItem("says", item.id)
    ));
  }

  return card;
}

async function editFeature(item) {
  const title = prompt("Шинэ гарчиг", item.title || "");

  if (title === null) return;

  const text = prompt("Шинэ тайлбар", item.text || "");

  if (text === null) return;

  await updateItem("features", item.id, {
    title: title.trim(),
    text: text.trim()
  });
}

async function editAbout(item) {
  const text = prompt("Шинэ текст", item.text || "");

  if (text === null) return;

  await updateItem("abouts", item.id, {
    text: text.trim()
  });
}

async function editSay(item) {
  const text = prompt("Шинэ сэтгэгдэл", item.text || "");

  if (text === null) return;

  const name = prompt("Нэр", item.name || "");

  if (name === null) return;

  await updateItem("says", item.id, {
    text: text.trim(),
    name: name.trim()
  });
}

function createCard() {
  const card = document.createElement("article");
  card.className = "card";
  return card;
}

function createCardActions(onEdit, onDelete) {
  const actions = document.createElement("div");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  actions.className = "card-actions";
  editButton.type = "button";
  editButton.textContent = "Засах";
  editButton.addEventListener("click", onEdit);

  deleteButton.type = "button";
  deleteButton.className = "danger-button";
  deleteButton.textContent = "Устгах";
  deleteButton.addEventListener("click", onDelete);

  actions.append(editButton, deleteButton);
  return actions;
}

async function checkAuth() {
  try {
    const auth = await apiFetch("/api/auth/me");
    isAdmin = auth.loggedIn;
  } catch {
    isAdmin = false;
  }

  updateAdminUi();
}

async function logoutAdmin() {
  await apiFetch("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });

  isAdmin = false;
  updateAdminUi();
  await loadData();
}

function updateAdminUi() {
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin;
  });

  if (selectors.authLink) {
    selectors.authLink.hidden = isAdmin;
  }

  if (selectors.logoutBtn) {
    selectors.logoutBtn.hidden = !isAdmin;
  }
}

function showLoadError(error) {
  const containers = [selectors.featureList, selectors.aboutList, selectors.sayList];

  containers.forEach((container) => {
    container.replaceChildren();

    const message = document.createElement("p");
    message.className = "card";
    message.textContent = `Server ажиллаж байгаа эсэхийг шалгана уу. ${error.message}`;
    container.append(message);
  });
}
