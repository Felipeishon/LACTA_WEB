import { fetchAllTips, createTip } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { auth } from '../firebase.js';
import { showToast } from '../ui/notifications.js';

let allTips = [];
let currentTipIndex = 0;
let currentUser = null;

function renderCarousel(filteredTips) {
    const carouselContent = document.getElementById('tips-carousel-content');
    const tipCounter = document.getElementById('tip-counter');
    const searchContainer = document.getElementById('tip-search-container');

    if (!carouselContent || !tipCounter || !searchContainer) return;

    if (!currentUser) {
        // Usuario no registrado: mostrar un tip aleatorio y ocultar controles
        const randomIndex = Math.floor(Math.random() * allTips.length);
        const randomTip = allTips[randomIndex];
        carouselContent.innerHTML = `
            <div class="p-4 text-center">
                <h3 class="font-bold text-lg text-[#181411] mb-2">${escapeHTML(randomTip.titulo)}</h3>
                <p class="text-sm text-gray-600">${escapeHTML(randomTip.contenido)}</p>
            </div>
            <div class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-sm text-amber-800">
                <p><strong>¿Quieres más consejos?</strong> <a href="registro.html" class="font-bold underline">Regístrate gratis</a> para acceder a todos nuestros tips y buscar por tema.</p>
            </div>
        `;
        tipCounter.textContent = '';
        document.getElementById('btn-tip-prev').style.display = 'none';
        document.getElementById('btn-tip-next').style.display = 'none';
        searchContainer.style.display = 'none';
    } else {
        // Usuario registrado: mostrar carrusel completo
        if (filteredTips.length === 0) {
            carouselContent.innerHTML = `<p class="p-4 text-center text-gray-500">No se encontraron tips con esa palabra clave.</p>`;
            tipCounter.textContent = '0 / 0';
            return;
        }

        const tip = filteredTips[currentTipIndex];
        carouselContent.innerHTML = `
            <div class="p-4 text-center">
                <h3 class="font-bold text-lg text-[#181411] mb-2">${escapeHTML(tip.titulo)}</h3>
                <p class="text-sm text-gray-600">${escapeHTML(tip.contenido)}</p>
            </div>
        `;
        tipCounter.textContent = `${currentTipIndex + 1} / ${filteredTips.length}`;
        document.getElementById('btn-tip-prev').style.display = 'block';
        document.getElementById('btn-tip-next').style.display = 'block';
        searchContainer.style.display = 'block';
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allTips.filter(tip =>
        tip.titulo.toLowerCase().includes(searchTerm) ||
        tip.contenido.toLowerCase().includes(searchTerm)
    );
    currentTipIndex = 0;
    renderCarousel(filtered);

    // Re-asignar listeners a los botones para que operen sobre la lista filtrada
    document.getElementById('btn-tip-prev').onclick = () => {
        currentTipIndex = (currentTipIndex - 1 + filtered.length) % filtered.length;
        renderCarousel(filtered);
    };
    document.getElementById('btn-tip-next').onclick = () => {
        currentTipIndex = (currentTipIndex + 1) % filtered.length;
        renderCarousel(filtered);
    };
}

export function initTipsModal() {
    const modal = document.getElementById('modalTipsLactancia');
    const openBtn = document.getElementById('btnDescubreComo');
    const closeBtn = document.getElementById('btnCerrarTips');

    if (!modal || !openBtn || !closeBtn) return;

    const openModalHandler = async (e) => {
        e.preventDefault();
        currentUser = auth.currentUser; // Obtener estado de auth actual directamente

        // Mostrar modal con spinner mientras se cargan los datos
        modal.showModal();
        document.getElementById('tips-carousel-content').innerHTML = `<p class="p-8 text-center text-gray-500">Cargando tips...</p>`;

        try {
            allTips = await fetchAllTips();
            if (allTips.length === 0) {
                document.getElementById('tips-carousel-content').innerHTML = `<p class="p-8 text-center text-gray-500">Aún no hay tips disponibles.</p>`;
                return;
            }
            currentTipIndex = 0;
            renderCarousel(allTips);
        } catch (error) {
            console.error("Error al cargar los tips:", error);
            document.getElementById('tips-carousel-content').innerHTML = `<p class="p-8 text-center text-red-500">No se pudieron cargar los tips.</p>`;
        }
    };

    openBtn.addEventListener('click', openModalHandler);

    closeBtn.onclick = () => modal.close();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
        }
    });

    // Listeners de navegación y búsqueda (inicializados para la lista completa)
    const prevBtn = document.getElementById('btn-tip-prev');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentTipIndex = (currentTipIndex - 1 + allTips.length) % allTips.length;
            renderCarousel(allTips);
        });
    }

    const nextBtn = document.getElementById('btn-tip-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentTipIndex = (currentTipIndex + 1) % allTips.length;
            renderCarousel(allTips);
        });
    }
    
    const searchInput = document.getElementById('tip-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

export async function renderCreatorTipsManagement(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<p class="text-center text-gray-500">Cargando tips existentes...</p>`;

    try {
        const tips = await fetchAllTips();
        let tipsHtml = '<p class="text-center text-gray-500">Aún no hay tips creados.</p>';

        if (tips.length > 0) {
            tipsHtml = tips.map(tip => `
                <div class="p-3 bg-gray-50 border rounded-md">
                    <p class="font-bold text-sm">${escapeHTML(tip.titulo)}</p>
                    <p class="text-xs text-gray-600">${escapeHTML(tip.contenido)}</p>
                </div>
            `).join('');
        }

        container.innerHTML = `
            <h4 class="font-bold text-lg mb-2">Añadir Nuevo Tip</h4>
            <form id="formAddTip" class="space-y-3 mb-6">
                <input type="text" name="titulo" placeholder="Título del tip" required class="w-full p-2 border rounded-md text-sm">
                <textarea name="contenido" placeholder="Contenido del tip..." required class="w-full p-2 border rounded-md text-sm" rows="3"></textarea>
                <button type="submit" class="w-full bg-[#181411] text-white font-bold py-2 rounded-md hover:bg-[#e87a30] transition-colors">Guardar Tip</button>
            </form>
            <hr class="my-6">
            <h4 class="font-bold text-lg mb-4">Tips Existentes (para evitar duplicados)</h4>
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
                ${tipsHtml}
            </div>
        `;

        const form = document.getElementById('formAddTip');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Guardando...';

                const tipData = {
                    titulo: form.titulo.value,
                    contenido: form.contenido.value,
                    autorId: auth.currentUser.uid
                };

                try {
                    await createTip(tipData);
                    showToast('Tip guardado con éxito.', 'success');
                    await renderCreatorTipsManagement(containerId); // Recargar la vista
                } catch (error) {
                    showToast('Error al guardar el tip.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Guardar Tip';
                }
            });
        }
    } catch (error) {
        console.error("Error al renderizar gestión de tips:", error);
        container.innerHTML = `<p class="text-center text-red-500">Error al cargar la sección de tips.</p>`;
    }
}