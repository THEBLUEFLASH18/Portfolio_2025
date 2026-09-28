// Shared navigation behaviour: mobile menu, sticky shadow, scroll-spy.
(function () {
    const header = document.querySelector('.site-header');
    const burger = document.querySelector('.burger-menu');
    const links = document.querySelector('.nav-links');

    if (burger && links) {
        const setOpen = (open) => {
            burger.classList.toggle('active', open);
            links.classList.toggle('active', open);
            burger.setAttribute('aria-expanded', String(open));
        };
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            setOpen(!burger.classList.contains('active'));
        });
        links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('click', (e) => {
            if (links.classList.contains('active') && !burger.contains(e.target) && !links.contains(e.target)) setOpen(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && links.classList.contains('active')) { setOpen(false); burger.focus(); }
        });
    }

    if (header) {
        const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Scroll-spy: mark the section in view with aria-current.
    const spyLinks = Array.from(document.querySelectorAll('.nav-list a[data-section]'));
    if (!spyLinks.length || !('IntersectionObserver' in window)) return;
    let current = null;
    const setCurrent = (id) => {
        if (id === current) return;
        current = id;
        spyLinks.forEach((a) => {
            if (a.dataset.section === id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
        });
    };
    const observer = new IntersectionObserver((entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setCurrent(hit.target.id);
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    spyLinks.forEach((a) => {
        const el = document.getElementById(a.dataset.section);
        if (el) observer.observe(el);
    });
})();
