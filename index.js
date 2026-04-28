const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const defaultState = {
  stats: {
    members: 0,
    events: 0,
    trips: 0,
    community: 1
  },
  features: [
    {
      title: "Хамтын аялал",
      text: "Хотын богино ride-аас эхлээд урт аялал хүртэл аюулгүй, зохион байгуулалттай хөдөлнө."
    },
    {
      title: "Сургалт ба зөвлөгөө",
      text: "Шинэ rider-уудад хамгаалалт, техник, замын соёлын талаар туршлага хуваалцана."
    },
    {
      title: "Дэмждэг орчин",
      text: "Нэгнээ урамшуулж, хамтдаа илүү итгэлтэй, илүү чадварлаг болдог community."
    }
  ],
  abouts: [
    {
      text: "Lady Riders Mongolia бол мото сонирхдог эмэгтэйчүүдийн нээлттэй, эерэг нэгдэл."
    }
  ],
  says: [
    {
      text: "Анхны аялалдаа ганцаараа биш гэдгээ мэдэрсэн нь хамгийн гоё байсан.",
      name: "Саруул"
    }
  ],
  contact: {
    phone: "-",
    facebook: "Lady Riders Mongolia",
    instagram: "https://www.instagram.com/lady_riders_mongolia_wmc/"
  }
};

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
  showInstagram: document.getElementById("showInstagram")
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => {
  return value && !value.startsWith("YOUR_") && !value.includes("YOUR_PROJECT");
});

let store;

init();

async function init() {
  try {
    store = hasFirebaseConfig ? await createFirebaseStore() : createLocalStore();
  } catch (error) {
    console.warn("Firebase unavailable, using local storage instead.", error);
    store = createLocalStore();
  }

  bindUi();
  subscribeToData();
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

  document.getElementById("joinForm").addEventListener("submit", submitForm);
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

function subscribeToData() {
  store.subscribeStats(renderStats);
  store.subscribeList("features", (items) => renderCards(selectors.featureList, items, renderFeatureCard));
  store.subscribeList("abouts", (items) => renderCards(selectors.aboutList, items, renderAboutCard));
  store.subscribeList("says", (items) => renderCards(selectors.sayList, items, renderSayCard));
  store.subscribeContact(renderContact);
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
  if (event.target.matches("a")) {
    closeMenu();
  }
}

function closeMenu() {
  selectors.navMenu.classList.remove("is-open");
  selectors.menuBtn.setAttribute("aria-expanded", "false");
  selectors.menuBtn.setAttribute("aria-label", "Open menu");
}

async function submitForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const member = readForm(form, ["name", "phone", "bike"]);

  if (!member) {
    selectors.formMessage.textContent = "Бүх талбарыг бөглөнө үү.";
    return;
  }

  await store.addMember(member);
  await store.updateStat("members", 1);

  selectors.formMessage.textContent = "Амжилттай илгээгдлээ.";
  form.reset();
}

