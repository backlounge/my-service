// フッターの年号を自動更新
document.getElementById("year").textContent = new Date().getFullYear();

// モバイルメニューの開閉
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const iconOpen = document.getElementById("icon-open");
const iconClose = document.getElementById("icon-close");

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = !mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden");
    iconOpen.classList.toggle("hidden");
    iconClose.classList.toggle("hidden");
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
      iconOpen.classList.remove("hidden");
      iconClose.classList.add("hidden");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// お問い合わせフォーム送信(自前API: /api/contact)
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "送信中...";

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const result = await response.json();

      if (result.success) {
        formStatus.textContent = "お問い合わせありがとうございます。担当者よりご連絡いたします。";
        formStatus.className = "text-sm text-brand-700";
        contactForm.reset();
      } else {
        throw new Error(result.message || "送信に失敗しました");
      }
    } catch (error) {
      formStatus.textContent = "送信に失敗しました。時間をおいて再度お試しいただくか、直接メールにてご連絡ください。";
      formStatus.className = "text-sm text-red-600";
    } finally {
      formStatus.classList.remove("hidden");
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
}
