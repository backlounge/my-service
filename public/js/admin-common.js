function redirectToLogin() {
  window.location.href = "/admin/login";
}

// ヘッダー共通部分(ログインユーザー表示・サイト編集リンクの表示切替・ログアウト)を初期化する。
// 未ログインの場合は /admin/login へリダイレクトし、null を返す。
async function initAdminChrome() {
  const logoutButton = document.getElementById("logout-button");
  const currentUserLabel = document.getElementById("current-user");
  const siteEditLink = document.getElementById("site-edit-link");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      redirectToLogin();
    });
  }

  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) {
    redirectToLogin();
    return null;
  }

  const result = await response.json();
  const user = result.user;

  if (currentUserLabel) {
    currentUserLabel.textContent = `${user.email}(${user.role === "admin" ? "管理者" : "一般ユーザー"})`;
  }
  if (siteEditLink) {
    siteEditLink.classList.toggle("hidden", user.role !== "admin");
  }

  return user;
}
