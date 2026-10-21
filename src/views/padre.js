import { renderPadreTienda } from './padre/tienda.js';
import { renderPadreFavoritos } from './padre/favoritos.js';
import { renderPadreHistorial } from './padre/historial.js';
import { renderPadreResumen } from './padre/resumen.js';

export async function renderPadreTab(activeTab, userData, openPerfilBebeModal, switchTab) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const nidoId = userData?.nidoId;

  if (activeTab === 'resumen') {
    await renderPadreResumen(dashboardContent, userData, nidoId, openPerfilBebeModal, switchTab);
  } else if (activeTab === 'historial_bebe') {
    await renderPadreHistorial(dashboardContent, nidoId);

  } else if (activeTab === 'tienda') {
    await renderPadreTienda(dashboardContent);

  } else if (activeTab === 'favoritos') {
    await renderPadreFavoritos(dashboardContent);
  }
}