export function initPortfolio(): void {
  const root = document.querySelector<HTMLElement>('[data-portfolio-root]');
  if (!root) return;

  const rows = [...root.querySelectorAll<HTMLButtonElement>('[data-project-id]')];
  const details = [...root.querySelectorAll<HTMLElement>('[data-project-detail]')];
  const groups = [...root.querySelectorAll<HTMLElement>('[data-project-group]')];
  const filters = [...root.querySelectorAll<HTMLButtonElement>('[data-tier-filter]')];
  const search = root.querySelector<HTMLInputElement>('input[data-project-search]');
  const noResults = root.querySelector<HTMLElement>('[data-no-results]');
  let tier = 'all';

  const selectProject = (id: string): void => {
    rows.forEach((row) => {
      const current = row.dataset.projectId === id;
      row.classList.toggle('current', current);
      row.setAttribute('aria-pressed', String(current));
    });
    details.forEach((detail) => {
      detail.hidden = detail.dataset.projectDetail !== id;
    });
  };

  const applyFilters = (): void => {
    const query = search?.value.trim().toLowerCase() ?? '';
    const visible = rows.filter((row) => {
      const matchesTier = tier === 'all' || row.dataset.projectTier === tier;
      const matchesSearch = !query || row.dataset.projectHaystack?.includes(query);
      row.hidden = !(matchesTier && matchesSearch);
      return !row.hidden;
    });

    groups.forEach((group) => {
      const groupRows = [...group.querySelectorAll<HTMLElement>('[data-project-id]')];
      group.hidden = !groupRows.some((row) => !row.hidden);
    });

    if (noResults) noResults.hidden = visible.length > 0;
    const current = rows.find((row) => row.classList.contains('current'));
    if (!current || current.hidden) {
      const firstId = visible[0]?.dataset.projectId;
      if (firstId) selectProject(firstId);
      else details.forEach((detail) => { detail.hidden = true; });
    }
  };

  rows.forEach((row) => row.addEventListener('click', () => {
    const id = row.dataset.projectId;
    if (!id) return;
    selectProject(id);
    history.replaceState(null, '', '#project-' + id);
  }));

  filters.forEach((filter) => filter.addEventListener('click', () => {
    tier = filter.dataset.tierFilter ?? 'all';
    filters.forEach((item) => item.setAttribute('aria-pressed', String(item === filter)));
    applyFilters();
  }));

  search?.addEventListener('input', applyFilters);

  root.querySelectorAll<HTMLElement>('[data-project-jump]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = link.dataset.projectJump;
      if (!id) return;
      tier = 'all';
      filters.forEach((item) => {
        item.setAttribute('aria-pressed', String(item.dataset.tierFilter === 'all'));
      });
      if (search) search.value = '';
      applyFilters();
      selectProject(id);
      history.replaceState(null, '', '#project-' + id);
      document.querySelector('#project-index')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  });

  const hashId = window.location.hash.replace('#project-', '');
  if (rows.some((row) => row.dataset.projectId === hashId)) selectProject(hashId);
}
