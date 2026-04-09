import { test, expect } from '@playwright/test';

test.describe('Tela Relatórios - Listagem e Filtros', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/relatorios');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.title')).toBeVisible();
  });

  test('deve exibir título e subtítulo', async ({ page }) => {
    await expect(page.locator('h2.title')).toHaveText('Relatórios');
    await expect(page.locator('.subtitle')).toContainText('Preencha o filtro');
  });

  test('deve exibir barra de filtros com data, modelo e botão buscar', async ({ page }) => {
    await expect(page.locator('.filter-bar')).toBeVisible();
    await expect(page.locator('text=Data do aluguel')).toBeVisible();
    await expect(page.locator('text=Modelo do carro')).toBeVisible();
    await expect(page.locator('p-calendar')).toBeVisible();
    await expect(page.locator('p-dropdown')).toBeVisible();
    await expect(page.locator('button:has-text("Buscar")')).toBeVisible();
  });

  test('deve exibir tabela com cabeçalhos corretos', async ({ page }) => {
    const headers = ['DATA', 'MODELO', 'KM', 'CLIENTE', 'TELEFONE', 'DEVOLUÇÃO', 'PAGO', 'VALOR'];

    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('deve carregar dados dos aluguéis na tabela', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir datas no formato dd/MM/yyyy', async ({ page }) => {
    const firstRow = page.locator('.p-datatable-tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    const dateCell = firstRow.locator('td').first();
    const dateText = await dateCell.textContent();
    expect(dateText?.trim()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  test('deve exibir KM formatado com separador de milhar', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const allKmCells = rows.locator('td:nth-child(3)');
    const count = await allKmCells.count();

    for (let i = 0; i < count; i++) {
      const text = await allKmCells.nth(i).textContent();
      expect(text?.trim()).toMatch(/^[\d.]+$/);
    }
  });

  test('deve exibir telefone formatado (XX) XXXXX-XXXX', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const allPhoneCells = rows.locator('td:nth-child(5)');
    const count = await allPhoneCells.count();

    for (let i = 0; i < count; i++) {
      const text = await allPhoneCells.nth(i).textContent();
      expect(text?.trim()).toMatch(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/);
    }
  });

  test('deve exibir valor formatado em R$', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const allValorCells = rows.locator('td:nth-child(8)');
    const count = await allValorCells.count();

    for (let i = 0; i < count; i++) {
      const text = await allValorCells.nth(i).textContent();
      expect(text?.trim()).toMatch(/^R\$\s?[\d.,]+$/);
    }
  });

  test('deve exibir tag SIM/NÃO para status de pagamento', async ({ page }) => {
    const tags = page.locator('.p-datatable-tbody .p-tag');
    await expect(tags.first()).toBeVisible({ timeout: 10000 });

    const count = await tags.count();
    for (let i = 0; i < count; i++) {
      const text = await tags.nth(i).textContent();
      expect(['SIM', 'NÃO']).toContain(text?.trim());
    }
  });

  test('tag SIM deve ser verde e NÃO deve ser vermelha', async ({ page }) => {
    const tags = page.locator('.p-datatable-tbody .p-tag');
    await expect(tags.first()).toBeVisible({ timeout: 10000 });

    const count = await tags.count();
    for (let i = 0; i < count; i++) {
      const tag = tags.nth(i);
      const text = await tag.textContent();
      const classes = await tag.getAttribute('class') || '';

      if (text?.trim() === 'SIM') {
        expect(classes).toContain('success');
      } else if (text?.trim() === 'NÃO') {
        expect(classes).toContain('danger');
      }
    }
  });

  test('deve exibir soma de débitos no footer da tabela', async ({ page }) => {
    const footer = page.locator('.debitos-footer');
    await expect(footer).toBeVisible({ timeout: 10000 });
    await expect(footer).toContainText('Soma de débitos');
    await expect(footer).toContainText('R$');
  });

  test('dropdown de modelo deve abrir e mostrar opções', async ({ page }) => {
    await page.locator('p-dropdown').click();
    const panel = page.locator('.p-dropdown-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.p-dropdown-item').first()).toBeVisible();
  });

  test('filtro por modelo deve reduzir linhas da tabela', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const totalAntes = await rows.count();

    await page.locator('p-dropdown').click();
    const items = page.locator('.p-dropdown-panel .p-dropdown-item');
    const itemCount = await items.count();

    if (itemCount > 1) {
      await items.nth(1).click();
      await page.locator('button:has-text("Buscar")').click();
      await page.waitForTimeout(500);

      const totalDepois = await rows.count();
      expect(totalDepois).toBeLessThanOrEqual(totalAntes);
    }
  });

  test('colunas devem ser ordenáveis ao clicar no header', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const modeloHeader = page.locator('th:has-text("MODELO")');
    await modeloHeader.click();
    await page.waitForTimeout(300);

    const sortIcon = modeloHeader.locator('.p-sortable-column-icon');
    await expect(sortIcon).toBeVisible();
  });
});
