function initMobileMenu() {
  const btnToggleMenu = document.getElementById('btnToggleMenu');
  const mobileNav = document.getElementById('mobileNav');
  const userMenuToggle = document.getElementById('btnUserMenuToggle');
  const userMenu = document.getElementById('userMenu');
  const btnUserMenuLogin = document.getElementById('btnUserMenuLogin');
  const btnUserMenuRegistro = document.getElementById('btnUserMenuRegistro');
  const btnMobileLogin = document.getElementById('btnMobileLogin');
  const btnMobileRegistro = document.getElementById('btnMobileRegistro');

  if (!btnToggleMenu || !mobileNav) return;

  btnToggleMenu.addEventListener('click', () => {
    const expanded = btnToggleMenu.getAttribute('aria-expanded') === 'true';
    btnToggleMenu.setAttribute('aria-expanded', String(!expanded));
    mobileNav.classList.toggle('hidden');
  });

  if (userMenuToggle && userMenu) {
    userMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const expanded = userMenuToggle.getAttribute('aria-expanded') === 'true';
      userMenuToggle.setAttribute('aria-expanded', String(!expanded));
      userMenu.classList.toggle('hidden');
    });
  }

  if (btnUserMenuLogin) {
    btnUserMenuLogin.addEventListener('click', () => {
      document.getElementById('btnAbrirModalLogin')?.click();
      userMenu?.classList.add('hidden');
      userMenuToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnUserMenuRegistro) {
    btnUserMenuRegistro.addEventListener('click', () => {
      document.getElementById('btnAbrirModalRegistroPadre')?.click();
      userMenu?.classList.add('hidden');
      userMenuToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnMobileLogin) {
    btnMobileLogin.addEventListener('click', () => {
      document.getElementById('btnAbrirModalLogin')?.click();
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnMobileRegistro) {
    btnMobileRegistro.addEventListener('click', () => {
      document.getElementById('btnAbrirModalRegistroPadre')?.click();
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!mobileNav.contains(target) && target !== btnToggleMenu && !btnToggleMenu.contains(target)) {
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    }

    if (userMenu && userMenuToggle && !userMenu.contains(target) && target !== userMenuToggle && !userMenuToggle.contains(target)) {
      userMenu.classList.add('hidden');
      userMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initSectionHighlight() {
  const sectionIds = ['servicios', 'tienda', 'testimonios', 'contacto'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  const mobileNav = document.getElementById('mobileNav');
  const toggleButton = document.getElementById('btnToggleMenu');

  if (!sections.length || !navLinks.length) return;

  const setActiveLink = (activeId) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active-nav-link', link.getAttribute('href') === `#${activeId}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: 0.2 }
  );

  sections.forEach((section) => observer.observe(section));

  const updateActiveSectionOnScroll = () => {
    const offset = window.innerHeight * 0.35;
    const minScroll = 120; // absolute pixel threshold before highlighting the nav
    let activeId = null;

    if (window.scrollY < minScroll) {
      navLinks.forEach((link) => link.classList.remove('active-nav-link'));
      return;
    }

    sections.forEach((section) => {
      const { top, bottom } = section.getBoundingClientRect();
      const isVisible = top <= offset && bottom > offset;
      if (isVisible) {
        activeId = section.id;
      }
    });

    if (activeId) {
      setActiveLink(activeId);
    } else {
      navLinks.forEach((link) => link.classList.remove('active-nav-link'));
    }
  };

  window.addEventListener('scroll', updateActiveSectionOnScroll, { passive: true });
  window.addEventListener('resize', updateActiveSectionOnScroll);
  updateActiveSectionOnScroll();
}

export function initNavigation() {
    initMobileMenu();
    initSectionHighlight();
}