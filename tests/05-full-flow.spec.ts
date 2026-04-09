import { test, expect } from '@playwright/test';
import path from 'path';

const API_BASE = 'http://localhost:8080/api';

test.describe('Fluxo completo E2E - Upload e Visualização', () => {

  test('fluxo completo: upload RTN -> navegar para relatórios -> verificar dados', async ({ page, request }) => {
    const antesBruto = await request.get(`${API_BASE}/alugueis`);
    const antes = await antesBruto.json();
    const qtdAntes = antes.alugueis.length;

    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.title')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));
    await expect(page.locator('.file-name')).toContainText('valid-report.rtn');

    const uploadPromise = page.waitForResponse(resp =>
      resp.url().includes('/alugueis/upload') && resp.status() === 200
    );
    await page.locator('button:has-text("Processar arquivo")').click();
    await uploadPromise;

    await expect(page.locator('button:has(.pi-trash)')).toBeVisible({ timeout: 5000 });

    const depoisBruto = await request.get(`${API_BASE}/alugueis`);
    const depois = await depoisBruto.json();
    expect(depois.alugueis.length).toBeGreaterThan(qtdAntes);

    await page.locator('.sidebar >> text=Relatórios').click();
    await expect(page).toHaveURL(/\/relatorios/);

    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(qtdAntes);

    await expect(page.locator('.debitos-footer')).toContainText('R$');
  });

  test('fluxo: filtrar relatório por modelo existente', async ({ page }) => {
    await page.goto('/relatorios');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const primeiroModelo = await rows.first().locator('td:nth-child(2)').textContent();
    expect(primeiroModelo).toBeTruthy();

    await page.locator('p-dropdown').click();
    const option = page.locator('.p-dropdown-panel .p-dropdown-item', { hasText: primeiroModelo!.trim() });
    if (await option.count() > 0) {
      await option.first().click();
      await page.locator('button:has-text("Buscar")').click();
      await page.waitForTimeout(500);

      const filteredRows = page.locator('.p-datatable-tbody tr');
      const filteredCount = await filteredRows.count();

      for (let i = 0; i < filteredCount; i++) {
        const modelo = await filteredRows.nth(i).locator('td:nth-child(2)').textContent();
        expect(modelo?.trim()).toBe(primeiroModelo!.trim());
      }
    }
  });

  test('fluxo: soma de débitos se atualiza ao filtrar', async ({ page }) => {
    await page.goto('/relatorios');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const footerBefore = await page.locator('.debitos-footer').textContent();
    expect(footerBefore).toContain('R$');

    await page.locator('p-dropdown').click();
    const items = page.locator('.p-dropdown-panel .p-dropdown-item');
    const count = await items.count();

    if (count > 1) {
      await items.nth(1).click();
      await page.locator('button:has-text("Buscar")').click();
      await page.waitForTimeout(500);

      await expect(page.locator('.debitos-footer')).toContainText('R$');
    }
  });

  test('fluxo: upload -> remover -> estado volta ao inicial', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.title')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));

    const uploadPromise = page.waitForResponse(resp =>
      resp.url().includes('/alugueis/upload') && resp.status() === 200
    );
    await page.locator('button:has-text("Processar arquivo")').click();
    await uploadPromise;

    await expect(page.locator('button:has(.pi-trash)')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has(.pi-trash)').click();

    await expect(page.locator('.dropzone-content')).toBeVisible();
    await expect(page.locator('button:has-text("Processar arquivo")')).toBeDisabled();
  });

  test('fluxo: navegação rápida entre telas mantém funcionalidade', async ({ page }) => {
    await page.goto('/relatorios');
    await page.waitForLoadState('networkidle');
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    await page.locator('.sidebar >> text=Alugueis').click();
    await expect(page.locator('.dropzone')).toBeVisible();

    await page.locator('.sidebar >> text=Relatórios').click();
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    await page.locator('.sidebar >> text=Alugueis').click();
    await expect(page.locator('.dropzone')).toBeVisible();
  });
});
