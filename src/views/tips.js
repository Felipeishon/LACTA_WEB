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
        // Usuario no registrado: mostrar un tip aleatorio sin autor y ocultar controles
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
        // Usuario registrado: mostrar carrusel completo incluyendo el autor
        if (filteredTips.length === 0) {
            carouselContent.innerHTML = `<p class="p-4 text-center text-gray-500">No se encontraron tips con esa palabra clave.</p>`;
            tipCounter.textContent = '0 / 0';
            return;
        }

        const tip = filteredTips[currentTipIndex];
        carouselContent.innerHTML = `
            <div class="p-4 text-center">
                <h3 class="font-bold text-lg text-[#181411] mb-2">${escapeHTML(tip.titulo)}</h3>
                <p class="text-sm text-gray-600 mb-3">${escapeHTML(tip.contenido)}</p>
                <p class="text-xs text-gray-400 italic">Por: ${escapeHTML(tip.autorNombre || 'Especialista LactaNido')}</p>
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
            allTips = (await fetchAllTips()).filter(tip => tip.estado === 'aprobado');
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

export async function renderCreatorTipsManagement(containerId, currentUserData = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<p class="text-center text-gray-500">Cargando tips existentes...</p>`;

    try {
        const tips = await fetchAllTips();
        const currentUid = auth.currentUser?.uid;

        let tipsHtml = '<p class="text-center text-gray-500">Aún no hay tips creados.</p>';

        if (tips.length > 0) {
            tipsHtml = tips.map(tip => {
                const isOwner = tip.autorId === currentUid;
                const isPending = tip.estado === 'pendiente';
                
                let badge = '';
                if (isPending) {
                    if (isOwner) {
                        badge = '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">⏳ Tu tip está Pendiente de aprobación</span>';
                    } else {
                        badge = '<span class="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">🔒 Pendiente (Otra autora)</span>';
                    }
                } else {
                    badge = '<span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">✅ Aprobado</span>';
                }

                return `
                    <div class="p-3 bg-gray-50 border rounded-md flex flex-col gap-1">
                        <div class="flex justify-between items-center">
                            <p class="font-bold text-sm">${escapeHTML(tip.titulo)}</p>
                            ${badge}
                        </div>
                        <p class="text-xs text-gray-600">${escapeHTML(tip.contenido)}</p>
                        <p class="text-[11px] text-gray-400 italic">Por: ${escapeHTML(tip.autorNombre || 'Anónimo')}</p>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = `
            <h2 class="text-2xl font-black text-[#181411] mb-6">Tips</h2>
            <h4 class="font-bold text-lg mb-2">Añadir Nuevo Tip</h4>
            <form id="formAddTip" class="space-y-3 mb-6 relative">
                <div class="relative">
                    <input type="text" id="inputTituloTip" name="titulo" placeholder="Título del tip" required class="w-full p-2 border rounded-md text-sm" autocomplete="off">
                    <!-- Contenedor para sugerencias de duplicados -->
                    <div id="suggestions-container" class="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto z-10 hidden"></div>
                </div>
                <textarea name="contenido" placeholder="Contenido del tip..." required class="w-full p-2 border rounded-md text-sm" rows="3"></textarea>
                <button type="submit" class="w-full bg-[#181411] text-white font-bold py-2 rounded-md hover:bg-[#e87a30] transition-colors">Guardar Tip</button>
            </form>
            <hr class="my-6">
            <h4 class="font-bold text-lg mb-4">Tips Existentes (para evitar duplicados)</h4>
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
                ${tipsHtml}
            </div>
        `;

        // Lógica de Autocompletado / Búsqueda en tiempo real para prevenir duplicados
        const titleInput = document.getElementById('inputTituloTip');
        const suggestionsBox = document.getElementById('suggestions-container');

        if (titleInput && suggestionsBox) {
            titleInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (query.length < 2) {
                    suggestionsBox.classList.add('hidden');
                    suggestionsBox.innerHTML = '';
                    return;
                }

                const matches = tips.filter(t => t.titulo.toLowerCase().includes(query));
                if (matches.length > 0) {
                    suggestionsBox.innerHTML = matches.map(m => `
                        <div class="p-2 hover:bg-gray-100 text-xs cursor-pointer border-b border-gray-100">
                            <span class="font-bold text-[#181411]">${escapeHTML(m.titulo)}</span>
                            <span class="text-gray-400 block">(${m.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'})</span>
                        </div>
                    `).join('');
                    suggestionsBox.classList.remove('hidden');

                    // Permitir hacer clic en una sugerencia para rellenar o alertar
                    suggestionsBox.querySelectorAll('div').forEach((el, index) => {
                        el.onclick = () => {
                            titleInput.value = matches[index].titulo;
                            suggestionsBox.classList.add('hidden');
                        };
                    });
                } else {
                    suggestionsBox.classList.add('hidden');
                    suggestionsBox.innerHTML = '';
                }
            });

            // Ocultar sugerencias al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!titleInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                    suggestionsBox.classList.add('hidden');
                }
            });
        }

        const form = document.getElementById('formAddTip');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Guardando...';

                try {
                    if (!auth.currentUser) {
                        showToast('Debes iniciar sesión para guardar un tip.', 'error');
                        btn.disabled = false;
                        btn.textContent = 'Guardar Tip';
                        return;
                    }

                    const autorNombre = currentUserData?.nombre || 'Anónimo';

                    const tipData = {
                        titulo: form.titulo.value.trim(),
                        contenido: form.contenido.value.trim(),
                        autorId: auth.currentUser.uid,
                        autorNombre: autorNombre,
                        estado: 'pendiente',
                        fechaCreacion: new Date().toISOString()
                    };

                    await createTip(tipData);
                    showToast('Tip guardado con éxito. Quedará pendiente de aprobación.', 'success');
                    
                    form.reset();
                    await renderCreatorTipsManagement(containerId, currentUserData);
                    
                } catch (error) {
                    console.error('Error al guardar el tip:', error);
                    showToast('Error al guardar el tip. Intenta nuevamente.', 'error');
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