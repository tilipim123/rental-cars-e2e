import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Tela Aluguéis - Upload de arquivo RTN', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/alugueis');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.title')).toBeVisible();
  });

  test('deve exibir título e subtítulo', async ({ page }) => {
    await expect(page.locator('h2.title')).toHaveText('Alugueis');
    await expect(page.locator('.subtitle')).toContainText('Preencha o filtro');
  });

  test('deve exibir seção de upload com dropzone', async ({ page }) => {
    await expect(page.locator('text=Upload de arquivos')).toBeVisible();
    await expect(page.locator('.dropzone')).toBeVisible();
    await expect(page.locator('.upload-label')).toContainText('Selecione ou arraste um arquivo');
    await expect(page.locator('text=Tipo: RTN')).toBeVisible();
    await expect(page.locator('text=10MB')).toBeVisible();
  });

  test('deve exibir botão Selecionar', async ({ page }) => {
    await expect(page.locator('button:has-text("Selecionar")')).toBeVisible();
  });

  test('botão Processar arquivo deve estar desabilitado sem arquivo', async ({ page }) => {
    const processBtn = page.locator('button:has-text("Processar arquivo")');
    await expect(processBtn).toBeVisible();
    await expect(processBtn).toBeDisabled();
  });

  test('deve aceitar arquivo .rtn via input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));

    await expect(page.locator('.file-name')).toContainText('valid-report.rtn');
    await expect(page.locator('.file-size')).toBeVisible();

    const processBtn = page.locator('button:has-text("Processar arquivo")');
    await expect(processBtn).toBeEnabled();
  });

  test('deve processar arquivo RTN com sucesso e exibir botão trash', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));

    const uploadPromise = page.waitForResponse(resp =>
      resp.url().includes('/alugueis/upload') && resp.status() === 200
    );

    await page.locator('button:has-text("Processar arquivo")').click();
    await uploadPromise;

    const trashBtn = page.locator('button:has(.pi-trash)');
    await expect(trashBtn).toBeVisible({ timeout: 5000 });
  });

  test('deve remover arquivo ao clicar no botão de trash', async ({ page }) => {
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
    await expect(page.locator('.upload-label')).toContainText('Selecione ou arraste');
    await expect(page.locator('button:has-text("Processar arquivo")')).toBeDisabled();
  });

  test('deve exibir nome e tamanho do arquivo selecionado', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));

    await expect(page.locator('.file-name')).toHaveText('valid-report.rtn');
    await expect(page.locator('.file-size')).toBeVisible();
  });

  test('após processar, a resposta do backend deve conter registros criados', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/valid-report.rtn'));

    const uploadPromise = page.waitForResponse(resp =>
      resp.url().includes('/alugueis/upload') && resp.status() === 200
    );

    await page.locator('button:has-text("Processar arquivo")').click();
    const response = await uploadPromise;
    const body = await response.json();

    expect(body.mensagem).toContain('sucesso');
    expect(body.registrosCriados).toBeGreaterThanOrEqual(0);
  });
});
