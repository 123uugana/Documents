import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import AdminApplications from "./components/AdminApplications.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Features from "./components/Features.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import MembershipForm from "./components/MembershipForm.jsx";
import Stats from "./components/Stats.jsx";

const emptyData = {
  features: [],
  abouts: [],
  stats: {
    members: 0,
    events: 0,
    trips: 0,
    community: 1
  },
  contact: {
    phone: "-",
    facebook: "-",
    instagram: "-"
  }
};

export default function App() {
  const [data, setData] = useState(emptyData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      await Promise.all([checkAuth(), checkUser(), loadData()]);
      setIsLoading(false);
    }

    loadInitialData();
  }, []);

  async function checkAuth() {
    try {
      const auth = await apiFetch("/api/auth/me");
      setIsAdmin(Boolean(auth.loggedIn));
    } catch {
      setIsAdmin(false);
    }
  }

  async function checkUser() {
    try {
      const auth = await apiFetch("/api/users/me");
      setUser(auth.loggedIn ? auth.user : null);
    } catch {
      setUser(null);
    }
  }

  async function loadData() {
    try {
      const nextData = await apiFetch("/api/data");
      setData({
        features: nextData.features || [],
        abouts: nextData.abouts || [],
        stats: {
          ...emptyData.stats,
          ...(nextData.stats || {})
        },
        contact: {
          ...emptyData.contact,
          ...(nextData.contact || {})
        }
      });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
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
    const ok = window.confirm("Устгах уу?");

    if (!ok) {
      return;
    }

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

  async function saveContact(contact) {
    await apiFetch("/api/contact", {
      method: "PUT",
      body: JSON.stringify(contact)
    });
    await loadData();
  }

  async function registerUser(formValues) {
    const response = await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify(formValues)
    });
    setUser(response.user);
  }

  async function loginUser(formValues) {
    const response = await apiFetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify(formValues)
    });
    setUser(response.user);
  }

  async function logoutUser() {
    await apiFetch("/api/users/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
    setUser(null);
  }

  async function submitMembershipApplication(formData) {
    await apiFetch("/api/membership", {
      method: "POST",
      body: formData
    });
    await checkUser();
  }

  async function loginAdmin(formValues) {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(formValues)
    });
    setIsAdmin(true);
  }

  async function logoutAdmin() {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
    setIsAdmin(false);
    await loadData();
  }

  return (
    <>
      <Header isAdmin={isAdmin} onLogout={logoutAdmin} />

      <main>
        <section id="home" className="hero" aria-labelledby="heroTitle">
          <div className="hero-content">
            <img
              src="/source.jpg"
              alt="Lady Riders Mongolia motorcycle community logo"
              className="hero-logo"
            />
            <p className="eyebrow">Mongolia women rider community</p>
            <h1 id="heroTitle">Lady Riders Mongolia</h1>
            <p className="hero-copy">
              Зам, нөхөрлөл, өөртөө итгэх итгэлээ хамтдаа бүтээдэг эмэгтэй мото
              сонирхогчдын нэгдэл.
            </p>
            <a className="button-link" href="#features">
              Танилцах
            </a>
          </div>
        </section>

        {isLoading && <p className="card app-message">Уншиж байна...</p>}
        {errorMessage && <p className="card app-message">{errorMessage}</p>}

        <Features
          features={data.features}
          isAdmin={isAdmin}
          onAdd={(item) => createItem("features", item)}
          onEdit={(id, item) => updateItem("features", id, item)}
          onDelete={(id) => deleteItem("features", id)}
        />

        <About
          abouts={data.abouts}
          isAdmin={isAdmin}
          onAdd={(item) => createItem("abouts", item)}
          onEdit={(id, item) => updateItem("abouts", id, item)}
          onDelete={(id) => deleteItem("abouts", id)}
        />

        <Stats stats={data.stats} isAdmin={isAdmin} onUpdateStat={updateStat} />

        <Gallery />

        <Contact contact={data.contact} isAdmin={isAdmin} onSave={saveContact} />

        <MembershipForm
          user={user}
          onRegister={registerUser}
          onLogin={loginUser}
          onLogout={logoutUser}
          onSubmitApplication={submitMembershipApplication}
        />

        <AdminLogin isAdmin={isAdmin} onLogin={loginAdmin} onLogout={logoutAdmin} />

        <AdminApplications isAdmin={isAdmin} />
      </main>

      <footer className="site-footer">
        <a href="/privacy.html">Privacy</a>
        <small>Recommended domain: ladyridersmongolia.mn</small>
      </footer>
    </>
  );
}
