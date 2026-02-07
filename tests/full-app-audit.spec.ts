import { test, expect } from '@playwright/test';

test.describe('Auditoría Final del Robot - Seguridad y Flujo', () => {

  // TEST 1: Verificar que el botón se bloquea si no hay monto
  test('No debería permitir guardar si el monto es inválido', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Abrir formulario
    await page.getByRole('button', { name: /agregar gasto/i }).click();

    const botonGuardar = page.getByRole('button', { name: /guardar/i });

    // 1. Verificar que arranca deshabilitado (Monto vacío)
    await expect(botonGuardar).toBeDisabled();

    // 2. Probar con monto cero (Debería seguir deshabilitado)
    const input = page.getByRole('spinbutton');
    await input.fill('0');
    await expect(botonGuardar).toBeDisabled();

    // 3. Probar con monto válido (Debería habilitarse)
    await input.fill('500');
    await expect(botonGuardar).toBeEnabled();
    
    console.log('✅ Validación de botón: OK');
  });

  // TEST 2: El flujo completo que ya teníamos (el de éxito)
  test('Debería completar el ciclo completo: Cargar, Guardar y Verificar', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Manejo de alertas para limpiar
    page.on('dialog', d => d.accept());
    const btnVaciar = page.getByTitle(/vaciar/i);
    if (await btnVaciar.isVisible()) {
      await btnVaciar.click();
      await page.waitForTimeout(1000);
    }

    // Cargar gasto de 5000
    await page.getByRole('button', { name: /agregar gasto/i }).click();
    const input = page.getByRole('spinbutton');
    await input.fill('5000');
    await page.getByRole('button', { name: /verduler/i }).click();

    // Guardar
    const btnGuardar = page.getByRole('button', { name: /guardar/i });
    await page.waitForTimeout(800); 
    await btnGuardar.click();

    // Verificaciones
    await expect(input).toBeHidden({ timeout: 10000 });
    
    // Esperar a que el total se actualice en pantalla
    await page.waitForTimeout(2000);
    const montoEnPantalla = page.locator('text=/5\.000/').first();
    await expect(montoEnPantalla).toBeVisible({ timeout: 15000 });

    // Descargar reporte
    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle(/descargar/i).click();
    await downloadPromise;
    
    console.log('✅ Flujo completo y descarga: OK');
  });

});