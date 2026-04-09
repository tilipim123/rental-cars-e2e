import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';

test.describe('Backend API - Endpoints diretos', () => {

  test('GET /carros deve retornar lista de 11 carros', async ({ request }) => {
    const response = await request.get(`${API_BASE}/carros`);
    expect(response.status()).toBe(200);

    const carros = await response.json();
    expect(carros).toHaveLength(11);

    const primeiro = carros[0];
    expect(primeiro).toHaveProperty('id');
    expect(primeiro).toHaveProperty('modelo');
    expect(primeiro).toHaveProperty('ano');
    expect(primeiro).toHaveProperty('qtdPassageiros');
    expect(primeiro).toHaveProperty('km');
    expect(primeiro).toHaveProperty('fabricante');
    expect(primeiro).toHaveProperty('vlrDiaria');
  });

  test('GET /carros deve conter modelos esperados do seed', async ({ request }) => {
    const response = await request.get(`${API_BASE}/carros`);
    const carros = await response.json();

    const modelos = carros.map((c: any) => c.modelo);
    expect(modelos).toContain('GOL');
    expect(modelos).toContain('POLO');
    expect(modelos).toContain('JETTA');
    expect(modelos).toContain('COROLLA');
    expect(modelos).toContain('RAV4');
    expect(modelos).toContain('FOCUS');
    expect(modelos).toContain('UNO');
    expect(modelos).toContain('MOBI');
    expect(modelos).toContain('ARGO');
  });

  test('GET /carros deve retornar fabricantes corretos', async ({ request }) => {
    const response = await request.get(`${API_BASE}/carros`);
    const carros = await response.json();

    const fabricantes = [...new Set(carros.map((c: any) => c.fabricante))];
    expect(fabricantes).toContain('Volkswagen');
    expect(fabricantes).toContain('Toyota');
    expect(fabricantes).toContain('Ford');
    expect(fabricantes).toContain('Fiat');
  });

  test('GET /alugueis deve retornar estrutura correta', async ({ request }) => {
    const response = await request.get(`${API_BASE}/alugueis`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('alugueis');
    expect(data).toHaveProperty('valorTotalNaoPago');
    expect(Array.isArray(data.alugueis)).toBe(true);
    expect(typeof data.valorTotalNaoPago).toBe('number');
  });

  test('GET /alugueis items devem ter todos os campos formatados', async ({ request }) => {
    const response = await request.get(`${API_BASE}/alugueis`);
    const data = await response.json();

    expect(data.alugueis.length).toBeGreaterThan(0);

    for (const aluguel of data.alugueis) {
      expect(aluguel).toHaveProperty('dataAluguel');
      expect(aluguel).toHaveProperty('modeloCarro');
      expect(aluguel).toHaveProperty('kmCarro');
      expect(aluguel).toHaveProperty('nomeCliente');
      expect(aluguel).toHaveProperty('telefoneCliente');
      expect(aluguel).toHaveProperty('dataDevolucao');
      expect(aluguel).toHaveProperty('valor');
      expect(aluguel).toHaveProperty('pago');

      expect(aluguel.dataAluguel).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(aluguel.dataDevolucao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(aluguel.telefoneCliente).toMatch(/^\+55\(\d{2}\)\d{4,5}-\d{4}$/);
      expect(['SIM', 'NAO']).toContain(aluguel.pago);
      expect(aluguel.valor).toBeGreaterThan(0);
    }
  });

  test('GET /alugueis valorTotalNaoPago deve ser a soma dos não pagos', async ({ request }) => {
    const response = await request.get(`${API_BASE}/alugueis`);
    const data = await response.json();

    const somaManual = data.alugueis
      .filter((a: any) => a.pago === 'NAO')
      .reduce((sum: number, a: any) => sum + a.valor, 0);

    expect(data.valorTotalNaoPago).toBeCloseTo(somaManual, 1);
  });

  test('GET /alugueis deve estar ordenado por data decrescente', async ({ request }) => {
    const response = await request.get(`${API_BASE}/alugueis`);
    const data = await response.json();

    const datas = data.alugueis.map((a: any) => {
      const [d, m, y] = a.dataAluguel.split('/');
      return new Date(`${y}-${m}-${d}`).getTime();
    });

    for (let i = 0; i < datas.length - 1; i++) {
      expect(datas[i]).toBeGreaterThanOrEqual(datas[i + 1]);
    }
  });

  test('POST /alugueis/upload deve rejeitar arquivo vazio', async ({ request }) => {
    const response = await request.post(`${API_BASE}/alugueis/upload`, {
      multipart: {
        arquivo: {
          name: 'empty.rtn',
          mimeType: 'text/plain',
          buffer: Buffer.from(''),
        },
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.mensagem).toContain('vazio');
  });

  test('POST /alugueis/upload deve rejeitar extensão inválida', async ({ request }) => {
    const response = await request.post(`${API_BASE}/alugueis/upload`, {
      multipart: {
        arquivo: {
          name: 'data.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('some content'),
        },
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.mensagem).toContain('.rtn');
  });

  test('POST /alugueis/upload deve processar arquivo RTN válido', async ({ request }) => {
    const rtnContent = '01042024020120240205\n';
    const response = await request.post(`${API_BASE}/alugueis/upload`, {
      multipart: {
        arquivo: {
          name: 'report.rtn',
          mimeType: 'text/plain',
          buffer: Buffer.from(rtnContent),
        },
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mensagem).toContain('sucesso');
    expect(body.registrosCriados).toBeGreaterThanOrEqual(1);
  });

  test('POST /alugueis/upload com carro inexistente retorna 0 registros', async ({ request }) => {
    const rtnContent = '99012024020120240205\n';
    const response = await request.post(`${API_BASE}/alugueis/upload`, {
      multipart: {
        arquivo: {
          name: 'invalid-car.rtn',
          mimeType: 'text/plain',
          buffer: Buffer.from(rtnContent),
        },
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.registrosCriados).toBe(0);
  });

  test('POST /alugueis/upload com cliente inexistente retorna 0 registros', async ({ request }) => {
    const rtnContent = '01992024020120240205\n';
    const response = await request.post(`${API_BASE}/alugueis/upload`, {
      multipart: {
        arquivo: {
          name: 'invalid-client.rtn',
          mimeType: 'text/plain',
          buffer: Buffer.from(rtnContent),
        },
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.registrosCriados).toBe(0);
  });

  test('CORS deve permitir requisições do frontend', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/carros`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4200',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  test('Swagger UI deve estar acessível', async ({ request }) => {
    const response = await request.get(`${API_BASE}/swagger-ui/index.html`);
    expect(response.status()).toBe(200);
  });

  test('OpenAPI spec deve documentar todos os endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v3/api-docs`);
    expect(response.status()).toBe(200);
    const spec = await response.json();
    const paths = Object.keys(spec.paths);
    expect(paths).toContain('/carros');
    expect(paths).toContain('/alugueis');
    expect(paths).toContain('/alugueis/upload');
  });
});
