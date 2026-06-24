import{A as e,C as t,D as n,E as r,M as i,O as a,S as o,T as s,_ as c,a as l,b as ee,c as u,d,f as te,g as ne,h as f,i as re,j as p,k as m,l as h,m as g,n as ie,o as ae,p as oe,r as se,s as _,t as ce,u as le,v,w as y,x as b,y as x}from"./formularios-Dd8wk6Te.js";function S(e,t=`info`){let n=document.getElementById(`toast-container`);n||(n=document.createElement(`div`),n.id=`toast-container`,n.className=`fixed bottom-5 right-5 z-50 flex flex-col gap-2`,document.body.appendChild(n));let r=document.createElement(`div`),i=`px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2`;t===`error`?(r.className=i+` bg-red-500`,r.innerHTML=`<span>❌</span> ${e}`):t===`success`?(r.className=i+` bg-green-500`,r.innerHTML=`<span>✅</span> ${e}`):(r.className=i+` bg-blue-500`,r.innerHTML=`<span>ℹ️</span> ${e}`),n.appendChild(r),requestAnimationFrame(()=>{r.classList.remove(`translate-y-10`,`opacity-0`)}),setTimeout(()=>{r.classList.add(`translate-y-10`,`opacity-0`),setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)},3e3)}function C(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}document.addEventListener(`DOMContentLoaded`,()=>{let w=document.getElementById(`dashboard-content`),T=document.getElementById(`sidebar-nav`),E=document.getElementById(`user-name`),D=document.getElementById(`user-role-label`),O=document.getElementById(`user-initial`),k=JSON.parse(localStorage.getItem(`lactanido_cart`)||`[]`),A=`resumen`,j=null,M=`padre`;ie(),p(),i();function N(){localStorage.setItem(`lactanido_cart`,JSON.stringify(k)),P()}function P(){let e=k.reduce((e,t)=>e+t.cantidad,0),t=document.getElementById(`cart-badge`);t&&(e>0?(t.textContent=e,t.classList.remove(`hidden`)):t.classList.add(`hidden`))}let F={padre:[{label:`Resumen`,icon:`🏠`,action:`resumen`},{label:`Tienda Bebé 🛍️`,action:`tienda`,icon:`🧸`},{label:`Mis Pedidos 📦`,action:`pedidos`,icon:`🚚`},{label:`Bitácoras Bebé 📋`,action:`bitacora`,icon:`🍼`},{label:`Perfil Nido`,action:`modalPerfilBebe`,icon:`👶`,isModal:!0}],consejera:[{label:`Dashboard`,icon:`📊`,action:`dashboard`},{label:`Mis Citas`,icon:`🗓️`,action:`citas`},{label:`Fichas Guardadas`,icon:`🤱`,action:`historial_fichas`},{label:`Mi Horario`,icon:`⏱️`,action:`horarios`}],cuidadora:[{label:`Turnos`,icon:`🌙`,action:`dashboard`},{label:`Fichas Guardadas`,icon:`📋`,action:`historial_fichas`},{label:`Disponibilidad`,icon:`🗓️`,action:`disponibilidad`}],admin:[{label:`Visión General`,icon:`👁️`,action:`dashboard`},{label:`Usuarios`,icon:`👥`,action:`usuarios`},{label:`Pedidos / Tienda`,icon:`🛍️`,action:`admin_tienda`}]};function I(e,t,n){if(e===`modalPerfilBebe`){K(n);return}A=e,L(t,n),R(t,n)}function L(e,t){if(!T)return;let n=F[e]||[],r=``;e===`padre`&&(r=`
        <button id="btnVerCarrito" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[#887263] hover:bg-[#f4eade] hover:text-[#181411] w-full mt-2 relative">
          <span class="flex items-center gap-3">
            <span class="text-xl">🛒</span> Ver Carrito
          </span>
          <span id="cart-badge" class="bg-[#e87a30] text-white text-xs px-2 py-0.5 rounded-full font-bold ${k.length===0?`hidden`:``}">
            ${k.reduce((e,t)=>e+t.cantidad,0)}
          </span>
        </button>
      `),T.innerHTML=n.map(e=>{let t=A===e.action;return`
        <a href="#" data-action="${e.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${t?`bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]`:`text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]`}">
          <span class="text-xl">${e.icon}</span>
          ${e.label}
        </a>
      `}).join(``)+r,T.querySelectorAll(`.nav-item, #btnVerCarrito`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault();let i=n.dataset.action||`carrito`;i===`carrito`?pe():I(i,e,t)})})}async function R(e,t){if(w){w.innerHTML=`
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="animate-pulse font-medium">Cargando sección...</p>
      </div>`;try{e===`padre`?await z(t):e===`consejera`?await U(t):e===`cuidadora`?await ue(t):e===`admin`&&await de(t)}catch(e){console.error(`Error cargando pestaña:`,e),w.innerHTML=`
        <div class="text-center py-10">
          <p class="text-red-500 font-bold mb-2">Error al cargar la información:</p>
          <p class="text-xs text-red-400 bg-red-50 p-4 rounded-lg border border-red-100 max-w-lg mx-auto font-mono text-left whitespace-pre-wrap">${e.message}\n${e.stack}</p>
        </div>`}}}async function z(e){if(A===`resumen`){w.innerHTML=`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up">
          <div class="col-span-1 md:col-span-2 glass-panel p-8 rounded-2xl border-l-4 border-[#e87a30] relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 text-[#e87a30] opacity-10 text-9xl transition-transform group-hover:scale-110">🍼</div>
            <h2 class="text-3xl font-black text-[#181411] mb-2">¡Hola, ${C(e?.nombre?.split(` `)[0]||`Bienvenido/a`)}! 👋</h2>
            <p class="text-[#887263] mb-6">Gestiona el cuidado y bienestar de tu familia desde aquí.</p>
            
            <div class="flex flex-wrap gap-3">
                <button id="btnNuevaCita" class="bg-[#e87a30] text-white font-bold rounded-full py-2 px-6 hover:bg-[#d66a20] transition-colors shadow-md flex items-center gap-2">
                  <span class="text-xl leading-none">+</span> Agendar Nueva Cita
                </button>
                <button id="btnIrTienda" class="bg-white border border-[#e5dfdc] text-[#181411] font-bold rounded-full py-2 px-6 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                  🛍️ Tienda de Bebé
                </button>
            </div>
          </div>
          
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center">
             <div class="w-16 h-16 bg-[#f4eade] rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">
               👶
             </div>
             <h3 class="font-bold text-lg">Mi Nido (Bebé)</h3>
             ${e.nidoId?`
               <p class="text-sm text-green-600 font-bold mb-1">¡Nido vinculado!</p>
               <p class="text-xs text-gray-500 mb-4">Compartiendo el cuidado en familia</p>
               <button id="btnVerPerfilBebe" class="w-full bg-[#f4f2f0] hover:bg-[#e5dfdc] text-[#181411] py-2 rounded-lg text-sm font-semibold transition-colors">Ver Perfil del Bebé</button>
             `:`
               <p class="text-xs text-red-500 mb-2 font-bold">No has registrado a tu bebé</p>
               <p class="text-[10px] text-gray-500 mb-2 leading-tight">Si tu pareja ya registró al bebé, usa el mismo RUT para vincularte a su Nido automáticamente.</p>
               <form id="formVincularNido" class="flex flex-col gap-2 w-full mt-2">
                 <input type="text" name="nombreBebe" placeholder="Nombre del bebé" required class="p-2 border border-gray-200 rounded text-sm w-full" />
                 <input type="text" name="rutBebe" placeholder="RUT del bebé" maxlength="12" required class="input-rut p-2 border border-gray-200 rounded text-sm w-full" />
                 <button type="submit" class="w-full bg-[#e87a30] text-white py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#d66a20]">Vincular Nido</button>
               </form>
             `}
          </div>
        </div>

        <h3 class="font-bold text-xl mt-8 mb-4">Tus Citas Recientes</h3>
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden">
          <table class="w-full text-left text-sm" id="parent-appointments-table">
            <thead class="bg-[#fbf9f8] border-b border-[#e5dfdc] text-[#887263]">
              <tr>
                <th class="p-4 font-medium">Servicio</th>
                <th class="p-4 font-medium">Profesional</th>
                <th class="p-4 font-medium">Fecha</th>
                <th class="p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#e5dfdc]">
              <!-- Dinámico -->
            </tbody>
          </table>
        </div>
      `;let n=document.getElementById(`btnNuevaCita`);n&&(n.onclick=()=>document.getElementById(`modalAgendarCita`)?.showModal());let r=document.getElementById(`btnIrTienda`);r&&(r.onclick=()=>I(`tienda`,`padre`,e));let i=document.getElementById(`btnVerPerfilBebe`);i&&(i.onclick=()=>K(e));let a=document.getElementById(`formVincularNido`);if(a){let n=a.querySelector(`input[name="rutBebe"]`);n&&n.addEventListener(`input`,e=>{e.target.value=ce(e.target.value)}),a.addEventListener(`submit`,async n=>{n.preventDefault();let r=a.querySelector(`button`);if(r.disabled=!0,r.textContent=`Vinculando...`,!se(a.rutBebe.value)){S(`El RUT ingresado no es válido.`,`warning`),r.disabled=!1,r.textContent=`Vincular Nido`;return}try{await t(e.uid,a.rutBebe.value,a.nombreBebe.value),S(`¡Nido vinculado correctamente!`,`success`),setTimeout(()=>location.reload(),1500)}catch{S(`Error al vincular el nido`,`error`),r.disabled=!1,r.textContent=`Vincular Nido`}})}let o=document.querySelector(`#parent-appointments-table tbody`);if(o){o.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">Cargando citas...</td></tr>`;let t=await ne(e.uid);t.length===0?o.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>`:o.innerHTML=t.map(e=>`
            <tr>
              <td class="p-4 font-medium">${C(e.servicio)}</td>
              <td class="p-4 text-gray-600">${C(e.profesionalNombre||`Por asignar`)}</td>
              <td class="p-4">${C(e.fecha)} ${C(e.hora)}</td>
              <td class="p-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${e.estado===`completada`?`bg-green-100 text-green-700`:e.estado===`activo`?`bg-blue-100 text-blue-700`:`bg-yellow-100 text-yellow-700`}">${C(e.estado)}</span>
              </td>
            </tr>
          `).join(``)}}else A===`tienda`?(w.innerHTML=`
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-[#181411]">🛍️ Tienda de Bebés</h2>
          <div class="flex gap-2">
            <button class="btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Todos">Todos</button>
            <button class="btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Lactancia">Lactancia</button>
            <button class="btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Higiene">Higiene</button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="tienda-productos-grid">
          <p class="col-span-full text-center text-gray-400 py-10 italic">Cargando productos...</p>
        </div>
      `,B(`Todos`),w.querySelectorAll(`.btn-categoria`).forEach(e=>{e.addEventListener(`click`,e=>{w.querySelectorAll(`.btn-categoria`).forEach(e=>{e.className=`btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold`}),e.target.className=`btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold`,B(e.target.dataset.cat)})})):A===`pedidos`?(w.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Pedidos</h2>
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden" id="pedidos-container">
          <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
        </div>
      `,H(e.uid)):A===`bitacora`&&(w.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-2">🍼 Bitácora de Cuidado del Bebé</h2>
        <p class="text-sm text-gray-500 mb-6">Información ingresada por los prestadores durante las citas de tu nido.</p>
        <div class="space-y-6" id="bitacora-timeline">
          <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras...</p>
        </div>
      `,V(e.nidoId))}async function B(e){let t=document.getElementById(`tienda-productos-grid`);if(t)try{let n=await h(),r=e===`Todos`?n:n.filter(t=>t.categoria===e);if(r.length===0){t.innerHTML=`<p class="col-span-full text-center text-gray-400 py-10 italic">No hay productos disponibles en esta categoría.</p>`;return}t.innerHTML=r.map(e=>`
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col items-center hover:shadow-md transition-all">
          <img src="${C(e.imagenUrl||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`)}" alt="${C(e.nombre)}" class="w-full h-32 object-cover rounded-lg mb-4" />
          <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2 h-10">${C(e.nombre)}</h4>
          <p class="text-[#e87a30] font-black text-xl mb-1">$${e.precio.toLocaleString(`cl-CL`)}</p>
          <p class="text-xs text-gray-400 mb-4">Stock disponible: ${e.stock}</p>
          <button data-id="${C(e.id)}" data-nombre="${C(e.nombre)}" data-precio="${e.precio}" data-stock="${e.stock}" class="btn-agregar-carrito w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#e87a30] transition-colors flex items-center justify-center gap-2">
            Agregar 🛒
          </button>
        </div>
      `).join(``),t.querySelectorAll(`.btn-agregar-carrito`).forEach(e=>{e.onclick=()=>{let{id:t,nombre:n,precio:r,stock:i}=e.dataset,a=parseInt(i),o=k.find(e=>e.productoId===t);if(o){if(o.cantidad>=a){S(`No puedes agregar más del stock disponible`,`warning`);return}o.cantidad++}else{if(a<=0){S(`Producto sin stock disponible`,`warning`);return}k.push({productoId:t,nombre:n,precio:parseFloat(r),cantidad:1})}N(),S(`¡${n} añadido al carrito!`,`success`)}})}catch{t.innerHTML=`<p class="col-span-full text-center text-red-500 py-10 italic">Error al cargar productos.</p>`}}async function V(e){let t=document.getElementById(`bitacora-timeline`);if(t){if(!e){t.innerHTML=`<p class="text-center py-10 text-red-500 italic font-semibold">Debes vincular tu Nido familiar para ver las bitácoras del bebé.</p>`;return}try{let n=await d(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No hay registros de cuidado cargados todavía.</p>`;return}t.innerHTML=n.map(e=>`
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-[#e87a30]">
          <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
            <div>
              <span class="text-xs text-gray-400 font-bold block">${new Date(e.creadoEn).toLocaleDateString()} ${new Date(e.creadoEn).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})}</span>
              <h4 class="font-bold text-lg text-[#181411]">Reporte de ${C(e.prestadorNombre||`Colaboradora`)}</h4>
              <p class="text-xs text-[#887263]">Duración del Turno: ${e.horasEfectivas||0} hrs</p>
            </div>
            <span class="text-xs font-bold bg-[#f4eade] text-[#e87a30] px-2.5 py-1 rounded-full uppercase tracking-wider">${C(e.prestadorRol)}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
            <div class="text-sm"><strong>🍼 Alimentación:</strong> ${C(e.tipoAlimentacion||`Ninguna`)} ${e.cantidadOz?`(${e.cantidadOz} Oz)`:``}</div>
            <div class="text-sm"><strong>😴 Sueño:</strong> ${e.horasSueno||0} hrs</div>
            <div class="text-sm"><strong>🧷 Pañales:</strong> ${e.cantidadPanales||0} cambiados</div>
          </div>

          <div class="space-y-2 text-sm text-[#181411]">
            <p><strong>Observaciones:</strong> <span class="text-gray-600">${C(e.observaciones||`Sin observaciones.`)}</span></p>
            <p><strong>Recomendaciones:</strong> <span class="text-gray-600">${C(e.recomendaciones||`Sin recomendaciones especiales.`)}</span></p>
            ${e.seguimiento?`<p><strong>Seguimiento:</strong> <span class="text-[#e87a30] font-medium">${C(e.seguimiento)}</span></p>`:``}
          </div>
        </div>
      `).join(``)}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar bitácoras.</p>`}}}async function H(e){let t=document.getElementById(`pedidos-container`);if(t)try{let n=await oe(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes compras registradas en tu cuenta.</p>`;return}t.innerHTML=`
        <table class="w-full text-left text-sm">
          <thead class="bg-[#fbf9f8] border-b border-[#e5dfdc] text-[#887263]">
            <tr>
              <th class="p-4 font-medium">Pedido ID</th>
              <th class="p-4 font-medium">Productos</th>
              <th class="p-4 font-medium">Total</th>
              <th class="p-4 font-medium">Fecha</th>
              <th class="p-4 font-medium">Despacho</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#e5dfdc]">
            ${n.map(e=>`
              <tr>
                <td class="p-4 font-mono text-xs">${C(e.id.slice(0,8))}...</td>
                <td class="p-4 text-gray-700">
                  ${e.productos.map(e=>`${C(e.nombre)} x${e.cantidad}`).join(`, `)}
                </td>
                <td class="p-4 font-bold text-[#e87a30]">$${e.total.toLocaleString(`cl-CL`)}</td>
                <td class="p-4 text-gray-500 text-xs">${new Date(e.creadoEn).toLocaleDateString()}</td>
                <td class="p-4">
                  <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Recibido</span>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      `}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar pedidos.</p>`}}async function U(e){if(A===`dashboard`||A===`citas`){let t=await g(`Consultor`,e.uid);w.innerHTML=`
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-black text-[#181411]">Buen día, ${e.nombre} 👩‍⚕️</h2>
            <p class="text-gray-500 text-sm">Gestiona tus consultas y reporta las bitácoras del bebé.</p>
          </div>
        </div>

        <h3 class="font-bold text-lg mb-4">Tus Citas Programadas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${t.length>0?t.map(e=>`
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${C(e.hora)}</span>
                <h4 class="font-bold text-lg mt-2">${C(e.nombre)}</h4>
                <p class="text-xs text-gray-500 mb-2">Fecha: ${C(e.fecha)} • Creado por: ${C(e.email)}</p>
                <p class="text-sm font-medium text-gray-600 mb-4">Servicio: ${C(e.servicio)} (${e.duracion} hrs)</p>
              </div>
              <div class="flex flex-col gap-2">
                ${e.estado===`completada`?`
                  <span class="text-center text-xs bg-green-100 text-green-700 py-2 rounded-lg font-bold">Bitácora Registrada ✅</span>
                `:`
                  <button data-id="${C(e.id)}" data-nid="${C(e.nidoId||``)}" class="btn-abrir-ficha w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-indigo-700 transition shadow">
                    Registrar Bitácora 📝
                  </button>
                `}
              </div>
            </div>
          `).join(``):`
            <div class="col-span-full p-8 text-center text-gray-400 italic">No tienes citas asignadas.</div>
          `}
        </div>
      `,w.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:n}=e.dataset;Y(t,n)}})}else if(A===`historial_fichas`)w.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">🤱 Historial de Fichas Emitidas</h2>
        <div class="space-y-4" id="prestador-fichas-list">
          <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
        </div>
      `,W(e.uid);else if(A===`horarios`){let t=e.horarios||{},n=(e,n)=>t[e]&&t[e][n]?`<button data-day="${e}" data-block="${n}" class="btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Disponible</button>`:`<button data-day="${e}" data-block="${n}" class="btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition">No Disp.</button>`;w.innerHTML=`
        <h3 class="font-bold text-xl mb-2">Gestión de Horarios Base</h3>
        <p class="text-sm text-[#887263] mb-6">Selecciona tus horarios disponibles.</p>
        <div class="glass-panel p-6 rounded-2xl">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px] text-center text-sm border-collapse">
              <thead>
                <tr class="text-[#887263]">
                  <th class="p-2 border-b border-[#e5dfdc]">Hora</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Lunes</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Martes</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Miércoles</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Jueves</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Viernes</th>
                </tr>
              </thead>
              <tbody id="tabla-horarios">
                <tr>
                  <td class="p-2 font-medium text-[#181411]">09:00 - 13:00</td>
                  <td class="p-2">${n(`Lunes`,`09:00-13:00`)}</td>
                  <td class="p-2">${n(`Martes`,`09:00-13:00`)}</td>
                  <td class="p-2">${n(`Miercoles`,`09:00-13:00`)}</td>
                  <td class="p-2">${n(`Jueves`,`09:00-13:00`)}</td>
                  <td class="p-2">${n(`Viernes`,`09:00-13:00`)}</td>
                </tr>
                <tr>
                  <td class="p-2 font-medium text-[#181411]">14:00 - 18:00</td>
                  <td class="p-2">${n(`Lunes`,`14:00-18:00`)}</td>
                  <td class="p-2">${n(`Martes`,`14:00-18:00`)}</td>
                  <td class="p-2">${n(`Miercoles`,`14:00-18:00`)}</td>
                  <td class="p-2">${n(`Jueves`,`14:00-18:00`)}</td>
                  <td class="p-2">${n(`Viernes`,`14:00-18:00`)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex justify-end">
             <button id="btnGuardarHorarios" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md">Guardar Horarios</button>
          </div>
        </div>
      `;let r=w.querySelectorAll(`.btn-bloque`);r.forEach(e=>{e.addEventListener(`click`,()=>{e.classList.contains(`bg-green-100`)?(e.className=`btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition`,e.textContent=`No Disp.`):(e.className=`btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition`,e.textContent=`Disponible`)})});let i=document.getElementById(`btnGuardarHorarios`);i.onclick=async()=>{i.textContent=`Guardando...`,i.disabled=!0;let t={};r.forEach(e=>{let n=e.dataset.day,r=e.dataset.block,i=e.classList.contains(`bg-green-100`);t[n]||(t[n]={}),t[n][r]=i});try{await b(e.uid,t),S(`Horarios base actualizados`,`success`)}catch{S(`Error al actualizar horarios`,`error`)}finally{i.textContent=`Guardar Horarios`,i.disabled=!1}}}}async function ue(e){if(A===`dashboard`){let t=await g(`Cuidador`,e.uid);w.innerHTML=`
        <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 class="text-2xl font-black text-[#181411]">Hola ${e.nombre} 🍼</h2>
              <p class="text-[#887263]">Gestiona tus turnos asignados de cuidado infantil.</p>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-lg mb-4">Turnos de Cuidado Asignados</h3>
        <div class="space-y-4" id="cuidadora-turnos-list">
          ${t.length>0?t.map(e=>`
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 class="font-bold text-lg">${C(e.nombre)}</h4>
                <p class="text-xs text-gray-500">Fecha: ${C(e.fecha)} • Hora: ${C(e.hora)} • Duración: ${e.duracion} hrs</p>
                <p class="text-sm text-gray-600 mt-1">${C(e.email)}</p>
              </div>
              <div>
                ${e.estado===`completada`?`
                  <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>
                `:`
                  <button data-id="${C(e.id)}" data-nid="${C(e.nidoId||``)}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                    Completar Bitácora 📝
                  </button>
                `}
              </div>
            </div>
          `).join(``):`
            <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
          `}
        </div>
      `,w.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:n}=e.dataset;Y(t,n)}})}else if(A===`historial_fichas`)w.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Historial de Bitácoras Entregadas</h2>
        <div class="space-y-4" id="prestador-fichas-list">
          <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
        </div>
      `,W(e.uid);else if(A===`disponibilidad`){w.innerHTML=`
        <h3 class="font-bold text-xl mb-2">Bloqueo de Días por Vacaciones / Descanso</h3>
        <p class="text-sm text-gray-500 mb-6">Ingresa las fechas específicas que deseas bloquear en el calendario.</p>
        
        <div class="bg-white border border-[#e5dfdc] rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-xs font-bold text-[#181411] mb-1">Fecha a bloquear</label>
            <input type="date" id="bloqueo-date" class="w-full p-2 border border-[#e5dfdc] rounded-lg text-sm" />
          </div>
          <div class="flex-1 w-full">
            <label class="block text-xs font-bold text-[#181411] mb-1">Motivo (Opcional)</label>
            <input type="text" id="bloqueo-motivo" placeholder="Ej. Cumpleaños, Descanso..." class="w-full p-2 border border-[#e5dfdc] rounded-lg text-sm" />
          </div>
          <button id="btnAñadirBloqueo" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full md:w-auto h-[38px]">Añadir Bloqueo</button>
        </div>

        <h4 class="font-bold text-sm text-[#181411] mb-2">Bloqueos de Fechas Activos:</h4>
        <ul class="space-y-2" id="caregiver-blocked-days-list"></ul>
      `,Q(e.uid);let t=document.getElementById(`btnAñadirBloqueo`);t.onclick=async()=>{let n=document.getElementById(`bloqueo-date`),r=document.getElementById(`bloqueo-motivo`);if(!n.value){S(`Selecciona una fecha`,`warning`);return}t.disabled=!0;try{await re(e.uid,n.value,r.value),S(`Fecha bloqueada con éxito`,`success`),n.value=``,r.value=``,Q(e.uid)}catch{S(`Error al bloquear fecha`,`error`)}finally{t.disabled=!1}}}}async function W(e){let t=document.getElementById(`prestador-fichas-list`);if(t)try{let n=await te(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes fichas registradas aún.</p>`;return}t.innerHTML=n.map(e=>`
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
            <span>Fecha: ${C(e.fecha)} (${e.horasEfectivas} hrs)</span>
            <span class="text-xs text-gray-400 font-normal">${new Date(e.creadoEn).toLocaleDateString()}</span>
          </div>
          <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${C(e.tipoAlimentacion||`N/A`)} • Horas Sueño: ${e.horasSueno||0}h • Pañales: ${e.cantidadPanales||0}</p>
          <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${C(e.observaciones||`Ninguna`)}</p>
        </div>
      `).join(``)}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>`}}async function de(e){if(A===`dashboard`||A===`usuarios`){let e=await le();w.innerHTML=`
        <h2 class="text-3xl font-black text-[#181411] mb-6">Panel Super Administrador 🚀</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div class="text-gray-500 text-sm font-medium mb-1">Total Usuarios</div>
            <div class="text-3xl font-black">${e.totalUsers||0}</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div class="text-gray-500 text-sm font-medium mb-1">Citas Activas</div>
            <div class="text-3xl font-black text-[#e87a30]">${e.activeAppointments||0}</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div class="text-gray-500 text-sm font-medium mb-1">Prestadores</div>
            <div class="text-3xl font-black text-[#887263]">${e.totalPrestadores||0}</div>
          </div>
          <div class="bg-gradient-to-br from-[#e87a30] to-[#f4c28e] p-5 rounded-xl shadow-sm text-white">
            <div class="text-white/80 text-sm font-medium mb-1">Pedidos Generados</div>
            <div id="admin-orders-count" class="text-3xl font-black">Cargando...</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">Aprobaciones Pendientes</h3>
            <div id="pending-users-list" class="space-y-3">
              <p class="text-sm text-gray-400 italic">Cargando solicitudes...</p>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 class="font-bold text-lg mb-4 border-b pb-2">Últimos Registros</h3>
             <ul id="admin-latest-users" class="space-y-3">
               <p class="text-sm text-gray-400 italic">Cargando usuarios...</p>
             </ul>
          </div>
        </div>
      `,Z(),me();try{let e=await f(),t=document.getElementById(`admin-orders-count`);t&&(t.textContent=e.length)}catch{}}else if(A===`admin_tienda`){w.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Tienda & Inventario</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Formulario Agregar -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="font-bold text-lg text-[#181411] mb-4">Añadir Nuevo Producto</h4>
            <form id="adminAddProductForm" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                <input type="text" name="nombre" required placeholder="Ej. Cojín de Lactancia" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Precio (CLP)</label>
                  <input type="number" name="precio" required placeholder="32500" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                  <input type="number" name="stock" required placeholder="10" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                  <select name="categoria" required class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none">
                    <option value="Lactancia">Lactancia</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Imagen (URL)</label>
                  <input type="url" name="imagenUrl" placeholder="https://..." class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
                </div>
              </div>
              <button type="submit" class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-2.5 rounded-lg text-sm transition">
                Guardar Producto en Tienda
              </button>
            </form>
          </div>

          <!-- Listado de Productos -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h4 class="font-bold text-lg text-[#181411] mb-4">Productos en Inventario</h4>
            <div class="flex-1 overflow-y-auto space-y-3 max-h-[500px]" id="admin-inventory-list">
              <p class="text-gray-400 italic text-sm">Cargando catálogo...</p>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-lg mt-8 mb-4">Todos los Pedidos Clientes</h3>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="admin-orders-list">
          <p class="text-center py-6 text-gray-400 italic">Cargando historial de pedidos...</p>
        </div>
      `,G(),fe();let e=document.getElementById(`adminAddProductForm`);e.addEventListener(`submit`,async t=>{t.preventDefault();let n=new FormData(e),r={nombre:n.get(`nombre`),precio:parseFloat(n.get(`precio`)),stock:parseInt(n.get(`stock`)),categoria:n.get(`categoria`),imagenUrl:n.get(`imagenUrl`)||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`};try{await _(r),S(`Producto creado con éxito`,`success`),e.reset(),G()}catch{S(`Error al crear producto`,`error`)}})}}async function G(){let e=document.getElementById(`admin-inventory-list`);if(e)try{let t=await h();if(t.length===0){e.innerHTML=`<p class="text-gray-400 italic text-sm">No hay productos cargados.</p>`;return}e.innerHTML=t.map(e=>`
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-3">
            <img src="${e.imagenUrl}" alt="" class="w-10 h-10 object-cover rounded" />
            <div>
              <p class="font-bold text-sm text-[#181411]">${e.nombre}</p>
              <p class="text-xs text-gray-500">$${e.precio.toLocaleString(`cl-CL`)} • Stock: ${e.stock} • Cat: ${e.categoria}</p>
            </div>
          </div>
          <button data-id="${e.id}" class="btn-delete-product text-red-500 hover:text-red-700 text-xs font-bold transition">Quitar</button>
        </div>
      `).join(``),e.querySelectorAll(`.btn-delete-product`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Estás seguro de eliminar este producto?`))try{await u(e.dataset.id),S(`Producto eliminado`,`success`),G()}catch{S(`Error al eliminar producto`,`error`)}}})}catch{e.innerHTML=`<p class="text-red-500 italic text-sm">Error cargando inventario.</p>`}}async function fe(){let e=document.getElementById(`admin-orders-list`);if(e)try{let t=await f();if(t.length===0){e.innerHTML=`<p class="text-center py-6 text-gray-400 italic">No hay registros de compras.</p>`;return}e.innerHTML=`
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th class="p-3">ID Pedido</th>
              <th class="p-3">Usuario UID</th>
              <th class="p-3">Dirección</th>
              <th class="p-3">Productos</th>
              <th class="p-3">Total</th>
              <th class="p-3">Fecha</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${t.map(e=>`
              <tr>
                <td class="p-3 font-mono text-xs">${e.id}</td>
                <td class="p-3 text-xs text-gray-600">${e.compradorUid}</td>
                <td class="p-3 text-xs">${e.direccion||`No ingresada`}</td>
                <td class="p-3 text-xs">${e.productos.map(e=>`${e.nombre} x${e.cantidad}`).join(`, `)}</td>
                <td class="p-3 font-bold text-[#e87a30]">$${e.total.toLocaleString(`cl-CL`)}</td>
                <td class="p-3 text-xs text-gray-400">${new Date(e.creadoEn).toLocaleDateString()}</td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      `}catch{e.innerHTML=`<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>`}}function K(e){let t=document.getElementById(`modalPerfilBebe`);t&&t.showModal()}function pe(){let e=document.getElementById(`modalCarrito`);e&&(q(),e.showModal())}function q(){let e=document.getElementById(`carrito-items`),t=document.getElementById(`carrito-total`);if(!e)return;if(k.length===0){e.innerHTML=`<p class="text-gray-400 text-center py-8 text-sm italic">Tu carrito está vacío.</p>`,t&&(t.textContent=`$0`);return}let n=0;e.innerHTML=k.map((e,t)=>{let r=e.precio*e.cantidad;return n+=r,`
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <p class="font-bold text-sm text-gray-800">${e.nombre}</p>
            <p class="text-xs text-gray-400">$${e.precio.toLocaleString(`cl-CL`)} x ${e.cantidad}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${t}" data-action="dec">-</button>
            <span class="text-sm font-bold">${e.cantidad}</span>
            <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${t}" data-action="inc">+</button>
            <button class="btn-cart-del text-red-500 hover:text-red-700 text-xs ml-2 font-bold" data-idx="${t}">Quitar</button>
          </div>
        </div>
      `}).join(``),t&&(t.textContent=`$${n.toLocaleString(`cl-CL`)}`),e.querySelectorAll(`.btn-cart-qty`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx),n=e.dataset.action;n===`inc`?k[t].cantidad++:n===`dec`&&(k[t].cantidad--,k[t].cantidad<=0&&k.splice(t,1)),N(),q()}}),e.querySelectorAll(`.btn-cart-del`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx);k.splice(t,1),N(),q()}})}let J=document.getElementById(`checkoutForm`);J.addEventListener(`submit`,async e=>{if(e.preventDefault(),k.length===0){S(`El carrito está vacío`,`warning`);return}let t=document.getElementById(`btnConfirmarPedido`);t.disabled=!0,t.textContent=`Procesando Pedido...`;let n={compradorUid:s.currentUser.uid,nidoId:j?.nidoId||null,productos:k,total:k.reduce((e,t)=>e+t.precio*t.cantidad,0),direccion:document.getElementById(`cart-direccion`).value,telefono:document.getElementById(`cart-telefono`).value,estado:`pagado`};try{await ae(n),S(`¡Pedido realizado con éxito!`,`success`),k=[],N(),J.reset(),document.getElementById(`modalCarrito`)?.close(),R(`padre`,j)}catch{S(`Error al procesar el pedido. Revisa el stock.`,`error`)}finally{t.disabled=!1,t.textContent=`Confirmar Pedido y Pagar 💳`}});function Y(e,t){let n=document.getElementById(`modalFichaCuidado`);if(!n)return;document.getElementById(`ficha-reservaId`).value=e,document.getElementById(`ficha-nidoId`).value=t;let r=n.querySelector(`input[name="fecha"]`);r&&(r.value=new Date().toISOString().split(`T`)[0]),n.showModal()}let X=document.getElementById(`fichaCuidadoForm`);X.addEventListener(`submit`,async e=>{e.preventDefault();let t=X.querySelector(`button[type="submit"]`);t.disabled=!0,t.textContent=`Guardando Ficha...`;let n=new FormData(X),r={reservaId:n.get(`reservaId`),nidoId:n.get(`nidoId`),fecha:n.get(`fecha`),horasEfectivas:parseInt(n.get(`horasEfectivas`)),tipoAlimentacion:n.get(`tipoAlimentacion`),cantidadOz:parseInt(n.get(`cantidadOz`))||0,horasSueno:parseFloat(n.get(`horasSueno`))||0,cantidadPanales:parseInt(n.get(`cantidadPanales`))||0,observaciones:n.get(`observaciones`),recomendaciones:n.get(`recomendaciones`),seguimiento:n.get(`seguimiento`),prestadorId:s.currentUser.uid,prestadorNombre:j?.nombre||`Prestador`,prestadorRol:M};if(!r.nidoId){S(`Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.`,`error`),t.disabled=!1,t.textContent=`Guardar y Enviar Bitácora`;return}try{await o(r),S(`Ficha de cuidado guardada y compartida`,`success`),X.reset(),document.getElementById(`modalFichaCuidado`)?.close(),R(M,j)}catch{S(`Error al guardar la bitácora`,`error`)}finally{t.disabled=!1,t.textContent=`Guardar y Enviar Bitácora`}});async function Z(){let e=document.getElementById(`pending-users-list`);if(e)try{let t=await x();if(t.length===0){e.innerHTML=`<p class="text-sm text-gray-500 italic">No hay solicitudes nuevas.</p>`;return}e.innerHTML=``,t.forEach(t=>{let n=document.createElement(`div`);n.className=`flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200`,n.innerHTML=`
            <div>
              <p class="font-bold text-sm">${C(t.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${C(Array.isArray(t.rol)?t.rol.join(`, `):t.rol)}</span></p>
              <p class="text-[10px] text-gray-500">${C(t.email)} • RUT: ${C(t.rut||`No registrado`)}</p>
            </div>
            <button data-uid="${C(t.id)}" data-nombre="${C(t.nombre)}" data-email="${C(t.email)}" class="btn-approve bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-green-600 transition-colors">Aprobar</button>
          `,e.appendChild(n)}),e.querySelectorAll(`.btn-approve`).forEach(e=>e.addEventListener(`click`,async e=>{let{uid:t,nombre:n,email:r}=e.target.dataset;e.target.disabled=!0;try{await l(t),S(`Usuario aprobado con éxito`,`success`),y.sendApprovalNotification(n,r),Z()}catch{S(`Error al aprobar usuario`,`error`),e.target.disabled=!1}}))}catch{e.innerHTML=`<p class="text-xs text-red-500">Error al cargar.</p>`}}async function me(){let e=document.getElementById(`admin-latest-users`);if(e)try{let t=await v();if(t.length===0){e.innerHTML=`<p class="text-sm text-gray-400">No hay usuarios registrados.</p>`;return}e.innerHTML=t.map(e=>{let t=e.rol===`padre`?`bg-blue-500`:`bg-green-500`,n=e.fechaRegistro?new Date(e.fechaRegistro).toLocaleDateString():`---`;return`
          <li class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 ${t} rounded-full"></span> ${C(e.nombre)}
            </span>
            <span class="text-gray-400 text-xs">${C(n)}</span>
          </li>
        `}).join(``)}catch{S(`Error al cargar últimos registros`,`error`)}}async function Q(e){let t=document.getElementById(`caregiver-blocked-days-list`);if(t){t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">Cargando bloqueos...</li>`;try{let n=await c(e);n.length===0?t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">No tienes días bloqueados.</li>`:(t.innerHTML=n.map(e=>`
          <li class="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-100">
            <div class="flex items-center gap-3">
              <span class="text-sm">⛔</span>
              <div>
                <p class="font-bold text-red-800 text-xs">${C(e.date)}</p>
                <p class="text-[10px] text-red-600">${C(e.motivo||`Sin motivo`)}</p>
              </div>
            </div>
            <button data-id="${C(e.id)}" class="btn-delete-block text-red-400 hover:text-red-700 text-xs">Eliminar</button>
          </li>`).join(``),t.querySelectorAll(`.btn-delete-block`).forEach(t=>{t.onclick=async()=>{try{await ee(e,t.dataset.id),S(`Bloqueo eliminado`,`success`),Q(e)}catch{S(`Error al eliminar bloqueo`,`error`)}}}))}catch{t.innerHTML=`<li class="p-2 text-center text-red-500 italic">Error al cargar.</li>`}}}n(s,async t=>{if(t)try{let n=await m(e(r,`usuarios`,t.uid));if(n.exists()){let e=n.data();if(j=e,e.estado===`pendiente`&&e.rol!==`admin`)he(e.nombre);else{let t=(Array.isArray(e.rol)?e.rol[0]:e.rol)||`padre`;M=t,E&&(E.textContent=e?.nombre||`Usuario`),O&&(O.textContent=(e?.nombre||`U`).charAt(0).toUpperCase()),D&&(t===`admin`?D.textContent=`Administrador`:e.subtipo&&e.subtipo!==`admin`?D.textContent=e.subtipo===`madre`?`Mamá`:`Papá`:D.textContent={consejera:`Consejera`,cuidadora:`Cuidadora`,padre:`Padre`}[t]||t),A=t===`padre`?`resumen`:`dashboard`,L(t,e),R(t,e)}}else S(`Perfil de usuario no encontrado`,`error`),setTimeout(()=>window.location.href=`index.html`,3e3)}catch{S(`Error al conectar con el servidor`,`error`)}else window.location.href=`index.html`});function he(e){w&&(w.innerHTML=`
        <div class="glass-panel p-10 rounded-2xl text-center slide-up max-w-xl mx-auto mt-20">
          <div class="text-5xl mb-4">⌛</div>
          <h2 class="text-2xl font-black mb-4 text-[#181411]">Cuenta en Revisión</h2>
          <p class="text-[#887263]">Hola ${e||`Colaborador/a`}, estamos validando tus antecedentes. Te notificaremos por correo cuando tu perfil esté activo.</p>
          <button onclick="location.reload()" class="mt-6 text-sm text-[#e87a30] font-bold">Refrescar estado</button>
        </div>`)}let $=document.getElementById(`btnCerrarSesion`);$&&$.addEventListener(`click`,async e=>{e.preventDefault(),await a(s),window.location.href=`index.html`})});