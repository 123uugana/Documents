const form = document.getElementById("adminLoginForm");
const message = document.getElementById("adminLoginMessage");

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
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "API алдаа гарлаа.");
  }

  return response.json();
}
