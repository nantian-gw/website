const navbar = document.getElementById('landing-navbar');
const menuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const menuIconOpen = document.getElementById('menu-icon-open');
const menuIconClose = document.getElementById('menu-icon-close');

if (
  navbar instanceof HTMLElement &&
  menuToggle instanceof HTMLButtonElement &&
  mobileMenu instanceof HTMLElement &&
  menuIconOpen instanceof SVGElement &&
  menuIconClose instanceof SVGElement
) {
  const mobileNavLinks = mobileMenu.querySelectorAll<HTMLAnchorElement>('.mobile-nav-link');
  let isMenuOpen = false;

  const updateNavbarScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  };

  const openMenu = () => {
    isMenuOpen = true;
    mobileMenu.classList.add('open');
    menuIconOpen.classList.add('hidden');
    menuIconClose.classList.remove('hidden');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    isMenuOpen = false;
    mobileMenu.classList.remove('open');
    menuIconOpen.classList.remove('hidden');
    menuIconClose.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  updateNavbarScroll();
  window.addEventListener('scroll', updateNavbarScroll, { passive: true });

  menuToggle.addEventListener('click', () => {
    if (isMenuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isMenuOpen) {
      return;
    }

    closeMenu();
    menuToggle.focus();
  });
}
