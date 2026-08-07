import{A as e,B as t,C as n,D as r,E as i,F as a,G as o,H as s,I as c,K as ee,L as te,M as l,N as u,O as d,P as f,R as ne,S as p,T as m,U as h,V as g,W as _,_ as v,a as y,b,c as x,d as re,f as S,g as ie,h as ae,i as oe,j as C,k as w,l as T,m as E,n as se,o as D,p as ce,r as O,s as le,u as ue,v as de,w as fe,x as pe,y as k,z as me}from"./tips-CnX9QCmF.js";var A=`lactanido_cart`,j=M();function M(){try{return JSON.parse(localStorage.getItem(A)||`[]`)}catch{return[]}}function N(){localStorage.setItem(A,JSON.stringify(j))}function P(){return j}function F(){return j.reduce((e,t)=>e+t.cantidad,0)}function I(){return j.reduce((e,t)=>e+t.precio*t.cantidad,0)}function L(){N(),B()}function R(){j=[],N(),B()}function z({productoId:e,nombre:t,precio:n,stock:r}){let i=j.find(t=>t.productoId===e),a=parseInt(r,10);if(i){if(i.cantidad>=a){D(`No puedes agregar más del stock disponible`,`warning`);return}i.cantidad+=1}else{if(a<=0){D(`Producto sin stock disponible`,`warning`);return}j.push({productoId:e,nombre:t,precio:parseFloat(n),cantidad:1})}L(),D(`¡${t} añadido al carrito!`,`success`)}function B(){let e=document.getElementById(`cart-badge`);if(!e)return;let t=F();t>0?(e.textContent=t,e.classList.remove(`hidden`)):e.classList.add(`hidden`)}function V(){let e=document.getElementById(`carrito-items`),t=document.getElementById(`carrito-total`);if(!e)return;if(j.length===0){e.innerHTML=`<p class="text-gray-400 text-center py-8 text-sm italic">Tu carrito está vacío.</p>`,t&&(t.textContent=`$0`);return}let n=0;e.innerHTML=j.map((e,t)=>{let r=e.precio*e.cantidad;return n+=r,`
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
    `}).join(``),t&&(t.textContent=`$${n.toLocaleString(`cl-CL`)}`),e.querySelectorAll(`.btn-cart-qty`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx,10),n=e.dataset.action;n===`inc`?j[t].cantidad++:n===`dec`&&(j[t].cantidad--,j[t].cantidad<=0&&j.splice(t,1)),L(),V()}}),e.querySelectorAll(`.btn-cart-del`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx,10);j.splice(t,1),L(),V()}})}function he(){let e=document.getElementById(`modalCarrito`);e&&(V(),e.showModal())}function ge({renderContent:e,getCurrentUserData:t}){let n=document.getElementById(`checkoutForm`);n&&n.addEventListener(`submit`,async r=>{r.preventDefault();let i=P();if(i.length===0){D(`El carrito está vacío`,`warning`);return}let a=document.getElementById(`btnConfirmarPedido`);a&&(a.disabled=!0,a.textContent=`Procesando Pedido...`);let o=t(),s={compradorUid:f.currentUser.uid,nidoId:o?.nidoId||null,productos:i,total:I(),direccion:document.getElementById(`cart-direccion`)?.value,telefono:document.getElementById(`cart-telefono`)?.value,estado:`pagado`};try{await re(s),D(`¡Pedido realizado con éxito!`,`success`),R(),n.reset(),document.getElementById(`modalCarrito`)?.close(),e(`padre`,o)}catch{D(`Error al procesar el pedido. Revisa el stock.`,`error`)}finally{a&&(a.disabled=!1,a.textContent=`Confirmar Pedido y Pagar 💳`)}})}function H(e){let t=document.getElementById(`modalPerfilBebe`);t&&t.showModal()}function U(e,t){let n=document.getElementById(`modalFichaCuidado`);if(!n)return;document.getElementById(`ficha-reservaId`).value=e,document.getElementById(`ficha-nidoId`).value=t;let r=n.querySelector(`input[name="fecha"]`);r&&(r.value=new Date().toISOString().split(`T`)[0]),n.showModal()}function _e({renderContent:t,getCurrentUserData:n,getCurrentUserRole:r}){let i=document.getElementById(`fichaCuidadoForm`);i&&i.addEventListener(`submit`,async a=>{a.preventDefault();let o=i.querySelector(`button[type="submit"]`);o&&(o.disabled=!0,o.textContent=`Guardando Ficha...`);let s=new FormData(i),c={reservaId:s.get(`reservaId`),nidoId:s.get(`nidoId`),fecha:s.get(`fecha`),horasEfectivas:parseInt(s.get(`horasEfectivas`)),tipoAlimentacion:s.get(`tipoAlimentacion`),cantidadOz:parseInt(s.get(`cantidadOz`))||0,horasSueno:parseFloat(s.get(`horasSueno`))||0,cantidadPanales:parseInt(s.get(`cantidadPanales`))||0,observaciones:s.get(`observaciones`),recomendaciones:s.get(`recomendaciones`),seguimiento:s.get(`seguimiento`),prestadorId:f.currentUser.uid,prestadorNombre:n()?.nombre||`Prestador`,prestadorRol:r()};if(!c.nidoId){D(`Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.`,`error`),o&&(o.disabled=!1,o.textContent=`Guardar y Enviar Bitácora`);return}try{await e(c),D(`Ficha de cuidado guardada y compartida`,`success`),i.reset(),document.getElementById(`modalFichaCuidado`)?.close(),t(r(),n())}catch{D(`Error al guardar la bitácora`,`error`)}finally{o&&(o.disabled=!1,o.textContent=`Guardar y Enviar Bitácora`)}})}async function ve(e,t,n,r){let i=document.getElementById(`dashboard-content`);if(i)if(e===`resumen`){i.innerHTML=`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up">
        <div class="col-span-1 md:col-span-2 glass-panel p-8 rounded-2xl border-l-4 border-[#e87a30] relative overflow-hidden group">
          <div class="absolute -right-10 -top-10 text-[#e87a30] opacity-10 text-9xl transition-transform group-hover:scale-110">🍼</div>
          <h2 class="text-3xl font-black text-[#181411] mb-2">¡Hola, ${O(t?.nombre?.split(` `)[0]||`Bienvenido/a`)}! 👋</h2>
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
           ${t.nidoId?`
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
          </tbody>
        </table>
      </div>
    `;let e=document.getElementById(`btnNuevaCita`);e&&(e.onclick=()=>document.getElementById(`modalAgendarCita`)?.showModal());let a=document.getElementById(`btnIrTienda`);a&&(a.onclick=()=>r(`tienda`));let o=document.getElementById(`btnVerPerfilBebe`);o&&(o.onclick=()=>n(t));let s=document.getElementById(`formVincularNido`);if(s){let e=s.querySelector(`input[name="rutBebe"]`);e&&e.addEventListener(`input`,e=>{e.target.value=le(e.target.value)}),s.addEventListener(`submit`,async e=>{e.preventDefault();let n=s.querySelector(`button`);if(n.disabled=!0,n.textContent=`Vinculando...`,!x(s.rutBebe.value)){D(`El RUT ingresado no es válido.`,`warning`),n.disabled=!1,n.textContent=`Vincular Nido`;return}try{await l(t.uid,s.rutBebe.value,s.nombreBebe.value),D(`¡Nido vinculado correctamente!`,`success`),setTimeout(()=>location.reload(),1500)}catch{D(`Error al vincular el nido`,`error`),n.disabled=!1,n.textContent=`Vincular Nido`}})}let c=document.querySelector(`#parent-appointments-table tbody`);if(c){c.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">Cargando citas...</td></tr>`;let e=await pe(t.uid);e.length===0?c.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>`:c.innerHTML=e.map(e=>`
          <tr>
            <td class="p-4 font-medium">${O(e.servicio)}</td>
            <td class="p-4 text-gray-600">${O(e.profesionalNombre||`Por asignar`)}</td>
            <td class="p-4">${O(e.fecha)} ${O(e.hora)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-full text-xs font-bold ${e.estado===`completada`?`bg-green-100 text-green-700`:e.estado===`activo`?`bg-blue-100 text-blue-700`:`bg-yellow-100 text-yellow-700`}">${O(e.estado)}</span>
            </td>
          </tr>
        `).join(``)}}else e===`tienda`?(i.innerHTML=`
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
    `,W(`Todos`),i.querySelectorAll(`.btn-categoria`).forEach(e=>{e.addEventListener(`click`,e=>{i.querySelectorAll(`.btn-categoria`).forEach(e=>{e.className=`btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold`}),e.target.className=`btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold`,W(e.target.dataset.cat)})})):e===`pedidos`?(i.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Pedidos</h2>
      <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden" id="pedidos-container">
        <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
      </div>
    `,ye(t.uid)):e===`bitacora`&&(i.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-2">🍼 Historial del Bebé</h2>
      <p class="text-sm text-gray-500 mb-6">Información e indicaciones ingresadas por las cuidadoras y consejeras de LactaNido.</p>
      <div class="space-y-6" id="bitacora-timeline">
        <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras y fichas...</p>
      </div>
    `,be(t.nidoId))}async function W(e){let t=document.getElementById(`tienda-productos-grid`);if(t)try{let n=await E(),r=e===`Todos`?n:n.filter(t=>t.categoria===e);if(r.length===0){t.innerHTML=`<p class="col-span-full text-center text-gray-400 py-10 italic">No hay productos disponibles en esta categoría.</p>`;return}t.innerHTML=r.map(e=>`
      <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col items-center hover:shadow-md transition-all">
        <img src="${O(e.imagenUrl||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`)}" alt="${O(e.nombre)}" class="w-full h-32 object-cover rounded-lg mb-4" />
        <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2 h-10">${O(e.nombre)}</h4>
        <p class="text-[#e87a30] font-black text-xl mb-1">$${e.precio.toLocaleString(`cl-CL`)}</p>
        <p class="text-xs text-gray-400 mb-4">Stock disponible: ${e.stock}</p>
        <button data-id="${O(e.id)}" data-nombre="${O(e.nombre)}" data-precio="${e.precio}" data-stock="${e.stock}" class="btn-agregar-carrito w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#e87a30] transition-colors flex items-center justify-center gap-2">
          Agregar 🛒
        </button>
      </div>
    `).join(``),t.querySelectorAll(`.btn-agregar-carrito`).forEach(e=>{e.onclick=()=>{let{id:t,nombre:n,precio:r,stock:i}=e.dataset;z({productoId:t,nombre:n,precio:r,stock:i})}})}catch{t.innerHTML=`<p class="col-span-full text-center text-red-500 py-10 italic">Error al cargar productos.</p>`}}async function ye(e){let t=document.getElementById(`pedidos-container`);if(t)try{let n=await de(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes compras registradas en tu cuenta.</p>`;return}t.innerHTML=`
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
              <td class="p-4 font-mono text-xs">${O(e.id.slice(0,8))}...</td>
              <td class="p-4 text-gray-700">
                ${e.productos.map(e=>`${O(e.nombre)} x${e.cantidad}`).join(`, `)}
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
    `}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar pedidos.</p>`}}async function be(e){let t=document.getElementById(`bitacora-timeline`);if(t){if(!e){t.innerHTML=`<p class="text-center py-10 text-red-500 italic font-semibold">Debes vincular tu Nido familiar para ver las bitácoras del bebé.</p>`;return}try{let n=await ie(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No hay registros de cuidado cargados todavía.</p>`;return}t.innerHTML=n.map(e=>{let t=e.creadoEn?new Date(e.creadoEn):new Date(0);return`
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-emerald-500 slide-up">
          <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
            <div>
              <span class="text-xs text-gray-400 font-bold block">${t.toLocaleDateString(`es-CL`)} a las ${t.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})} hrs</span>
              <h4 class="font-bold text-lg text-[#181411]">Reporte de Cuidado</h4>
              <p class="text-xs text-[#887263]">Registrado por: ${O(e.prestadorNombre||`Prestador`)} • Turno efectivo: ${e.horasEfectivas||0} hrs</p>
            </div>
            <span class="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">🍼 ${O(e.prestadorRol||`Cuidadora`)}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-xs">
            <div><strong>🥛 Alimentación:</strong> ${O(e.tipoAlimentacion||`N/A`)}</div>
            <div><strong>😴 Horas Sueño:</strong> ${e.horasSueno||0}</div>
            <div><strong>🧻 Pañales:</strong> ${e.cantidadPanales||0}</div>
          </div>
          <div class="text-sm text-gray-600">${O(e.observaciones||`Sin observaciones`)}</div>
        </div>
      `}).join(``)}catch(e){console.error(`Error cargando bitácoras:`,e),t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error cargando bitácoras.</p>`}}}async function G(e){let t=document.getElementById(`prestador-fichas-list`);if(t){if(!e){console.error(`renderPrestadorFichas fue llamado sin UID.`),t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error: No se pudo identificar al prestador.</p>`;return}try{let n=await v(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes fichas registradas aún.</p>`;return}t.innerHTML=n.map(e=>`
      <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
          <span>Fecha: ${O(e.fecha)} (${e.horasEfectivas} hrs)</span>
          <span class="text-xs text-gray-400 font-normal">${new Date(e.creadoEn).toLocaleDateString()}</span>
        </div>
        <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${O(e.tipoAlimentacion||`N/A`)} • Horas Sueño: ${e.horasSueno||0}h • Pañales: ${e.cantidadPanales||0}</p>
        <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${O(e.observaciones||`Ninguna`)}</p>
      </div>
    `).join(``)}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>`,D(`Error al cargar historial de fichas`,`error`)}}}async function xe(e,t,n){let r=document.getElementById(`dashboard-content`);if(!r)return;let i=t?.uid||t?.id;if(e===`dashboard`||e===`citas`){let e=await k(`Consultor`,i);r.innerHTML=`
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Buen día, ${O(t.nombre)} 👩‍⚕️</h2>
          <p class="text-gray-500 text-sm">Gestiona tus consultas y reporta las bitácoras del bebé.</p>
        </div>
      </div>
      <h3 class="font-bold text-lg mb-4">Tus Citas Programadas</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${e.length>0?e.map(e=>`
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${O(e.hora)}</span>
              <h4 class="font-bold text-lg mt-2">${O(e.nombre)}</h4>
              <p class="text-xs text-gray-500 mb-2">Fecha: ${O(e.fecha)} • Creado por: ${O(e.email)}</p>
              <p class="text-sm font-medium text-gray-600 mb-4">Servicio: ${O(e.servicio)} (${e.duracion} hrs)</p>
            </div>
            <div class="flex flex-col gap-2">
              ${e.estado===`completada`?`
                <span class="text-center text-xs bg-green-100 text-green-700 py-2 rounded-lg font-bold">Bitácora Registrada ✅</span>
              `:`
                <button data-id="${O(e.id)}" data-nid="${O(e.nidoId||``)}" class="btn-abrir-ficha w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-indigo-700 transition shadow">
                  Registrar Bitácora 📝
                </button>
              `}
            </div>
          </div>
        `).join(``):`
          <div class="col-span-full p-8 text-center text-gray-400 italic">No tienes citas asignadas.</div>
        `}
      </div>
    `,r.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:r}=e.dataset;n(t,r)}})}else if(e===`historial_fichas`)r.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-6">🤱 Historial de Fichas Emitidas</h2>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
      </div>
    `,G(i);else if(e===`horarios`){let e=t.horarios||{},n=(t,n)=>e[t]&&e[t][n]?`<button data-day="${t}" data-block="${n}" class="btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Disponible</button>`:`<button data-day="${t}" data-block="${n}" class="btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition">No Disp.</button>`;r.innerHTML=`
      <h3 class="font-bold text-xl mb-2">Gestión de Horarios Base</h3>
      <p class="text-sm text-[#887263] mb-6">Selecciona tus horarios disponibles.</p>
      <div class="glass-panel p-6 rounded-2xl">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-center text-sm border-collapse">
            <thead>
              <tr class="text-[#887263]">
                <th class="p-2 border-b border-[#e5dfdc]">Hora</th>
                <th class="p-2 border-b border-[#e5dfdc]">Lunes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Martes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Miércoles</th>
                <th class="p-2 border-b border-[#e5dfdc]">Jueves</th>
                <th class="p-2 border-b border-[#e5dfdc]">Viernes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Sábado</th>
                <th class="p-2 border-b border-[#e5dfdc]">Domingo</th>
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
                <td class="p-2">${n(`Sabado`,`09:00-13:00`)}</td>
                <td class="p-2">${n(`Domingo`,`09:00-13:00`)}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-[#181411]">14:00 - 18:00</td>
                <td class="p-2">${n(`Lunes`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Martes`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Miercoles`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Jueves`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Viernes`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Sabado`,`14:00-18:00`)}</td>
                <td class="p-2">${n(`Domingo`,`14:00-18:00`)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex justify-end">
           <button id="btnGuardarHorarios" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md">Guardar Horarios</button>
        </div>
      </div>
    `;let a=r.querySelectorAll(`.btn-bloque`);a.forEach(e=>{e.addEventListener(`click`,()=>{e.classList.contains(`bg-green-100`)?(e.className=`btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition`,e.textContent=`No Disp.`):(e.className=`btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition`,e.textContent=`Disponible`)})});let o=document.getElementById(`btnGuardarHorarios`);o.onclick=async()=>{o.textContent=`Guardando...`,o.disabled=!0;let e={};a.forEach(t=>{let n=t.dataset.day,r=t.dataset.block,i=t.classList.contains(`bg-green-100`);e[n]||(e[n]={}),e[n][r]=i});try{await w(i,e),D(`Horarios base actualizados`,`success`)}catch{D(`Error al actualizar horarios`,`error`)}finally{o.textContent=`Guardar Horarios`,o.disabled=!1}}}else if(e===`tarifas`){let e=t.tarifas||{baseHora:``,finDeSemanaHora:``,festivoHora:``};r.innerHTML=`
      <h3 class="font-bold text-2xl mb-2 text-[#181411]">Mis Tarifas 💰</h3>
      <p class="text-sm text-[#887263] mb-6">Configura el valor por hora de tus servicios para las consultas.</p>
      
      <div class="glass-panel p-6 rounded-2xl max-w-lg border-t-4 border-[#e87a30]">
        <form id="form-tarifas" class="space-y-5">
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-base" value="${e.baseHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="15000">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Fin de Semana (Sáb y Dom)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-finde" value="${e.finDeSemanaHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="20000">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Días Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-festivo" value="${e.festivoHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="25000">
            </div>
          </div>
          
          <div class="pt-4">
            <button type="submit" id="btnGuardarTarifas" 
              class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md">
              Guardar Mis Tarifas
            </button>
          </div>
        </form>
      </div>
    `,document.getElementById(`form-tarifas`).onsubmit=async e=>{e.preventDefault();let n=document.getElementById(`btnGuardarTarifas`);n.disabled=!0,n.textContent=`Guardando...`;try{let e={baseHora:parseInt(document.getElementById(`tarifa-base`).value),finDeSemanaHora:parseInt(document.getElementById(`tarifa-finde`).value),festivoHora:parseInt(document.getElementById(`tarifa-festivo`).value)};await C(i,e),D(`Tarifas guardadas exitosamente`,`success`),t.tarifas=e}catch(e){D(`Error al guardar las tarifas`,`error`),console.error(e)}finally{n.disabled=!1,n.textContent=`Guardar Mis Tarifas`}}}}async function Se(e,t,n){let r=document.getElementById(`dashboard-content`);if(!r)return;let i=t?.uid||t?.id;if(!i||i===`undefined`){console.error(`renderCuidadoraTab fue llamado sin un UID de usuario válido.`,{userData:t}),r.innerHTML=`<div class="text-center p-8"><p class="text-red-500 font-bold">Error Crítico</p><p class="text-gray-600">No se pudo identificar la cuenta del usuario (UID faltante). Por favor, recarga la página.</p></div>`;return}if(e===`dashboard`){let e=await k(`Cuidador`,i);r.innerHTML=`
      <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-[#181411]">Hola ${O(t.nombre)} 🍼</h2>
            <p class="text-[#887263]">Gestiona tus turnos asignados de cuidado infantil.</p>
          </div>
        </div>
      </div>
      <h3 class="font-bold text-lg mb-4">Turnos de Cuidado Asignados</h3>
      <div class="space-y-4" id="cuidadora-turnos-list">
        ${e.length>0?e.map(e=>`
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 class="font-bold text-lg">${O(e.nombre)}</h4>
              <p class="text-xs text-gray-500">Fecha: ${O(e.fecha)} • Hora: ${O(e.hora)} • Duración: ${e.duracion} hrs</p>
              <p class="text-sm text-gray-600 mt-1">${O(e.email)}</p>
            </div>
            <div>
              ${e.estado===`completada`?`
                <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>
              `:`
                <button data-id="${O(e.id)}" data-nid="${O(e.nidoId||``)}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                  Completar Bitácora 📝
                </button>
              `}
            </div>
          </div>
        `).join(``):`
          <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
        `}
      </div>
    `,r.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:r}=e.dataset;n(t,r)}})}else if(e===`historial_fichas`)r.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Historial de Bitácoras Entregadas</h2>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
      </div>
    `,G(i);else if(e===`disponibilidad`)r.innerHTML=`
      <div class="space-y-8">
        <div>
          <h3 class="font-bold text-xl mb-2">Mis Turnos Disponibles</h3>
          <p class="text-sm text-gray-500 mb-4">Declara los turnos en los que estás disponible para recibir reservas.</p>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <button id="btnOpenAddSlotModal" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm">
              + Declarar Nuevo Turno Disponible
            </button>
            <h4 class="font-bold text-sm text-gray-800 mt-6 mb-2">Turnos Activos:</h4>
            <ul class="space-y-2" id="caregiver-availability-slots-list"></ul>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-xl mb-2">Bloqueo de Días Completos</h3>
          <p class="text-sm text-gray-500 mb-4">Ingresa fechas específicas que deseas bloquear por vacaciones o descanso.</p>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <div class="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div class="flex-1 w-full">
                <label class="block text-xs font-bold text-gray-700 mb-1">Fecha a bloquear</label>
                <input type="date" id="bloqueo-date" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div class="flex-1 w-full">
                <label class="block text-xs font-bold text-gray-700 mb-1">Motivo (Opcional)</label>
                <input type="text" id="bloqueo-motivo" placeholder="Ej. Cumpleaños, Descanso..." class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button id="btnAñadirBloqueo" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full md:w-auto h-[38px]">Añadir Bloqueo</button>
            </div>
            <h4 class="font-bold text-sm text-gray-800 mb-2">Bloqueos Activos:</h4>
            <ul class="space-y-2" id="caregiver-blocked-days-list"></ul>
          </div>
        </div>
      </div>

      <div id="addSlotModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center p-4 z-[100]">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <h3 class="font-bold text-lg mb-4">Declarar Nuevo Turno</h3>
          <form id="addSlotForm" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora de Inicio</label>
              <input type="datetime-local" id="slot-start-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora de Fin</label>
              <input type="datetime-local" id="slot-end-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Zona de Atención</label>
              <input type="text" id="slot-zona" placeholder="Ej: Las Condes, Providencia" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div class="flex justify-end gap-4 pt-4">
              <button type="button" id="btnCloseAddSlotModal" class="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
              <button type="submit" id="btnSaveSlot" class="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Guardar Turno</button>
            </div>
          </form>
        </div>
      </div>
    `,Ce(i);else if(e===`tarifas`){let e=t.tarifas||{baseHora:``,finDeSemanaHora:``,festivoHora:``};r.innerHTML=`
      <h3 class="font-bold text-2xl mb-2 text-[#181411]">Mis Tarifas 💰</h3>
      <p class="text-sm text-[#887263] mb-6">Configura el valor por hora de tus servicios para los padres.</p>
      
      <div class="glass-panel p-6 rounded-2xl max-w-lg border-t-4 border-[#e87a30]">
        <form id="form-tarifas" class="space-y-5">
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-base" value="${e.baseHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="15000">
            </div>
            <p class="text-xs text-gray-400 mt-1">Valor por cada hora en días hábiles.</p>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Fin de Semana (Sáb y Dom)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-finde" value="${e.finDeSemanaHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="20000">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Días Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-festivo" value="${e.festivoHora||``}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="25000">
            </div>
          </div>
          
          <div class="pt-4">
            <button type="submit" id="btnGuardarTarifas" 
              class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md">
              Guardar Mis Tarifas
            </button>
          </div>

        </form>
      </div>
    `,document.getElementById(`form-tarifas`).onsubmit=async e=>{e.preventDefault();let n=document.getElementById(`btnGuardarTarifas`);n.disabled=!0,n.textContent=`Guardando...`;try{let e={baseHora:parseInt(document.getElementById(`tarifa-base`).value),finDeSemanaHora:parseInt(document.getElementById(`tarifa-finde`).value),festivoHora:parseInt(document.getElementById(`tarifa-festivo`).value)};await C(i,e),D(`Tarifas guardadas exitosamente`,`success`),t.tarifas=e}catch(e){D(`Error al guardar las tarifas`,`error`),console.error(e)}finally{n.disabled=!1,n.textContent=`Guardar Mis Tarifas`}}}}function Ce(e){if(!e||e===`undefined`){console.error(`setupAvailabilityHandlers fue llamado sin un UID válido. Abortando.`),D(`Error de sesión, no se puede gestionar la disponibilidad.`,`error`);return}K(e),q(e);let t=document.getElementById(`addSlotModal`),n=document.getElementById(`btnOpenAddSlotModal`),r=document.getElementById(`btnCloseAddSlotModal`),i=document.getElementById(`addSlotForm`);n.onclick=()=>{t.classList.remove(`hidden`),t.classList.add(`flex`)},r.onclick=()=>{t.classList.add(`hidden`),t.classList.remove(`flex`)},t.onclick=e=>{e.target===t&&(t.classList.add(`hidden`),t.classList.remove(`flex`))},i.onsubmit=async n=>{n.preventDefault();let r=document.getElementById(`slot-start-date`).value,a=document.getElementById(`slot-end-date`).value,o=document.getElementById(`slot-zona`).value;if(new Date(a)<=new Date(r)){D(`La fecha de fin debe ser posterior a la de inicio.`,`error`);return}let s=document.getElementById(`btnSaveSlot`);s.disabled=!0,s.textContent=`Guardando...`;try{await T(e,{servicio:`cuidado`,fechaInicio:new Date(r),fechaFin:new Date(a),zona:o}),D(`Turno disponible agregado con éxito`,`success`),t.classList.add(`hidden`),t.classList.remove(`flex`),i.reset(),K(e)}catch(e){D(`Error al guardar el turno.`,`error`),console.error(e)}finally{s.disabled=!1,s.textContent=`Guardar Turno`}};let a=document.getElementById(`btnAñadirBloqueo`);a.onclick=async()=>{let t=document.getElementById(`bloqueo-date`),n=document.getElementById(`bloqueo-motivo`);if(!t.value){D(`Selecciona una fecha`,`warning`);return}a.disabled=!0;try{await ue(e,t.value,n.value),D(`Fecha bloqueada con éxito`,`success`),t.value=``,n.value=``,q(e)}catch{D(`Error al bloquear fecha`,`error`)}finally{a.disabled=!1}}}async function K(e){let t=document.getElementById(`caregiver-availability-slots-list`);if(t){if(!e||e===`undefined`){t.innerHTML=`<li class="p-2 text-center text-red-500 italic">Error: ID de usuario no encontrado.</li>`;return}t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">Cargando turnos...</li>`;try{let n=await p(e);n.length===0?t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">No tienes turnos futuros disponibles.</li>`:(t.innerHTML=n.map(e=>{let t=e.reservado,n=t?`bg-orange-100 text-orange-700`:`bg-green-100 text-green-700`,r=t?`Reservado`:`Disponible`;return`
          <li class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
            <div>
              <p class="font-bold text-gray-800 text-sm">${we(e.fechaInicio,e.fechaFin)}</p>
              <p class="text-xs text-gray-500">📍 ${O(e.zona)}</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs font-bold px-2 py-1 rounded-full ${n}">${r}</span>
              ${t?``:`
                <button data-id="${O(e.id)}" class="btn-delete-slot text-red-400 hover:text-red-700 text-xs font-semibold">Eliminar</button>
              `}
            </div>
          </li>
        `}).join(``),t.querySelectorAll(`.btn-delete-slot`).forEach(t=>{t.onclick=async()=>{if(confirm(`¿Seguro que quieres eliminar este turno disponible?`))try{await r(e,t.dataset.id),D(`Turno eliminado`,`success`),K(e)}catch{D(`Error al eliminar el turno`,`error`)}}}))}catch{t.innerHTML=`<li class="p-2 text-center text-red-500 italic">Error al cargar los turnos.</li>`}}}function we(e,t){let n=e.toDate(),r=t.toDate(),i={weekday:`short`,day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`};return`${n.toLocaleDateString(`es-CL`,i)} → ${r.toLocaleDateString(`es-CL`,i)}`}async function q(e){let t=document.getElementById(`caregiver-blocked-days-list`);if(!t)return;if(!e||e===`undefined`){t.innerHTML=`<li class="p-2 text-center text-red-500 italic">Error: ID de usuario no encontrado.</li>`;return}t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">Cargando bloqueos...</li>`;let r=[];try{r=await n(e)}catch(e){console.warn(`No se pudieron cargar los bloqueos. Asumiendo lista vacía.`,e)}r.length===0?t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">No tienes días bloqueados.</li>`:(t.innerHTML=r.map(e=>`
      <li class="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-100">
        <div class="flex items-center gap-3">
          <span class="text-sm">⛔</span>
          <div>
            <p class="font-bold text-red-800 text-sm">${O(e.date)}</p>
            <p class="text-xs text-red-600">${O(e.motivo||`Sin motivo`)}</p>
          </div>
        </div>
        <button data-id="${O(e.id)}" class="btn-delete-block text-red-400 hover:text-red-700 text-xs font-semibold">Eliminar</button>
      </li>
    `).join(``),t.querySelectorAll(`.btn-delete-block`).forEach(t=>{t.onclick=async()=>{if(confirm(`¿Seguro que quieres eliminar este bloqueo?`))try{await d(e,t.dataset.id),D(`Bloqueo eliminado`,`success`),q(e)}catch{D(`Error al eliminar bloqueo`,`error`)}}}))}async function Te(e,t=`Aprobación de perfil estándar.`){let n=h(u),r=c(u),i=r.currentUser?r.currentUser.uid:null;if(!i)throw Error(`No se pudo identificar al administrador. Inicia sesión nuevamente.`);try{return await me(n,async r=>{let a=s(n,`usuarios`,e);r.update(a,{estado:`activo`});let o=s(g(n,`auditLogs`));r.set(o,{adminUid:i,action:`APPROVE_USER`,targetType:`USER`,targetId:e,reason:t,timestamp:_()}),console.log(`Transacción de aprobación preparada para el usuario:`,e)}),{success:!0,message:`Usuario aprobado y acción auditada correctamente.`}}catch(e){throw console.error(`Error en la transacción de aprobación:`,e),Error(e.message||`La acción de aprobación falló.`)}}function J(e){if(!e)return[];let t=e.rol;return Array.isArray(t)?t:t?[t]:[]}function Y(e){return J(e)[0]||`padre`}function X(e,t){return J(e).includes(t)}async function Z(e,t){let n=document.getElementById(`dashboard-content`);if(n){if(e===`dashboard`){let e=await ae();n.innerHTML=`
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
    `,$(),De();try{let e=await b(),t=document.getElementById(`admin-orders-count`);t&&(t.textContent=e.length)}catch(e){console.warn(`No se pudo cargar el conteo de pedidos`,e)}}else if(e===`usuarios`)n.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Usuarios</h2>
      <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <p class="text-gray-600">Esta sección está en desarrollo. Próximamente, aquí encontrarás una tabla completa con todos los usuarios de la plataforma, con herramientas de búsqueda, filtro y acciones de moderación directa (como editar perfiles o eliminar cuentas).</p>
      </div>
    `;else if(e===`admin_tienda`){n.innerHTML=`
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Tienda & Inventario</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h4 class="font-bold text-lg text-[#181411] mb-4">Productos en Inventario</h4>
          <div class="flex-1 overflow-y-auto space-y-3 max-h-[500px]" id="admin-inventory-list">
            <p class="text-gray-400 italic text-sm">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    `,Q(),Ee();let e=document.getElementById(`adminAddProductForm`);e&&e.addEventListener(`submit`,async t=>{t.preventDefault();let n=new FormData(e),r={nombre:n.get(`nombre`),precio:parseFloat(n.get(`precio`)),stock:parseInt(n.get(`stock`)),categoria:n.get(`categoria`),imagenUrl:n.get(`imagenUrl`)||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`};try{await S(r),D(`Producto creado con éxito`,`success`),e.reset(),Q()}catch{D(`Error al crear producto`,`error`)}})}}}async function Q(){let e=document.getElementById(`admin-inventory-list`);if(e)try{let t=await E();if(t.length===0){e.innerHTML=`<p class="text-gray-400 italic text-sm">No hay productos cargados.</p>`;return}e.innerHTML=t.map(e=>`
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
    `).join(``),e.querySelectorAll(`.btn-delete-product`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Estás seguro de eliminar este producto?`))try{await ce(e.dataset.id),D(`Producto eliminado`,`success`),Q()}catch{D(`Error al eliminar producto`,`error`)}}})}catch{e.innerHTML=`<p class="text-red-500 italic text-sm">Error cargando inventario.</p>`}}async function Ee(){let e=document.getElementById(`admin-orders-list`);if(e)try{let t=await b();if(t.length===0){e.innerHTML=`<p class="text-center py-6 text-gray-400 italic">No hay registros de compras.</p>`;return}e.innerHTML=`
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
    `}catch{e.innerHTML=`<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>`}}async function $(){let e=document.getElementById(`pending-users-list`);if(e)try{let t=await m();if(t.length===0){e.innerHTML=`<p class="text-sm text-gray-500 italic">No hay solicitudes nuevas.</p>`;return}e.innerHTML=``,t.forEach(t=>{let n=document.createElement(`div`);n.className=`flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200`,n.innerHTML=`
        <div>
          <p class="font-bold text-sm">${O(t.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${O(Array.isArray(t.rol)?t.rol.join(`, `):t.rol)}</span></p>
          <p class="text-[10px] text-gray-500">${O(t.email)} • RUT: ${O(t.rut||`No registrado`)}</p>
        </div>
        <button data-uid="${O(t.id)}" data-nombre="${O(t.nombre)}" data-email="${O(t.email)}" class="btn-approve bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-green-600 transition-colors">Aprobar</button>
      `,e.appendChild(n)}),e.querySelectorAll(`.btn-approve`).forEach(e=>e.addEventListener(`click`,async e=>{let{uid:t,nombre:n,email:r}=e.target.dataset,i=e.target;i.disabled=!0;try{await Te(t,`Aprobado desde el panel de administración.`),D(`Usuario aprobado con éxito (acción auditada).`,`success`),y.sendApprovalNotification(n,r),$()}catch(e){console.error(`Error en el flujo de aprobación:`,e),D(e.message||`Error al aprobar usuario`,`error`),i.disabled=!1}}))}catch{e.innerHTML=`<p class="text-xs text-red-500">Error al cargar.</p>`}}async function De(){let e=document.getElementById(`admin-latest-users`);if(e)try{let n=await fe();if(n.length===0){e.innerHTML=`<p class="text-sm text-gray-400">No hay usuarios registrados.</p>`;return}e.innerHTML=n.map(e=>{let t=!X(e,`padre`),n=t?`bg-green-500`:`bg-blue-500`,r=e.fechaRegistro?new Date(e.fechaRegistro).toLocaleDateString():`---`,i=e.puedeCrearTips||!1,a=t?`
        <div class="flex items-center gap-1 text-[10px] text-gray-500">
          <label for="tips-${e.id}" class="cursor-pointer">Tips:</label>
          <input type="checkbox" id="tips-${e.id}" data-uid="${e.id}" class="toggle-tips-permission" ${i?`checked`:``}>
        </div>
      `:``;return`
        <li class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 ${n} rounded-full"></span> ${O(e.nombre)}
          </span>
          <span class="flex items-center gap-3 text-gray-400 text-xs">${a} ${O(r)}</span>
        </li>
      `}).join(``),e.querySelectorAll(`.toggle-tips-permission`).forEach(e=>{e.addEventListener(`change`,async e=>{let{uid:n}=e.target.dataset,r=e.target.checked;try{await t(s(a,`usuarios`,n),{puedeCrearTips:r}),D(`Permiso para crear tips ${r?`otorgado`:`revocado`}.`,`success`)}catch(t){console.error(`Error al actualizar permiso de tips:`,t),D(`Error al actualizar permiso.`,`error`),e.target.checked=!r}})})}catch{D(`Error al cargar últimos registros`,`error`)}}document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`dashboard-content`),t=document.getElementById(`sidebar-nav`),n=document.getElementById(`user-name`),r=document.getElementById(`user-role-label`),a=document.getElementById(`user-initial`),s=`resumen`,c=null,l=`padre`;oe(),o(),ee(),_e({renderContent:m,getCurrentUserData:()=>c,getCurrentUserRole:()=>l}),ge({renderContent:m,getCurrentUserData:()=>c}),B();let u={padre:[{label:`Resumen`,icon:`🏠`,action:`resumen`},{label:`Tienda Bebé 🛍️`,action:`tienda`,icon:`🧸`},{label:`Mis Pedidos 📦`,action:`pedidos`,icon:`🚚`},{label:`Bitácoras Bebé 📋`,action:`bitacora`,icon:`🍼`},{label:`Perfil Nido`,action:`modalPerfilBebe`,icon:`👶`,isModal:!0}],consejera:[{label:`Dashboard`,icon:`📊`,action:`dashboard`},{label:`Mis Citas`,icon:`🗓️`,action:`citas`},{label:`Fichas Guardadas`,icon:`🤱`,action:`historial_fichas`},{label:`Mi Horario`,icon:`⏱️`,action:`horarios`},{label:`Mis Tarifas`,icon:`💰`,action:`tarifas`},{label:`Gestionar Tips`,icon:`💡`,action:`gestionar_tips`,permission:`puedeCrearTips`}],cuidadora:[{label:`Turnos`,icon:`🌙`,action:`dashboard`},{label:`Fichas Guardadas`,icon:`📋`,action:`historial_fichas`},{label:`Disponibilidad`,icon:`🗓️`,action:`disponibilidad`},{label:`Mis Tarifas`,icon:`💰`,action:`tarifas`},{label:`Gestionar Tips`,icon:`💡`,action:`gestionar_tips`,permission:`puedeCrearTips`}],admin:[{label:`Visión General`,icon:`👁️`,action:`dashboard`},{label:`Usuarios`,icon:`👥`,action:`usuarios`},{label:`Pedidos / Tienda`,icon:`🛍️`,action:`admin_tienda`}]};function d(e,t,n){if(e===`modalPerfilBebe`){H(n);return}s=e,p(t,n),m(t,n)}function p(e,n){if(!t)return;let r=(u[e]||[]).filter(e=>!e.permission||e.permission&&n[e.permission]===!0),i=``;e===`padre`&&(i=`
        <button id="btnVerCarrito" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[#887263] hover:bg-[#f4eade] hover:text-[#181411] w-full mt-2 relative">
          <span class="flex items-center gap-3">
            <span class="text-xl">🛒</span> Ver Carrito
          </span>
          <span id="cart-badge" class="bg-[#e87a30] text-white text-xs px-2 py-0.5 rounded-full font-bold ${F()===0?`hidden`:``}">
            ${F()}
          </span>
        </button>
      `),t.innerHTML=r.map(e=>{let t=s===e.action;return`
        <a href="#" data-action="${e.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${t?`bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]`:`text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]`}">
          <span class="text-xl">${e.icon}</span>
          ${e.label}
        </a>
      `}).join(``)+i,t.querySelectorAll(`.nav-item, #btnVerCarrito`).forEach(t=>{t.addEventListener(`click`,r=>{r.preventDefault();let i=t.dataset.action||`carrito`;i===`carrito`?he():d(i,e,n)})})}async function m(t,n){if(e){e.innerHTML=`
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="animate-pulse font-medium">Cargando sección...</p>
      </div>`;try{t===`padre`?await ve(s,n,H,d):t===`consejera`?await xe(s,n,U):t===`cuidadora`?await Se(s,n,U):t===`admin`&&await Z(s,n),s===`gestionar_tips`&&await se(`dashboard-content`)}catch(t){console.error(`Error cargando pestaña:`,t),e.innerHTML=`
        <div class="text-center py-10">
          <p class="text-red-500 font-bold mb-2">No pudimos cargar esta sección.</p>
          <p class="text-sm text-gray-500">Intenta recargar la página. Si el problema persiste, contáctanos.</p>
        </div>`}}}function h(e){let t=J(e);if(t.length>1)return t.map(e=>({consejera:`Consejera`,cuidadora:`Cuidadora`,padre:`Padre`,admin:`Admin`})[e]||e).join(` / `);let n=Y(e);return n===`admin`?`Administrador`:n===`padre`&&e.subtipo?e.subtipo===`madre`?`Mamá`:`Papá`:{consejera:`Consejera`,cuidadora:`Cuidadora`,padre:`Padre`}[n]||n}function g(e,t){let n=J(e),r=document.getElementById(`user-role-label`),i=r?r.parentElement:null;if(!i)return;let a=document.getElementById(`role-switcher`);if(a&&a.remove(),n.length>1){r&&(r.style.display=`none`);let e=document.createElement(`select`);e.id=`role-switcher`,e.className=`mt-1 text-xs bg-white border border-gray-300 rounded p-1 focus:ring-1 focus:ring-[#e87a30] w-full text-[#887263] font-bold cursor-pointer`,n.forEach(t=>{let n=document.createElement(`option`);n.value=t,n.textContent={consejera:`Consejera`,cuidadora:`Cuidadora`,padre:`Padre`,admin:`Admin`}[t]||t.charAt(0).toUpperCase()+t.slice(1),t===l&&(n.selected=!0),e.appendChild(n)}),e.addEventListener(`change`,e=>{t(e.target.value)}),i.appendChild(e)}else r&&(r.style.display=`block`,r.textContent=h(e))}function _(e,t){l=e,s=e===`padre`?`resumen`:`dashboard`,p(e,t),m(e,t),g(t,e=>{_(e,t)})}function v(e){if(!e)return`unknown`;let t=String(e).trim().toLowerCase(),n=t.includes(`activo`),r=t.includes(`pendiente`)||t.includes(`pending`);return n&&!r?`activo`:!n&&r?`pendiente`:n&&r?`activo`:t}function y(e){return v(e?.estado)===`pendiente`}te(f,async e=>{if(e)try{let t=await i(e.uid);if(t)if(t.uid=e.uid,t.id=e.uid,c=t,y(t)&&!X(t,`admin`))b(t.nombre);else{let e=Y(t);n&&(n.textContent=t?.nombre||`Usuario`),a&&(a.textContent=(t?.nombre||`U`).charAt(0).toUpperCase()),r&&(r.textContent=h(t)),_(e,t)}else D(`Perfil de usuario no encontrado`,`error`),setTimeout(()=>window.location.href=`index.html`,3e3)}catch(e){console.error(`Error cargando datos de usuario:`,e),D(`Error al conectar con el servidor`,`error`)}else window.location.href=`index.html`});function b(t){e&&(e.innerHTML=`
        <div class="glass-panel p-10 rounded-2xl text-center slide-up max-w-xl mx-auto mt-20">
          <div class="text-5xl mb-4">⌛</div>
          <h2 class="text-2xl font-black mb-4 text-[#181411]">Cuenta en Revisión</h2>
          <p class="text-[#887263]">Hola ${t||`Colaborador/a`}, estamos validando tus antecedentes. Te notificaremos por correo cuando tu perfil esté activo.</p>
          <button onclick="location.reload()" class="mt-6 text-sm text-[#e87a30] font-bold">Refrescar estado</button>
        </div>`)}let x=document.getElementById(`btnCerrarSesion`);x&&x.addEventListener(`click`,async e=>{e.preventDefault(),await ne(f),window.location.href=`index.html`})});