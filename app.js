const SUPABASE_URL = 'https://vmqjslifladwmyengxct.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k7cJZ9Dxc97UxZsrX-g29w_vnU_yl_Y';

let supabaseClient = null;
let carritoVenta = [];

// Fotos reales de lencería de respaldo para que la tienda luzca idéntica a la foto de referencia
const fotosLenceriaModelo = [
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
];

if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
        global: { headers: { 'apikey': SUPABASE_KEY } }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.app-section');

    function cambiarSeccion(targetId) {
        sections.forEach(sec => sec.style.display = (sec.id === targetId) ? 'block' : 'none');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${targetId}`) link.classList.add('active');
            else link.classList.remove('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarSeccion(link.getAttribute('href').substring(1));
        });
    });

    cambiarSeccion('inicio');
    if (!supabaseClient) return;

    // --- CATÁLOGO ---
    const inputBuscar = document.getElementById('input-buscar-cat');
    const btnBuscar = document.getElementById('btn-buscar-cat');
    const btnVerTodo = document.getElementById('btn-vertodo-cat');
    const resultadosCat = document.getElementById('resultados-catalogo');

    async function buscarCatalogo(filtro = '') {
        resultadosCat.innerHTML = '<p class="cargando">Cargando productos y fotos reales...</p>';
        try {
            let query = supabaseClient.from('productos').select('*');
            if (filtro) {
                query = query.or(`nombre_articulo.ilike.%${filtro}%,marca.ilike.%${filtro}%,codigo.ilike.%${filtro}%`);
            }
            const { data, error } = await query.order('marca', { ascending: true }).limit(40);
            if (error) throw error;

            if (!data || data.length === 0) {
                resultadosCat.innerHTML = '<p style="text-align:center; padding:2rem;">No se encontraron productos.</p>';
                return;
            }

            let html = '<div class="grid-productos">';
            data.forEach((item, index) => {
                const precioCosto = item.lista_mayorista || item.besol_s_iva || 5000;
                // REGLA SOLICITADA: Precio de lista sumándole un 100% (x2)
                const precioVenta = precioCosto * 2;
                
                // Imagen rotativa de modelo de lencería
                const fotoUrl = fotosLenceriaModelo[index % fotosLenceriaModelo.length];

                html += `
                <div class="producto-card">
                    <div class="producto-img-container">
                        <img src="${fotoUrl}" alt="${item.nombre_articulo}">
                    </div>
                    <div class="producto-info">
                        <span class="producto-marca">${item.marca || 'LENCERÍA'}</span>
                        <div class="producto-nombre">${item.nombre_articulo || 'Artículo Exclusivo'}</div>
                        <div class="producto-detalles"><b>Código:</b> ${item.codigo || 'N/D'}</div>
                        <div class="producto-precio">$${precioVenta.toLocaleString('es-AR')}</div>
                        
                        <div class="selectors-row">
                            <select id="talle-${item.id}">
                                <option value="85">Talle 85</option>
                                <option value="90" selected>Talle 90</option>
                                <option value="95">Talle 95</option>
                                <option value="100">Talle 100</option>
                                <option value="Único">Único</option>
                            </select>
                            <select id="color-${item.id}">
                                <option value="Negro" selected>Negro</option>
                                <option value="Blanco">Blanco</option>
                                <option value="Nude">Nude</option>
                                <option value="Rojo">Rojo</option>
                            </select>
                        </div>

                        <button type="button" class="btn-primary" style="width:100%; margin-top:0.3rem;" onclick="agregarAlCarrito(${item.id}, '${item.marca || ''}', '${item.codigo || ''}', '${(item.nombre_articulo || '').replace(/'/g, "")}', ${precioVenta})">Agregar al Carrito</button>
                    </div>
                </div>`;
            });
            html += '</div>';
            resultadosCat.innerHTML = html;
        } catch (err) {
            resultadosCat.innerHTML = `<p class="error">Error al cargar: ${err.message}</p>`;
        }
    }

    if (btnBuscar) btnBuscar.addEventListener('click', (e) => { e.preventDefault(); buscarCatalogo(inputBuscar.value.trim()); });
    if (btnVerTodo) btnVerTodo.addEventListener('click', (e) => { e.preventDefault(); inputBuscar.value = ''; buscarCatalogo(''); });

    // Cargar catálogo inicial al hacer clic en la pestaña Catálogo
    document.querySelector('a[href="#catalogo"]').addEventListener('click', () => buscarCatalogo(''));

    // --- CARRITO Y VENTAS ---
    const listaCarritoEl = document.getElementById('lista-carrito');
    const totalVentaEl = document.getElementById('total-venta');
    const contadorCarritoEl = document.getElementById('contador-carrito');
    const nombreClienteEl = document.getElementById('nombre-cliente');
    const btnConfirmarVenta = document.getElementById('btn-confirmar-venta');
    const mensajeVentaEl = document.getElementById('mensaje-venta');

    window.agregarAlCarrito = function(id, marca, codigo, nombre, precioVenta) {
        const talleSelect = document.getElementById(`talle-${id}`);
        const colorSelect = document.getElementById(`color-${id}`);
        const talleSeleccionado = talleSelect ? talleSelect.value : 'Único';
        const colorSeleccionado = colorSelect ? colorSelect.value : 'Negro';
        
        const itemKey = `${id}-${talleSeleccionado}-${colorSeleccionado}`;
        const existente = carritoVenta.find(item => item.key === itemKey);
        
        if (existente) {
            existente.cantidad += 1;
            existente.subtotal = existente.cantidad * existente.precio;
        } else {
            carritoVenta.push({
                key: itemKey,
                id: id,
                marca: marca,
                codigo: codigo,
                nombre: nombre,
                talle: talleSeleccionado,
                color: colorSeleccionado,
                precio: precioVenta,
                cantidad: 1,
                subtotal: precioVenta
            });
        }
        actualizarCarritoUI();
        alert('¡Producto agregado al carrito con éxito!');
    };

    window.cambiarCantidad = function(key, delta) {
        const item = carritoVenta.find(i => i.key === key);
        if (item) {
            item.cantidad += delta;
            if (item.cantidad <= 0) {
                carritoVenta = carritoVenta.filter(i => i.key !== key);
            } else {
                item.subtotal = item.cantidad * item.precio;
            }
            actualizarCarritoUI();
        }
    };

    function actualizarCarritoUI() {
        const totalItems = carritoVenta.reduce((acc, item) => acc + item.cantidad, 0);
        if (contadorCarritoEl) contadorCarritoEl.textContent = totalItems;

        if (carritoVenta.length === 0) {
            listaCarritoEl.innerHTML = '<p style="text-align:center; padding:1.5rem;">El carrito está vacío.</p>';
            totalVentaEl.textContent = '$0.00';
            return;
        }

        let html = '<ul class="lista-resultados">';
        let totalGeneral = 0;

        carritoVenta.forEach(item => {
            totalGeneral += item.subtotal;
            html += `<li>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <strong>[${item.marca}] ${item.nombre}</strong><br>
                        <small>Cod: ${item.codigo} | Talle: <b>${item.talle}</b> | Color: <b>${item.color}</b></small>
                        <br><small>Precio Unit.: $${item.precio.toLocaleString('es-AR')} | Subtotal: <b>$${item.subtotal.toLocaleString('es-AR')}</b></small>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <button type="button" class="btn-secondary" onclick="cambiarCantidad('${item.key}', -1)">-</button>
                        <span><b>${item.cantidad}</b></span>
                        <button type="button" class="btn-secondary" onclick="cambiarCantidad('${item.key}', 1)">+</button>
                    </div>
                </div>
            </li>`;
        });
        html += '</ul>';
        listaCarritoEl.innerHTML = html;
        totalVentaEl.textContent = `$${totalGeneral.toLocaleString('es-AR')}`;
    }

    if (btnConfirmarVenta) {
        btnConfirmarVenta.addEventListener('click', (e) => {
            e.preventDefault();
            if (carritoVenta.length === 0) {
                alert('Agrega al menos un producto al carrito.');
                return;
            }

            const cliente = nombreClienteEl.value.trim() || 'Cliente Web';
            const totalGeneral = carritoVenta.reduce((acc, item) => acc + item.subtotal, 0);

            // Armar mensaje para WhatsApp
            let mensajeWsp = `Hola! 👋 Quiero confirmar el siguiente pedido:%0A%0A*Cliente:* ${cliente}%0A`;
            carritoVenta.forEach(item => {
                mensajeWsp += `- [${item.marca}] ${item.nombre} (Cod: ${item.codigo}) | Talle: ${item.talle} | Color: ${item.color} | Cant: ${item.cantidad} | Subtotal: $${item.subtotal.toLocaleString('es-AR')}%0A`;
            });
            mensajeWsp += `%0A*TOTAL A PAGAR: $${totalGeneral.toLocaleString('es-AR')}*`;

            // Abrir WhatsApp con el pedido armado
            window.open(`https://wa.me/?text=${mensajeWsp}`, '_blank');
            mensajeVentaEl.innerHTML = `<p class="exito">¡Pedido generado con éxito! Redirigiendo a WhatsApp... 🎉</p>`;
        });
    }
});