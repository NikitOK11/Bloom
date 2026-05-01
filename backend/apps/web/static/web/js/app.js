(function () {
    const content = document.querySelector("#app-content");
    const status = document.querySelector("#app-status");

    if (!content || !window.fetch || !window.history) {
        return;
    }

    const loadingMessage = status?.dataset.loadingMessage || "Загрузка…";
    const errorMessage =
        status?.dataset.errorMessage || "Не удалось загрузить страницу. Открываем обычным способом…";

    function setLoading(isLoading, message) {
        content.classList.toggle("is-loading", isLoading);
        if (!status) {
            return;
        }
        status.textContent = message || loadingMessage;
        status.hidden = !isLoading;
    }

    function sameOriginUrl(href) {
        try {
            const url = new URL(href, window.location.href);
            return url.origin === window.location.origin ? url : null;
        } catch (_) {
            return null;
        }
    }

    function shouldHandleLink(link, event) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            link.target ||
            link.hasAttribute("download") ||
            !link.matches("[data-spa-link]")
        ) {
            return false;
        }

        const url = sameOriginUrl(link.href);
        if (!url) {
            return false;
        }

        if (
            document.body.classList.contains("home-body") ||
            document.body.classList.contains("olympiad-body") ||
            url.pathname === "/" ||
            url.pathname === "/olympiads/"
        ) {
            return false;
        }

        return !url.pathname.startsWith("/login/") && !url.pathname.startsWith("/admin/");
    }

    function updateActiveNav(url) {
        document.querySelectorAll(".nav-link[data-nav-key]").forEach((link) => {
            const key = link.dataset.navKey;
            const active =
                (key === "home" && url.pathname === "/") ||
                (key === "olympiads" && url.pathname === "/olympiads/") ||
                (key === "events" &&
                    (url.pathname.startsWith("/events/") || url.pathname.startsWith("/teams/")));
            link.classList.toggle("nav-link-primary", active);
        });
    }

    function updateTitle() {
        const heading = content.querySelector("h1");
        if (heading && heading.textContent.trim()) {
            document.title = `${heading.textContent.trim()} — Bloom`;
        }
    }

    async function loadPage(url, options) {
        const shouldPush = options?.push !== false;
        setLoading(true);

        try {
            const response = await fetch(url.href, {
                headers: {
                    "X-Partial-Request": "true",
                    "X-Requested-With": "fetch",
                },
                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Unexpected response ${response.status}`);
            }

            const html = await response.text();
            content.innerHTML = html;
            content.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: "smooth" });
            updateActiveNav(url);
            updateTitle();

            if (shouldPush) {
                window.history.pushState({ partial: true }, "", url.href);
            }
        } catch (_) {
            setLoading(true, errorMessage);
            window.location.href = url.href;
            return;
        }

        setLoading(false);
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link || !shouldHandleLink(link, event)) {
            return;
        }

        event.preventDefault();
        const url = sameOriginUrl(link.href);
        if (url) {
            loadPage(url);
        }
    });

    window.addEventListener("popstate", () => {
        const url = sameOriginUrl(window.location.href);
        if (url) {
            loadPage(url, { push: false });
        }
    });
})();
