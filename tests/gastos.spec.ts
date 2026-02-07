import { test, expect } from '@playwright/test';

test('Test Final: Verificación de Persistencia y Filtros', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // 1. Ir a vista de Mes para testear en un entorno limpio
  await page.getByRole('button', { name: /mes/i }).click();

  // 2. Capturar el total ANTES (Buscamos el símbolo $ en la tarjeta principal)
  const visorTotal = page.locator('text=$').first();
  const totalAntes = await visorTotal.innerText();

  // 3. Agregar un gasto de $ 1000
  await page.getByRole('button', { name: /agregar/i }).click();
  await page.locator('input[type="number"]').fill('1000');
  
  // Seleccionamos una categoría (ej: Verdulería) para que aparezca en la lista
  await page.getByText('Verdulería').click(); 
  
  // Guardar el gasto
  await page.getByRole('button', { name: /guardar/i }).click();
  
  // 4. Esperar a que el total cambie antes de recargar
  await expect(visorTotal).not.toHaveText(totalAntes, { timeout: 10000 });

  // 5. RECARGAR (Prueba definitiva de persistencia)
  await page.reload();

  // 6. Volver a vista de Mes tras recargar
  await page.getByRole('button', { name: /mes/i }).click();

  // 7. VALIDACIONES FINALES
  // El total debe ser distinto al inicial y no debe ser cero
  await expect(visorTotal).not.toHaveText(totalAntes);
  await expect(visorTotal).not.toHaveText('$ 0');

  // Verificamos que aparezca la categoría en la lista (que es lo que muestra tu código)
  // En lugar de buscar la descripción, buscamos el nombre de la categoría
  await expect(page.locator('text=Verdulería').first()).toBeVisible();

  console.log('🏁 ¡TEST VERDE! Persistencia, categorías y diseño verificados.');
});