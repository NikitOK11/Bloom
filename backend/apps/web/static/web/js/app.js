(function () {
    document.documentElement.classList.add("js-enabled");

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
            url.pathname === "/"
        ) {
            return false;
        }

        return !url.pathname.startsWith("/login/") && !url.pathname.startsWith("/admin/");
    }

    function updateActiveNav(url) {
        document.querySelectorAll(".nav-link[data-nav-key]").forEach((link) => {
            const key = link.dataset.navKey;
            const active =
                (key === "events" &&
                    (
                        url.pathname.startsWith("/events/") ||
                        url.pathname.startsWith("/teams/")
                    )) ||
                (key === "calendar" && url.pathname.startsWith("/calendar/")) ||
                (key === "profile" && url.pathname.startsWith("/profile/"));
            link.classList.toggle("nav-link-primary", active);
        });
    }

    function updateTitle() {
        const heading = content.querySelector("h1");
        if (heading && heading.textContent.trim()) {
            document.title = `${heading.textContent.trim()} — Bloom`;
        }
    }

    function filterPanelSelector() {
        return "[data-filter-controls], [data-olympiad-controls]";
    }

    function filterFocusRoot(field) {
        return field.closest("[data-filter-focus-root], .olympiad-page");
    }

    function closeFilters(exceptField) {
        document.querySelectorAll("[data-filter-field].is-active").forEach((field) => {
            if (field === exceptField) {
                return;
            }
            field.classList.remove("is-active");
            field.querySelector("[data-filter-trigger]")?.setAttribute("aria-expanded", "false");
            resetFilterStack(field);
        });

        document
            .querySelectorAll("[data-filter-focus-root].filter-focus-active, .olympiad-page.filter-focus-active")
            .forEach((root) => {
                if (!exceptField || !root.contains(exceptField)) {
                    root.classList.remove("filter-focus-active");
                }
            });
    }

    function setFilterActive(field, isActive) {
        const root = filterFocusRoot(field);
        const trigger = field.querySelector("[data-filter-trigger]");

        closeFilters(isActive ? field : null);
        field.classList.toggle("is-active", isActive);
        trigger?.setAttribute("aria-expanded", isActive ? "true" : "false");
        root?.classList.toggle("filter-focus-active", isActive);

        if (isActive) {
            resetFilterStack(field);
            window.setTimeout(() => {
                syncFilterStackHeights(field);
                field.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 50);
        }
    }

    function selectFilterOption(option) {
        const field = option.closest("[data-filter-field]");
        if (!field) {
            return;
        }

        const isMultiple = field.dataset.filterMultiple === "true";
        const input = field.querySelector("[data-filter-input]");
        const inputs = field.querySelector("[data-filter-inputs]");
        const valueLabel = field.querySelector("[data-filter-value]");
        const trigger = field.querySelector("[data-filter-trigger]");
        const selectedValue = option.dataset.value || "";

        if (isMultiple) {
            const isSelected = option.getAttribute("aria-selected") === "true";
            option.setAttribute("aria-selected", isSelected ? "false" : "true");

            const selectedOptions = Array.from(field.querySelectorAll("[data-filter-option]")).filter(
                (item) => item.getAttribute("aria-selected") === "true"
            );

            if (inputs) {
                inputs.innerHTML = "";
                selectedOptions.forEach((item) => {
                    const hiddenInput = document.createElement("input");
                    hiddenInput.type = "hidden";
                    hiddenInput.name = field.dataset.filterName || "";
                    hiddenInput.value = item.dataset.value || "";
                    hiddenInput.setAttribute("data-filter-input", "");
                    inputs.appendChild(hiddenInput);
                });
            }

            if (valueLabel) {
                if (selectedOptions.length === 0) {
                    valueLabel.textContent = field.dataset.filterEmptyLabel || "Все";
                } else if (selectedOptions.length === 1) {
                    valueLabel.textContent = selectedOptions[0].textContent.trim();
                } else {
                    valueLabel.textContent = `${selectedOptions.length} выбрано`;
                }
            }
            return;
        }

        if (input) {
            input.value = selectedValue;
        }
        if (valueLabel) {
            valueLabel.textContent = option.textContent.trim();
        }

        field.querySelectorAll("[data-filter-option]").forEach((item) => {
            item.setAttribute("aria-selected", item === option ? "true" : "false");
        });

        setFilterActive(field, false);
        trigger?.focus({ preventScroll: true });
    }

    const searchRestoreState = new WeakMap();

    function clearSearchRestoreState(panel) {
        const state = searchRestoreState.get(panel);
        if (!state) {
            panel.classList.remove("is-restoring-filters");
            return;
        }

        if (state.timeoutId) {
            window.clearTimeout(state.timeoutId);
        }

        if (state.shell && state.onTransitionEnd) {
            state.shell.removeEventListener("transitionend", state.onTransitionEnd);
        }

        searchRestoreState.delete(panel);
        panel.classList.remove("is-restoring-filters");
    }

    function restoreSearchMode(panel, shouldFocus) {
        const searchToggle = panel.querySelector("[data-search-toggle]");
        const compactToggle = panel.querySelector("[data-filter-compact-toggle]");
        const firstFilterTrigger = panel.querySelector("[data-filter-trigger]");
        const searchShell = panel.querySelector("[data-search-shell]");

        clearSearchRestoreState(panel);
        closeFilters();
        panel.classList.add("is-filter-compact-open");
        panel.classList.add("is-restoring-filters");
        compactToggle?.setAttribute("aria-expanded", "true");
        searchToggle?.setAttribute("aria-expanded", "false");

        const finishRestore = () => {
            clearSearchRestoreState(panel);
            panel.classList.remove("is-filter-compact-open");
            compactToggle?.setAttribute("aria-expanded", "false");

            if (shouldFocus && firstFilterTrigger) {
                window.setTimeout(() => firstFilterTrigger.focus({ preventScroll: true }), 40);
            }
        };

        const onTransitionEnd = (event) => {
            if (event.target !== searchShell || event.propertyName !== "max-width") {
                return;
            }
            finishRestore();
        };

        const timeoutId = window.setTimeout(finishRestore, 320);
        searchRestoreState.set(panel, {
            shell: searchShell,
            timeoutId,
            onTransitionEnd,
        });
        searchShell?.addEventListener("transitionend", onTransitionEnd);

        window.requestAnimationFrame(() => {
            panel.classList.remove("is-search-active");
        });
    }

    function setSearchMode(panel, isActive, shouldFocus) {
        const searchToggle = panel.querySelector("[data-search-toggle]");
        const searchInput = panel.querySelector("[data-search-input]");
        const compactToggle = panel.querySelector("[data-filter-compact-toggle]");
        const firstFilterTrigger = panel.querySelector("[data-filter-trigger]");

        if (!isActive) {
            if (!panel.classList.contains("is-search-active")) {
                panel.classList.remove("is-filter-compact-open");
                compactToggle?.setAttribute("aria-expanded", "false");
                if (shouldFocus && firstFilterTrigger) {
                    window.setTimeout(() => firstFilterTrigger.focus({ preventScroll: true }), 40);
                }
                return;
            }

            restoreSearchMode(panel, shouldFocus);
            return;
        }

        clearSearchRestoreState(panel);
        panel.classList.toggle("is-search-active", isActive);
        panel.classList.remove("is-filter-compact-open");
        searchToggle?.setAttribute("aria-expanded", isActive ? "true" : "false");
        compactToggle?.setAttribute("aria-expanded", "false");
        closeFilters();

        if (isActive && shouldFocus && searchInput) {
            window.setTimeout(() => searchInput.focus({ preventScroll: true }), 180);
            return;
        }
    }

    function toggleCompactFilters(button) {
        const panel = button.closest(filterPanelSelector());
        if (!panel) {
            return;
        }
        setSearchMode(panel, false, true);
    }

    function syncFilterStackHeight(stack) {
        if (!stack) {
            return;
        }

        const activeIndex = Number.parseInt(stack.dataset.activePage || "0", 10);
        const activePage = stack.querySelector(`[data-filter-stack-page="${activeIndex}"]`);
        if (!activePage) {
            return;
        }

        stack.style.height = `${activePage.scrollHeight}px`;
    }

    function syncFilterStackHeights(scope) {
        scope?.querySelectorAll("[data-filter-stack]").forEach((stack) => {
            syncFilterStackHeight(stack);
        });
    }

    function setFilterStackState(stack, pageIndex) {
        const toggles = stack?.querySelectorAll("[data-filter-group-toggle]");
        if (!stack) {
            return;
        }

        const pageCount = Number.parseInt(stack.dataset.filterStackPages || "1", 10);
        stack.style.setProperty("--filter-stack-pages", String(pageCount > 0 ? pageCount : 1));
        const normalizedIndex = Number.isFinite(pageIndex) && pageIndex > 0 ? pageIndex : 0;
        stack.style.setProperty("--filter-stack-page-index", String(normalizedIndex));
        stack.dataset.activePage = String(normalizedIndex);
        toggles?.forEach((toggle) => {
            const target = Number.parseInt(toggle.dataset.filterGroupTarget || "0", 10);
            toggle.setAttribute("aria-expanded", target === normalizedIndex ? "true" : "false");
        });
        window.requestAnimationFrame(() => syncFilterStackHeight(stack));
    }

    function resetFilterStack(scope) {
        scope?.querySelectorAll("[data-filter-stack]").forEach((stack) => {
            setFilterStackState(stack, 0);
        });
    }

    function openFilterGroup(button) {
        const stack = button.closest("[data-filter-stack]");
        if (!stack) {
            return;
        }

        const targetIndex = Number.parseInt(button.dataset.filterGroupTarget || "0", 10);
        setFilterStackState(stack, targetIndex);
    }

    function closeFilterGroup(button) {
        const stack = button.closest("[data-filter-stack]");
        if (!stack) {
            return;
        }

        const targetIndex = Number.parseInt(button.dataset.filterGroupBackTarget || "0", 10);
        setFilterStackState(stack, targetIndex);
    }

    function replaceEventResults(html) {
        const parser = new DOMParser();
        const nextDocument = parser.parseFromString(html, "text/html");
        const currentPage = content.querySelector(".event-catalog-page");
        const nextPage = nextDocument.querySelector(".event-catalog-page");
        const currentResults = currentPage?.querySelector("[data-event-results]");
        const nextResults = nextPage?.querySelector("[data-event-results]");
        const currentPanel = currentPage?.querySelector("[data-enhanced-filter-form]");
        const nextPanel = nextPage?.querySelector("[data-enhanced-filter-form]");

        if (!currentPage || !nextPage || !currentResults || !nextResults || !currentPanel || !nextPanel) {
            return false;
        }

        currentPanel.replaceWith(nextPanel);
        currentResults.replaceWith(nextResults);
        return true;
    }

    async function loadFilterResults(url, options) {
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
            if (!replaceEventResults(html)) {
                throw new Error("Unable to replace event results");
            }

            closeFilters();
            if (shouldPush) {
                window.history.pushState({ partial: true, filterResultsOnly: true }, "", url.href);
            }
        } catch (_) {
            window.location.href = url.href;
            return;
        }

        setLoading(false);
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
        const searchToggle = event.target.closest("[data-search-toggle]");
        if (searchToggle) {
            event.preventDefault();
            const panel = searchToggle.closest(filterPanelSelector());
            if (panel) {
                setSearchMode(panel, true, true);
            }
            return;
        }

        const compactToggle = event.target.closest("[data-filter-compact-toggle]");
        if (compactToggle) {
            event.preventDefault();
            toggleCompactFilters(compactToggle);
            return;
        }

        const filterTrigger = event.target.closest("[data-filter-trigger]");
        if (filterTrigger) {
            event.preventDefault();
            const field = filterTrigger.closest("[data-filter-field]");
            if (field) {
                setFilterActive(field, !field.classList.contains("is-active"));
            }
            return;
        }

        const filterOption = event.target.closest("[data-filter-option]");
        if (filterOption) {
            event.preventDefault();
            selectFilterOption(filterOption);
            return;
        }

        const filterGroupToggle = event.target.closest("[data-filter-group-toggle]");
        if (filterGroupToggle) {
            event.preventDefault();
            openFilterGroup(filterGroupToggle);
            return;
        }

        const filterGroupBack = event.target.closest("[data-filter-group-back]");
        if (filterGroupBack) {
            event.preventDefault();
            closeFilterGroup(filterGroupBack);
            return;
        }

        if (!event.target.closest("[data-filter-field]")) {
            closeFilters();
        }

        const filterUpdateLink = event.target.closest("[data-filter-update-link]");
        if (filterUpdateLink) {
            const filterUrl = sameOriginUrl(filterUpdateLink.href);
            if (!filterUrl) {
                return;
            }

            event.preventDefault();
            loadFilterResults(filterUrl);
            return;
        }

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

    document.addEventListener("submit", (event) => {
        const form = event.target.closest("[data-enhanced-filter-form]");
        if (!form) {
            return;
        }

        const url = sameOriginUrl(form.getAttribute("action") || window.location.href);
        if (!url) {
            return;
        }

        event.preventDefault();
        const formData = new FormData(form);
        const query = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            const normalized = typeof value === "string" ? value.trim() : "";
            if (!normalized) {
                continue;
            }
            query.append(key, normalized);
        }
        url.search = query.toString();
        loadFilterResults(url);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        const activeField = document.querySelector("[data-filter-field].is-active");
        if (activeField) {
            event.preventDefault();
            setFilterActive(activeField, false);
            activeField.querySelector("[data-filter-trigger]")?.focus({ preventScroll: true });
            return;
        }

        const searchActivePanel = document.querySelector(
            "[data-filter-controls].is-search-active, [data-olympiad-controls].is-search-active"
        );
        if (searchActivePanel) {
            event.preventDefault();
            setSearchMode(searchActivePanel, false, true);
        }
    });

    window.addEventListener("popstate", () => {
        const url = sameOriginUrl(window.location.href);
        if (url) {
            const currentEventPage = content.querySelector(".event-catalog-page");
            if (currentEventPage && url.pathname.startsWith("/events/")) {
                loadFilterResults(url, { push: false });
                return;
            }
            loadPage(url, { push: false });
        }
    });
})();