async function addFeature(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const item = readForm(form, ["featureTitle", "featureText"]);

  if (!item) return;

  await store.addItem("features", {
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

  await store.addItem("abouts", {
    text: item.aboutInput
  });
  form.reset();
}

async function addSay(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const item = readForm(form, ["sayText", "sayName"]);

  if (!item) return;

  await store.addItem("says", {
    text: item.sayText,
    name: item.sayName
  });
  form.reset();
}

async function saveContact(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const phone = document.getElementById("phoneContact").value.trim();
  const facebook = document.getElementById("facebookContact").value.trim();
  const instagram = document.getElementById("instagramContact").value.trim();

  await store.saveContact({ phone, facebook, instagram });
  form.reset();
}

function saveMembershipForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("membershipMessage");
  const data = new FormData(form);
  const application = {};

  data.forEach((value, key) => {
    if (value instanceof File) {
      application[key] = value.name || "";
      return;
    }

    if (application[key]) {
      application[key] = Array.isArray(application[key])
        ? [...application[key], value]
        : [application[key], value];
      return;
    }

    application[key] = value;
  });

  application.createdAt = new Date().toISOString();

  const storageKey = "lady-riders-membership-applications";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  saved.unshift(application);
  localStorage.setItem(storageKey, JSON.stringify(saved));

  message.textContent = "Анкет амжилттай хадгалагдлаа. Бид удахгүй холбогдох болно.";
  form.reset();
}

async function updateStat(key, amount) {
  await store.updateStat(key, amount);
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

  if (!value) {
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
  return card;
}

function renderAboutCard(item) {
  const card = createCard();
  const text = document.createElement("p");

  text.textContent = item.text || "";
  card.append(text);
  return card;
}

function renderSayCard(item) {
  const card = createCard();
  const text = document.createElement("p");
  const name = document.createElement("h4");

  text.textContent = item.text || "";
  name.textContent = item.name ? `- ${item.name}` : "";

  card.append(text, name);
  return card;
}

function createCard() {
  const card = document.createElement("article");
  card.className = "card";
  return card;
}

function createLocalStore() {
  const storageKey = "lady-riders-mongolia";
  let state = readState();
  const subscribers = {
    stats: [],
    features: [],
    abouts: [],
    says: [],
    contact: []
  };

  queueMicrotask(notifyAll);

  return {
    subscribeStats(callback) {
      subscribers.stats.push(callback);
      callback(state.stats);
    },
    subscribeList(name, callback) {
      subscribers[name].push(callback);
      callback(state[name]);
    },
    subscribeContact(callback) {
      subscribers.contact.push(callback);
      callback(state.contact);
    },
    async addMember(member) {
      state.members = [...(state.members || []), addMeta(member)];
      save();
    },
    async addItem(name, item) {
      state[name] = [addMeta(item), ...state[name]];
      save();
      notify(name, state[name]);
    },
    async updateStat(key, amount) {
      const current = Number(state.stats[key] || 0);
      const minimum = key === "community" ? 1 : 0;
      state.stats[key] = Math.max(minimum, current + amount);
      save();
      notify("stats", state.stats);
    },
    async saveContact(contact) {
      state.contact = contact;
      save();
      notify("contact", state.contact);
    }
  };

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved ? mergeState(defaultState, saved) : cloneDefaultState();
    } catch {
      return cloneDefaultState();
    }
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function notify(name, value) {
    subscribers[name].forEach((callback) => callback(value));
  }

  function notifyAll() {
    notify("stats", state.stats);
    notify("features", state.features);
    notify("abouts", state.abouts);
    notify("says", state.says);
    notify("contact", state.contact);
  }
}

async function createFirebaseStore() {
  const [{ initializeApp }, firestore] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
  ]);

  const {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    serverTimestamp,
    query,
    orderBy
  } = firestore;

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const statsRef = doc(db, "stats", "main");
  const contactRef = doc(db, "settings", "contact");

  await ensureStats();

  return {
    subscribeStats(callback) {
      onSnapshot(statsRef, (snapshot) => callback(snapshot.data() || defaultState.stats));
    },
    subscribeList(name, callback) {
      const listQuery = query(collection(db, name), orderBy("createdAt", "desc"));
      onSnapshot(listQuery, (snapshot) => {
        callback(snapshot.docs.map((item) => item.data()));
      });
    },
    subscribeContact(callback) {
      onSnapshot(contactRef, (snapshot) => callback(snapshot.data() || defaultState.contact));
    },
    async addMember(member) {
      await addDoc(collection(db, "members"), addMeta(member, serverTimestamp));
    },
    async addItem(name, item) {
      await addDoc(collection(db, name), addMeta(item, serverTimestamp));
    },
    async updateStat(key, amount) {
      await updateDoc(statsRef, {
        [key]: increment(amount)
      });
    },
    async saveContact(contact) {
      await setDoc(contactRef, contact);
    }
  };

  async function ensureStats() {
    const snapshot = await getDoc(statsRef);
    if (!snapshot.exists()) {
      await setDoc(statsRef, defaultState.stats);
    }
  }
}

function addMeta(item, timestampFactory) {
  return {
    ...item,
    createdAt: timestampFactory ? timestampFactory() : new Date().toISOString()
  };
}

function mergeState(base, saved) {
  return {
    ...cloneDefaultState(),
    ...saved,
    stats: {
      ...base.stats,
      ...(saved.stats || {})
    },
    contact: {
      ...base.contact,
      ...(saved.contact || {})
    }
  };
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}
