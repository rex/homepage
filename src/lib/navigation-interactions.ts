export function initNavigation(): void {
  const nav = document.querySelector<HTMLElement>('[data-site-index]');
  if (!nav) return;

  const menu = nav.querySelector<HTMLDetailsElement>('details');
  const mobile = window.matchMedia('(max-width: 767px)');
  const shortcutPrefix = nav.dataset.shortcutPrefix ?? 'g';
  let armed = false;
  let timer = 0;

  const syncDisclosure = (isMobile: boolean): void => {
    if (isMobile) menu?.removeAttribute('open');
    else menu?.setAttribute('open', '');
  };

  syncDisclosure(mobile.matches);
  mobile.addEventListener('change', (event) => syncDisclosure(event.matches));

  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [contenteditable]')) return;

    if (!armed && event.key.toLowerCase() === shortcutPrefix) {
      armed = true;
      menu?.setAttribute('open', '');
      nav.classList.add('site-index--armed');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        armed = false;
        nav.classList.remove('site-index--armed');
      }, 1200);
      return;
    }

    if (!armed) return;
    armed = false;
    nav.classList.remove('site-index--armed');
    window.clearTimeout(timer);

    const link = nav.querySelector<HTMLAnchorElement>('[data-shortcut="' + event.key.toLowerCase() + '"]');
    if (link) {
      event.preventDefault();
      window.location.assign(link.href);
    }
  });
}
