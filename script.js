const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const API_BASE = "http://localhost:5000/api";

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const role = document.getElementById("role").value;
  const empId = document.getElementById("empId").value.trim();
  const password = document.getElementById("password").value;

  loginMessage.textContent = "Checking credentials...";

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, empId, password })
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      loginMessage.textContent = payload.message || "Invalid login details.";
      return;
    }

    localStorage.setItem("employeePortalAuth", JSON.stringify(payload));
    window.location.href = role === "admin" ? "admin.html" : "dashboard.html";
  } catch (error) {
    loginMessage.textContent = "Server not running. Start backend on port 5000.";
  }
});
