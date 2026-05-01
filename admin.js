const form = document.getElementById("adminLoginForm");
const message = document.getElementById("adminLoginMessage");
const API_BASE_URL = getApiBaseUrl();

checkLogin();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    message.textContent = "Login амжилттай.";
    window.location.href = "./index.html";
  } catch (error) {
    message.textContent = error.message;
  }
});

async function checkLogin() {
  const auth = await apiFetch("/api/auth/me");

  if (auth.loggedIn) {
    window.location.href = "./index.html";
  }
}

async function apiFetch(url, options = {}) {
  const requestUrl = `${API_BASE_URL}${url}`;
  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  }).catch((error) => {
    console.error(`API request failed: ${requestUrl}`, error);
    throw new Error("API server-тэй холбогдож чадсангүй.");
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`API error ${response.status}: ${requestUrl}`, errorBody);
    throw new Error(errorBody.error || "API алдаа гарлаа.");
  }

  return response.json();
}

function getApiBaseUrl() {
  const localHosts = ["localhost", "127.0.0.1", ""];
  const isLocal = localHosts.includes(window.location.hostname);

  if (isLocal) {
    return "http://localhost:3000";
  }

  return "https://lady-riders-mongolia.onrender.com";
}
