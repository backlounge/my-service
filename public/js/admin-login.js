const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.classList.add("hidden");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.success) {
      window.location.href = "/admin";
    } else {
      loginError.textContent = result.message || "ログインに失敗しました。";
      loginError.classList.remove("hidden");
    }
  } catch {
    loginError.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
    loginError.classList.remove("hidden");
  } finally {
    submitButton.disabled = false;
  }
});
