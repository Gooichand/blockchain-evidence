function togglePasswordVisibility(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    const wrapper = input.closest('.password-input-wrapper');

    if (!wrapper) return;

    const toggleBtn = wrapper.querySelector('.password-toggle-btn');

    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('svg');

    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    if (icon) {

        icon.setAttribute(
            "data-lucide",
            isPassword ? "eye-off" : "eye"
        );

        lucide.createIcons();

    }
}