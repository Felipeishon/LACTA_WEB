import{i as e,m as t}from"./index.esm-BSMOF6mV.js";import{C as n,D as r,E as i,O as a,S as o,T as s,_ as c,a as l,b as u,c as d,d as ee,f as te,g as ne,h as re,i as ie,k as f,l as p,m,n as ae,o as oe,p as h,r as g,s as se,t as ce,u as le,v as ue,w as _,x as v,y}from"./formularios-Cxp3YuZf.js";function b(e,t=`info`){let n=document.getElementById(`toast-container`);n||(n=document.createElement(`div`),n.id=`toast-container`,n.className=`fixed bottom-5 right-5 z-50 flex flex-col gap-2`,document.body.appendChild(n));let r=document.createElement(`div`),i=`px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2`;t===`error`?(r.className=i+` bg-red-500`,r.innerHTML=`<span>❌</span> ${e}`):t===`success`?(r.className=i+` bg-green-500`,r.innerHTML=`<span>✅</span> ${e}`):(r.className=i+` bg-blue-500`,r.innerHTML=`<span>ℹ️</span> ${e}`),n.appendChild(r),requestAnimationFrame(()=>{r.classList.remove(`translate-y-10`,`opacity-0`)}),setTimeout(()=>{r.classList.add(`translate-y-10`,`opacity-0`),setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)},3e3)}var x=`modulepreload`,S=function(e){return`/`+e},C={},de=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=S(t,n),t in C)return;C[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:x,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function w(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}document.addEventListener(`DOMContentLoaded`,()=>{let x=document.getElementById(`dashboard-content`),S=document.getElementById(`sidebar-nav`),C=document.getElementById(`user-name`),T=document.getElementById(`user-role-label`),E=document.getElementById(`user-initial`),D=JSON.parse(localStorage.getItem(`lactanido_cart`)||`[]`),O=`resumen`,k=null,A=`padre`;ae(),a(),f();function j(){localStorage.setItem(`lactanido_cart`,JSON.stringify(D)),fe()}function fe(){let e=D.reduce((e,t)=>e+t.cantidad,0),t=document.getElementById(`cart-badge`);t&&(e>0?(t.textContent=e,t.classList.remove(`hidden`)):t.classList.add(`hidden`))}let pe={padre:[{label:`Resumen`,icon:`🏠`,action:`resumen`},{label:`Tienda Bebé 🛍️`,action:`tienda`,icon:`🧸`},{label:`Mis Pedidos 📦`,action:`pedidos`,icon:`🚚`},{label:`Bitácoras Bebé 📋`,action:`bitacora`,icon:`🍼`},{label:`Perfil Nido`,action:`modalPerfilBebe`,icon:`👶`,isModal:!0}],consejera:[{label:`Dashboard`,icon:`📊`,action:`dashboard`},{label:`Mis Citas`,icon:`🗓️`,action:`citas`},{label:`Fichas Guardadas`,icon:`🤱`,action:`historial_fichas`},{label:`Mi Horario`,icon:`⏱️`,action:`horarios`}],cuidadora:[{label:`Turnos`,icon:`🌙`,action:`dashboard`},{label:`Fichas Guardadas`,icon:`📋`,action:`historial_fichas`},{label:`Disponibilidad`,icon:`🗓️`,action:`disponibilidad`}],admin:[{label:`Visión General`,icon:`👁️`,action:`dashboard`},{label:`Usuarios`,icon:`👥`,action:`usuarios`},{label:`Pedidos / Tienda`,icon:`🛍️`,action:`admin_tienda`}]};function M(e,t,n){if(e===`modalPerfilBebe`){H(n);return}O=e,N(t,n),P(t,n)}function N(e,t){if(!S)return;let n=pe[e]||[],r=``;e===`padre`&&(r=`
        <button id="btnVerCarrito" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[#887263] hover:bg-[#f4eade] hover:text-[#181411] w-full mt-2 relative">
          <span class="flex items-center gap-3">
            <span class="text-xl">🛒</span> Ver Carrito
          </span>
          <span id="cart-badge" class="bg-[#e87a30] text-white text-xs px-2 py-0.5 rounded-full font-bold ${D.length===0?`hidden`:``}">
            ${D.reduce((e,t)=>e+t.cantidad,0)}
          </span>
        </button>
      `),S.innerHTML=n.map(e=>{let t=O===e.action;return`
        <a href="#" data-action="${e.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${t?`bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]`:`text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]`}">
          <span class="text-xl">${e.icon}</span>
          ${e.label}
        </a>
      `}).join(``)+r,S.querySelectorAll(`.nav-item, #btnVerCarrito`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault();let i=n.dataset.action||`carrito`;i===`carrito`?_e():M(i,e,t)})})}async function P(e,t){if(x){x.innerHTML=`
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="animate-pulse font-medium">Cargando sección...</p>
      </div>`;try{e===`padre`?await F(t):e===`consejera`?await z(t):e===`cuidadora`?await me(t):e===`admin`&&await he(t)}catch(e){console.error(`Error cargando pestaña:`,e),x.innerHTML=`
        <div class="text-center py-10">
          <p class="text-red-500 font-bold mb-2">Error al cargar la información:</p>
          <p class="text-xs text-red-400 bg-red-50 p-4 rounded-lg border border-red-100 max-w-lg mx-auto font-mono text-left whitespace-pre-wrap">${e.message}\n${e.stack}</p>
        </div>`}}}async function F(e){if(O===`resumen`){x.innerHTML=`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up">
          <div class="col-span-1 md:col-span-2 glass-panel p-8 rounded-2xl border-l-4 border-[#e87a30] relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 text-[#e87a30] opacity-10 text-9xl transition-transform group-hover:scale-110">🍼</div>
            <h2 class="text-3xl font-black text-[#181411] mb-2">¡Hola, ${w(e?.nombre?.split(` `)[0]||`Bienvenido/a`)}! 👋</h2>
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
            </tbody>
          </table>
        </div>
      `;let t=document.getElementById(`btnNuevaCita`);t&&(t.onclick=()=>document.getElementById(`modalAgendarCita`)?.showModal());let n=document.getElementById(`btnIrTienda`);n&&(n.onclick=()=>M(`tienda`,`padre`,e));let r=document.getElementById(`btnVerPerfilBebe`);r&&(r.onclick=()=>H(e));let i=document.getElementById(`formVincularNido`);if(i){let t=i.querySelector(`input[name="rutBebe"]`);t&&t.addEventListener(`input`,e=>{e.target.value=ce(e.target.value)}),i.addEventListener(`submit`,async t=>{t.preventDefault();let n=i.querySelector(`button`);if(n.disabled=!0,n.textContent=`Vinculando...`,!g(i.rutBebe.value)){b(`El RUT ingresado no es válido.`,`warning`),n.disabled=!1,n.textContent=`Vincular Nido`;return}try{await o(e.uid,i.rutBebe.value,i.nombreBebe.value),b(`¡Nido vinculado correctamente!`,`success`),setTimeout(()=>location.reload(),1500)}catch{b(`Error al vincular el nido`,`error`),n.disabled=!1,n.textContent=`Vincular Nido`}})}let a=document.querySelector(`#parent-appointments-table tbody`);if(a){a.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">Cargando citas...</td></tr>`;let t=await re(e.uid);t.length===0?a.innerHTML=`<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>`:a.innerHTML=t.map(e=>`
            <tr>
              <td class="p-4 font-medium">${w(e.servicio)}</td>
              <td class="p-4 text-gray-600">${w(e.profesionalNombre||`Por asignar`)}</td>
              <td class="p-4">${w(e.fecha)} ${w(e.hora)}</td>
              <td class="p-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${e.estado===`completada`?`bg-green-100 text-green-700`:e.estado===`activo`?`bg-blue-100 text-blue-700`:`bg-yellow-100 text-yellow-700`}">${w(e.estado)}</span>
              </td>
            </tr>
          `).join(``)}}else O===`tienda`?(x.innerHTML=`
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
      `,I(`Todos`),x.querySelectorAll(`.btn-categoria`).forEach(e=>{e.addEventListener(`click`,e=>{x.querySelectorAll(`.btn-categoria`).forEach(e=>{e.className=`btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold`}),e.target.className=`btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold`,I(e.target.dataset.cat)})})):O===`pedidos`?(x.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Pedidos</h2>
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden" id="pedidos-container">
          <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
        </div>
      `,R(e.uid)):O===`bitacora`&&(x.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-2">🍼 Historial del Bebé</h2>
        <p class="text-sm text-gray-500 mb-6">Información e indicaciones ingresadas por las cuidadoras y consejeras de LactaNido.</p>
        <div class="space-y-6" id="bitacora-timeline">
          <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras y fichas...</p>
        </div>
      `,L(e.nidoId))}async function I(e){let t=document.getElementById(`tienda-productos-grid`);if(t)try{let n=await p(),r=e===`Todos`?n:n.filter(t=>t.categoria===e);if(r.length===0){t.innerHTML=`<p class="col-span-full text-center text-gray-400 py-10 italic">No hay productos disponibles en esta categoría.</p>`;return}t.innerHTML=r.map(e=>`
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col items-center hover:shadow-md transition-all">
          <img src="${w(e.imagenUrl||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`)}" alt="${w(e.nombre)}" class="w-full h-32 object-cover rounded-lg mb-4" />
          <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2 h-10">${w(e.nombre)}</h4>
          <p class="text-[#e87a30] font-black text-xl mb-1">$${e.precio.toLocaleString(`cl-CL`)}</p>
          <p class="text-xs text-gray-400 mb-4">Stock disponible: ${e.stock}</p>
          <button data-id="${w(e.id)}" data-nombre="${w(e.nombre)}" data-precio="${e.precio}" data-stock="${e.stock}" class="btn-agregar-carrito w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#e87a30] transition-colors flex items-center justify-center gap-2">
            Agregar 🛒
          </button>
        </div>
      `).join(``),t.querySelectorAll(`.btn-agregar-carrito`).forEach(e=>{e.onclick=()=>{let{id:t,nombre:n,precio:r,stock:i}=e.dataset,a=parseInt(i),o=D.find(e=>e.productoId===t);if(o){if(o.cantidad>=a){b(`No puedes agregar más del stock disponible`,`warning`);return}o.cantidad++}else{if(a<=0){b(`Producto sin stock disponible`,`warning`);return}D.push({productoId:t,nombre:n,precio:parseFloat(r),cantidad:1})}j(),b(`¡${n} añadido al carrito!`,`success`)}})}catch{t.innerHTML=`<p class="col-span-full text-center text-red-500 py-10 italic">Error al cargar productos.</p>`}}async function L(e){let t=document.getElementById(`bitacora-timeline`);if(t){if(!e){t.innerHTML=`<p class="text-center py-10 text-red-500 italic font-semibold">Debes vincular tu Nido familiar para ver las bitácoras del bebé.</p>`;return}try{let e=_.currentUser.uid,{collection:n,query:r,where:i,getDocs:a}=await de(async()=>{let{collection:e,query:t,where:n,getDocs:r}=await import(`./index.esm-BSMOF6mV.js`).then(e=>e.t);return{collection:e,query:t,where:n,getDocs:r}},[]),o=r(n(s,`bitacoras`),i(`uidPadre`,`==`,e)),c=r(n(s,`fichas_atencion`),i(`uidPadre`,`==`,e)),[l,u]=await Promise.all([a(o),a(c)]),d=[];if(l.forEach(e=>{let t=e.data();d.push({...t,tipoRegistro:`bitacora`,fechaOrden:t.fecha?.toDate()||new Date(0)})}),u.forEach(e=>{let t=e.data();d.push({...t,tipoRegistro:`ficha_clinica`,fechaOrden:t.fechaAtencion?.toDate()||new Date(0)})}),d.sort((e,t)=>t.fechaOrden-e.fechaOrden),d.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No hay registros de cuidado ni clínicos cargados todavía.</p>`;return}t.innerHTML=d.map(e=>{let t=e.fechaOrden.toLocaleDateString(`es-CL`),n=e.fechaOrden.toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`});return e.tipoRegistro===`bitacora`?`
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-emerald-500 slide-up">
              <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${t} a las ${n} hrs</span>
                  <h4 class="font-bold text-lg text-[#181411]">Reporte de Cuidado Nocturno</h4>
                  <p class="text-xs text-[#887263]">Turno efectivo: ${e.horasEfectivas||0} hrs</p>
                </div>
                <span class="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">🍼 Cuidadora</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-xs">
                <div><strong>🥛 Alimentación:</strong> ${w(e.alimentacion)}</div>
                <div><strong>😴 Horas Sueño:</strong> ${e.sueno}</div>
                <div><strong>🧷 Deposiciones/Mudas:</strong> ${w(e.deposiciones)}</div>
              </div>
              <div class="space-y-1 text-sm text-[#181411]">
                <p><strong>Observaciones generales:</strong> <span class="text-gray-600">${w(e.observaciones||`Sin observaciones.`)}</span></p>
              </div>
            </div>
          `:`
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-orange-500 slide-up">
              <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${t} - Control Clínico</span>
                  <h4 class="font-bold text-lg text-[#181411]">Ficha de Atención de Lactancia</h4>
                  <p class="text-xs text-red-500 font-semibold">Motivo: ${w(e.motivoConsulta)}</p>
                </div>
                <span class="text-xs font-bold bg-orange-50 text-[#e87a30] px-2.5 py-1 rounded-full uppercase tracking-wider">🤱 Consejera</span>
              </div>
              <div class="space-y-3 text-sm text-[#181411] mt-3">
                <p class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs"><strong>Evaluación de la Especialista:</strong><br><span class="text-gray-600">${w(e.evaluacion)}</span></p>
                <div class="p-4 bg-orange-50/40 rounded-xl border border-orange-100/70 text-sm text-gray-800">
                  <strong class="text-[#e87a30]">📋 Plan de Acción e Indicaciones:</strong>
                  <p class="mt-1 font-medium whitespace-pre-wrap">${w(e.planAccion)}</p>
                </div>
              </div>
            </div>
          `}).join(``)}catch(e){console.error(`Error cargando bitácoras:`,e),t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar el historial unificado.</p>`}}}async function R(e){let t=document.getElementById(`pedidos-container`);if(t)try{let n=await te(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes compras registradas en tu cuenta.</p>`;return}t.innerHTML=`
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
                <td class="p-4 font-mono text-xs">${w(e.id.slice(0,8))}...</td>
                <td class="p-4 text-gray-700">
                  ${e.productos.map(e=>`${w(e.nombre)} x${e.cantidad}`).join(`, `)}
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
      `}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar pedidos.</p>`}}async function z(e){if(O===`dashboard`||O===`citas`){let t=await h(`Consultor`,e.uid);x.innerHTML=`
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
                <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${w(e.hora)}</span>
                <h4 class="font-bold text-lg mt-2">${w(e.nombre)}</h4>
                <p class="text-xs text-gray-500 mb-2">Fecha: ${w(e.fecha)} • Creado por: ${w(e.email)}</p>
                <p class="text-sm font-medium text-gray-600 mb-4">Servicio: ${w(e.servicio)} (${e.duracion} hrs)</p>
              </div>
              <div class="flex flex-col gap-2">
                ${e.estado===`completada`?`
                  <span class="text-center text-xs bg-green-100 text-green-700 py-2 rounded-lg font-bold">Bitácora Registrada ✅</span>
                `:`
                  <button data-id="${w(e.id)}" data-nid="${w(e.nidoId||``)}" class="btn-abrir-ficha w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-indigo-700 transition shadow">
                    Registrar Bitácora 📝
                  </button>
                `}
              </div>
            </div>
          `).join(``):`
            <div class="col-span-full p-8 text-center text-gray-400 italic">No tienes citas asignadas.</div>
          `}
        </div>
      `,x.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:n}=e.dataset;G(t,n)}})}else if(O===`historial_fichas`)x.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">🤱 Historial de Fichas Emitidas</h2>
        <div class="space-y-4" id="prestador-fichas-list">
          <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
        </div>
      `,B(e.uid);else if(O===`horarios`){let t=e.horarios||{},n=(e,n)=>t[e]&&t[e][n]?`<button data-day="${e}" data-block="${n}" class="btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Disponible</button>`:`<button data-day="${e}" data-block="${n}" class="btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition">No Disp.</button>`;x.innerHTML=`
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
      `;let r=x.querySelectorAll(`.btn-bloque`);r.forEach(e=>{e.addEventListener(`click`,()=>{e.classList.contains(`bg-green-100`)?(e.className=`btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition`,e.textContent=`No Disp.`):(e.className=`btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition`,e.textContent=`Disponible`)})});let i=document.getElementById(`btnGuardarHorarios`);i.onclick=async()=>{i.textContent=`Guardando...`,i.disabled=!0;let t={};r.forEach(e=>{let n=e.dataset.day,r=e.dataset.block,i=e.classList.contains(`bg-green-100`);t[n]||(t[n]={}),t[n][r]=i});try{await u(e.uid,t),b(`Horarios base actualizados`,`success`)}catch{b(`Error al actualizar horarios`,`error`)}finally{i.textContent=`Guardar Horarios`,i.disabled=!1}}}}async function me(e){if(O===`dashboard`){let t=await h(`Cuidador`,e.uid);x.innerHTML=`
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
                <h4 class="font-bold text-lg">${w(e.nombre)}</h4>
                <p class="text-xs text-gray-500">Fecha: ${w(e.fecha)} • Hora: ${w(e.hora)} • Duración: ${e.duracion} hrs</p>
                <p class="text-sm text-gray-600 mt-1">${w(e.email)}</p>
              </div>
              <div>
                ${e.estado===`completada`?`
                  <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>
                `:`
                  <button data-id="${w(e.id)}" data-nid="${w(e.nidoId||``)}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                    Completar Bitácora 📝
                  </button>
                `}
              </div>
            </div>
          `).join(``):`
            <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
          `}
        </div>
      `,x.querySelectorAll(`.btn-abrir-ficha`).forEach(e=>{e.onclick=()=>{let{id:t,nid:n}=e.dataset;G(t,n)}})}else if(O===`historial_fichas`)x.innerHTML=`
        <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Historial de Bitácoras Entregadas</h2>
        <div class="space-y-4" id="prestador-fichas-list">
          <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
        </div>
      `,B(e.uid);else if(O===`disponibilidad`){x.innerHTML=`
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
      `,J(e.uid);let t=document.getElementById(`btnAñadirBloqueo`);t.onclick=async()=>{let n=document.getElementById(`bloqueo-date`),r=document.getElementById(`bloqueo-motivo`);if(!n.value){b(`Selecciona una fecha`,`warning`);return}t.disabled=!0;try{await ie(e.uid,n.value,r.value),b(`Fecha bloqueada con éxito`,`success`),n.value=``,r.value=``,J(e.uid)}catch{b(`Error al bloquear fecha`,`error`)}finally{t.disabled=!1}}}}async function B(e){let t=document.getElementById(`prestador-fichas-list`);if(t)try{let n=await ee(e);if(n.length===0){t.innerHTML=`<p class="text-center py-10 text-gray-400 italic">No tienes fichas registradas aún.</p>`;return}t.innerHTML=n.map(e=>`
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
            <span>Fecha: ${w(e.fecha)} (${e.horasEfectivas} hrs)</span>
            <span class="text-xs text-gray-400 font-normal">${new Date(e.creadoEn).toLocaleDateString()}</span>
          </div>
          <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${w(e.tipoAlimentacion||`N/A`)} • Horas Sueño: ${e.horasSueno||0}h • Pañales: ${e.cantidadPanales||0}</p>
          <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${w(e.observaciones||`Ninguna`)}</p>
        </div>
      `).join(``)}catch{t.innerHTML=`<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>`}}async function he(e){if(O===`dashboard`||O===`usuarios`){let e=await le();x.innerHTML=`
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
      `,q(),ve();try{let e=await m(),t=document.getElementById(`admin-orders-count`);t&&(t.textContent=e.length)}catch{}}else if(O===`admin_tienda`){x.innerHTML=`
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
        <h3 class="font-bold text-lg mt-8 mb-4">Todos los Pedidos Clientes</h3>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="admin-orders-list">
          <p class="text-center py-6 text-gray-400 italic">Cargando historial de pedidos...</p>
        </div>
      `,V(),ge();let e=document.getElementById(`adminAddProductForm`);e.addEventListener(`submit`,async t=>{t.preventDefault();let n=new FormData(e),r={nombre:n.get(`nombre`),precio:parseFloat(n.get(`precio`)),stock:parseInt(n.get(`stock`)),categoria:n.get(`categoria`),imagenUrl:n.get(`imagenUrl`)||`https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80`};try{await se(r),b(`Producto creado con éxito`,`success`),e.reset(),V()}catch{b(`Error al crear producto`,`error`)}})}}async function V(){let e=document.getElementById(`admin-inventory-list`);if(e)try{let t=await p();if(t.length===0){e.innerHTML=`<p class="text-gray-400 italic text-sm">No hay productos cargados.</p>`;return}e.innerHTML=t.map(e=>`
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
      `).join(``),e.querySelectorAll(`.btn-delete-product`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Estás seguro de eliminar este producto?`))try{await d(e.dataset.id),b(`Producto eliminado`,`success`),V()}catch{b(`Error al eliminar producto`,`error`)}}})}catch{e.innerHTML=`<p class="text-red-500 italic text-sm">Error cargando inventario.</p>`}}async function ge(){let e=document.getElementById(`admin-orders-list`);if(e)try{let t=await m();if(t.length===0){e.innerHTML=`<p class="text-center py-6 text-gray-400 italic">No hay registros de compras.</p>`;return}e.innerHTML=`
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
      `}catch{e.innerHTML=`<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>`}}function H(e){let t=document.getElementById(`modalPerfilBebe`);t&&t.showModal()}function _e(){let e=document.getElementById(`modalCarrito`);e&&(U(),e.showModal())}function U(){let e=document.getElementById(`carrito-items`),t=document.getElementById(`carrito-total`);if(!e)return;if(D.length===0){e.innerHTML=`<p class="text-gray-400 text-center py-8 text-sm italic">Tu carrito está vacío.</p>`,t&&(t.textContent=`$0`);return}let n=0;e.innerHTML=D.map((e,t)=>{let r=e.precio*e.cantidad;return n+=r,`
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
      `}).join(``),t&&(t.textContent=`$${n.toLocaleString(`cl-CL`)}`),e.querySelectorAll(`.btn-cart-qty`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx),n=e.dataset.action;n===`inc`?D[t].cantidad++:n===`dec`&&(D[t].cantidad--,D[t].cantidad<=0&&D.splice(t,1)),j(),U()}}),e.querySelectorAll(`.btn-cart-del`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.idx);D.splice(t,1),j(),U()}})}let W=document.getElementById(`checkoutForm`);W.addEventListener(`submit`,async e=>{if(e.preventDefault(),D.length===0){b(`El carrito está vacío`,`warning`);return}let t=document.getElementById(`btnConfirmarPedido`);t.disabled=!0,t.textContent=`Procesando Pedido...`;let n={compradorUid:_.currentUser.uid,nidoId:k?.nidoId||null,productos:D,total:D.reduce((e,t)=>e+t.precio*t.cantidad,0),direccion:document.getElementById(`cart-direccion`).value,telefono:document.getElementById(`cart-telefono`).value,estado:`pagado`};try{await oe(n),b(`¡Pedido realizado con éxito!`,`success`),D=[],j(),W.reset(),document.getElementById(`modalCarrito`)?.close(),P(`padre`,k)}catch{b(`Error al procesar el pedido. Revisa el stock.`,`error`)}finally{t.disabled=!1,t.textContent=`Confirmar Pedido y Pagar 💳`}});function G(e,t){let n=document.getElementById(`modalFichaCuidado`);if(!n)return;document.getElementById(`ficha-reservaId`).value=e,document.getElementById(`ficha-nidoId`).value=t;let r=n.querySelector(`input[name="fecha"]`);r&&(r.value=new Date().toISOString().split(`T`)[0]),n.showModal()}let K=document.getElementById(`fichaCuidadoForm`);K.addEventListener(`submit`,async e=>{e.preventDefault();let t=K.querySelector(`button[type="submit"]`);t.disabled=!0,t.textContent=`Guardando Ficha...`;let n=new FormData(K),r={reservaId:n.get(`reservaId`),nidoId:n.get(`nidoId`),fecha:n.get(`fecha`),horasEfectivas:parseInt(n.get(`horasEfectivas`)),tipoAlimentacion:n.get(`tipoAlimentacion`),cantidadOz:parseInt(n.get(`cantidadOz`))||0,horasSueno:parseFloat(n.get(`horasSueno`))||0,cantidadPanales:parseInt(n.get(`cantidadPanales`))||0,observaciones:n.get(`observaciones`),recomendaciones:n.get(`recomendaciones`),seguimiento:n.get(`seguimiento`),prestadorId:_.currentUser.uid,prestadorNombre:k?.nombre||`Prestador`,prestadorRol:A};if(!r.nidoId){b(`Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.`,`error`),t.disabled=!1,t.textContent=`Guardar y Enviar Bitácora`;return}try{await v(r),b(`Ficha de cuidado guardada y compartida`,`success`),K.reset(),document.getElementById(`modalFichaCuidado`)?.close(),P(A,k)}catch{b(`Error al guardar la bitácora`,`error`)}finally{t.disabled=!1,t.textContent=`Guardar y Enviar Bitácora`}});async function q(){let e=document.getElementById(`pending-users-list`);if(e)try{let t=await ue();if(t.length===0){e.innerHTML=`<p class="text-sm text-gray-500 italic">No hay solicitudes nuevas.</p>`;return}e.innerHTML=``,t.forEach(t=>{let n=document.createElement(`div`);n.className=`flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200`,n.innerHTML=`
            <div>
              <p class="font-bold text-sm">${w(t.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${w(Array.isArray(t.rol)?t.rol.join(`, `):t.rol)}</span></p>
              <p class="text-[10px] text-gray-500">${w(t.email)} • RUT: ${w(t.rut||`No registrado`)}</p>
            </div>
            <button data-uid="${w(t.id)}" data-nombre="${w(t.nombre)}" data-email="${w(t.email)}" class="btn-approve bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-green-600 transition-colors">Aprobar</button>
          `,e.appendChild(n)}),e.querySelectorAll(`.btn-approve`).forEach(e=>e.addEventListener(`click`,async e=>{let{uid:t,nombre:r,email:i}=e.target.dataset,a=e.target;a.disabled=!0;try{await l(t),b(`Usuario aprobado con éxito`,`success`),n.sendApprovalNotification(r,i),q()}catch{b(`Error al aprobar usuario`,`error`),a.disabled=!1}}))}catch{e.innerHTML=`<p class="text-xs text-red-500">Error al cargar.</p>`}}async function ve(){let e=document.getElementById(`admin-latest-users`);if(e)try{let t=await c();if(t.length===0){e.innerHTML=`<p class="text-sm text-gray-400">No hay usuarios registrados.</p>`;return}e.innerHTML=t.map(e=>{let t=e.rol===`padre`?`bg-blue-500`:`bg-green-500`,n=e.fechaRegistro?new Date(e.fechaRegistro).toLocaleDateString():`---`;return`
          <li class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 ${t} rounded-full"></span> ${w(e.nombre)}
            </span>
            <span class="text-gray-400 text-xs">${w(n)}</span>
          </li>
        `}).join(``)}catch{b(`Error al cargar últimos registros`,`error`)}}async function J(e){let t=document.getElementById(`caregiver-blocked-days-list`);if(t){t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">Cargando bloqueos...</li>`;try{let n=await ne(e);n.length===0?t.innerHTML=`<li class="p-2 text-center text-gray-400 italic">No tienes días bloqueados.</li>`:(t.innerHTML=n.map(e=>`
          <li class="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-100">
            <div class="flex items-center gap-3">
              <span class="text-sm">⛔</span>
              <div>
                <p class="font-bold text-red-800 text-xs">${w(e.date)}</p>
                <p class="text-[10px] text-red-600">${w(e.motivo||`Sin motivo`)}</p>
              </div>
            </div>
            <button data-id="${w(e.id)}" class="btn-delete-block text-red-400 hover:text-red-700 text-xs">Eliminar</button>
          </li>`).join(``),t.querySelectorAll(`.btn-delete-block`).forEach(t=>{t.onclick=async()=>{try{await y(e,t.dataset.id),b(`Bloqueo eliminado`,`success`),J(e)}catch{b(`Error al eliminar bloqueo`,`error`)}}}))}catch{t.innerHTML=`<li class="p-2 text-center text-red-500 italic">Error al cargar.</li>`}}}i(_,async n=>{if(n)try{let r=await e(t(s,`usuarios`,n.uid));if(r.exists()){let e=r.data();if(k=e,e.estado===`pendiente`&&e.rol!==`admin`)ye(e.nombre);else{let t=(Array.isArray(e.rol)?e.rol[0]:e.rol)||`padre`;A=t,C&&(C.textContent=e?.nombre||`Usuario`),E&&(E.textContent=(e?.nombre||`U`).charAt(0).toUpperCase()),T&&(t===`admin`?T.textContent=`Administrador`:e.subtipo&&e.subtipo!==`admin`?T.textContent=e.subtipo===`madre`?`Mamá`:`Papá`:T.textContent={consejera:`Consejera`,cuidadora:`Cuidadora`,padre:`Padre`}[t]||t),O=t===`padre`?`resumen`:`dashboard`,N(t,e),P(t,e)}}else b(`Perfil de usuario no encontrado`,`error`),setTimeout(()=>window.location.href=`index.html`,3e3)}catch{b(`Error al conectar con el servidor`,`error`)}else window.location.href=`index.html`});function ye(e){x&&(x.innerHTML=`
        <div class="glass-panel p-10 rounded-2xl text-center slide-up max-w-xl mx-auto mt-20">
          <div class="text-5xl mb-4">⌛</div>
          <h2 class="text-2xl font-black mb-4 text-[#181411]">Cuenta en Revisión</h2>
          <p class="text-[#887263]">Hola ${e||`Colaborador/a`}, estamos validando tus antecedentes. Te notificaremos por correo cuando tu perfil esté activo.</p>
          <button onclick="location.reload()" class="mt-6 text-sm text-[#e87a30] font-bold">Refrescar estado</button>
        </div>`)}let Y=document.getElementById(`btnCerrarSesion`);Y&&Y.addEventListener(`click`,async e=>{e.preventDefault(),await r(_),window.location.href=`index.html`});let X=document.getElementById(`modalTipsLactancia`),Z=document.getElementById(`btnDescubreComo`),Q=document.getElementById(`btnCerrarTips`),$=document.getElementById(`btnEntendidoTips`);Z&&X&&Z.addEventListener(`click`,e=>{e.preventDefault(),X.showModal()}),Q&&X&&(Q.onclick=()=>X.close()),$&&X&&($.onclick=()=>X.close()),X&&X.addEventListener(`click`,e=>{e.target===X&&X.close()})});