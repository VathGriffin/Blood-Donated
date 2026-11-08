import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nProvider';
import { catalogFor } from './catalog';
import { addCatalog } from './translate';

// Browsers download a language's texts the first time it is picked (load-catalog.js). The page
// must stay on screen while that happens and then switch in one step, never blank in between.

function Page() {
  const { t, setLang } = useI18n();
  return (
    <div data-testid="page">
      <span>{t('nav.donors')}</span>
      <button type="button" onClick={() => setLang('km')}>km</button>
    </div>
  );
}

it('keeps the page visible when switching to a language that still has to be downloaded', async () => {
  addCatalog('km', null); // as in a browser: Khmer not downloaded yet
  let resolveFetch;
  global.fetch = jest.fn(() => new Promise((r) => { resolveFetch = r; }));

  render(<I18nProvider initialLang="en"><Page /></I18nProvider>);
  const page = screen.getByTestId('page');
  // Suspense hides content it has to put on hold with an inline display: none.
  const hidden = [];
  const observer = new MutationObserver(() => { if (page.style.display === 'none') hidden.push(true); });
  observer.observe(page, { attributes: true, attributeFilter: ['style'] });

  fireEvent.click(screen.getByRole('button', { name: 'km' }));
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/i18n\/km\?v=/));
  expect(screen.getByText('Donors')).toBeTruthy(); // still English while downloading

  await act(async () => {
    resolveFetch({ ok: true, json: async () => catalogFor('km') });
    await new Promise((r) => setTimeout(r, 50));
  });
  observer.disconnect();

  expect(screen.getByText('អ្នកបរិច្ចាគ')).toBeTruthy();
  expect(page.style.display).not.toBe('none');
  expect(hidden).toEqual([]);
});
