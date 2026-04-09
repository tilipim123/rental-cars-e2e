import { test, expect } from '@playwright/test';

test.describe('Navegação e Layout', () => {

  test('deve carregar a aplicação na rota raiz', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/alugueis/);
  });

  test('deve exibir o header com LOGO, avatar e link Sair', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('.layout-topbar');
    await expect(header).toBeVisible();
    await expect(header.locator('text=LOGO')).toBeVisible();
    await expect(header.locator('p-avatar')).toBeVisible();
    await expect(header.locator('a.sair-link')).toBeVisible();
    await expect(header.locator('a.sair-link')).toHaveText('Sair');
  });

  test('deve exibir o menu lateral com itens Alugueis e Relatórios', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.sidebar >> text=Alugueis')).toBeVisible();
    await expect(page.locator('.sidebar >> text=Relatórios')).toBeVisible();
  });

  test('deve exibir ícones corretos no menu', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.sidebar .fa-car')).toBeVisible();
    await expect(page.locator('.sidebar .fa-file-text')).toBeVisible();
  });

  test('deve navegar para Relatórios ao clicar no menu', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await page.locator('.sidebar >> text=Relatórios').click();
    await expect(page).toHaveURL(/\/relatorios/);
    await expect(page.locator('h2.title >> text=Relatórios')).toBeVisible();
  });

  test('deve navegar para Alugueis ao clicar no menu', async ({ page }) => {
    await page.goto('/relatorios');
    await page.waitForLoadState('networkidle');
    await page.locator('.sidebar >> text=Alugueis').click();
    await expect(page).toHaveURL(/\/alugueis/);
    await expect(page.locator('h2.title >> text=Alugueis')).toBeVisible();
  });

  test('deve exibir breadcrumb ALUGUEIS na página de aluguéis', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('p-breadcrumb')).toContainText('ALUGUEIS');
  });

  test('deve exibir breadcrumb RELATÓRIOS na página de relatórios', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await page.locator('.sidebar >> text=Relatórios').click();
    await expect(page).toHaveURL(/\/relatorios/);
    await expect(page.locator('p-breadcrumb')).toContainText('RELATÓRIOS');
  });

  test('deve exibir o footer com Rental Cars', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('app-footer')).toBeVisible();
    await expect(page.locator('app-footer')).toContainText('Rental Cars');
  });

  test('deve ser possível fechar e abrir o menu lateral', async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.sidebar')).toBeVisible();

    await page.locator('.sidebar button:has(.pi-times)').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.sidebar button:has(.pi-bars)')).toBeVisible();
  });
});
