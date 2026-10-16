const SUPABASE_URL = 'https://vmqjslifladwmyengxct.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k7cJZ9Dxc97UxZsrX-g29w_vnU_yl_Y';

let supabaseClient = null;
let carritoVenta = [];

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
        resultadosCat.innerHTML = '<p class="cargando">Cargando productos y talles...</p>';
        try {
            let query = supabaseClient.from('productos').select('*');
            if (filtro) {
                query = query.or(`nombre_articulo.ilike.%${filtro}%,marca.ilike.%${filtro}%,codigo.ilike.%${filtro}%`);
            }
            const { data, error } = await query.order('marca', { ascending: true }).limit(50);
            if (error) throw error;

            if (!data || data.length === 0) {
                resultadosCat.innerHTML = '<p>No se encontraron productos.</p>';
                return;
            }

            let html = `<p class="exito">Mostrando ${data.length} artículos:</p><ul class="lista-resultados">`;
            data.forEach(item => {
                const precio = item.lista_mayorista || item.besol_s_iva || 0;
                const talles = item.talles || '85, 90, 95, 100 (Estándar)';
                html += `<li>
                    <strong>[${item.marca}] - ${item.nombre_articulo}</strong> (Cod: ${item.codigo})
                    <br><small><b>Precio:</b> $${precio} | <b>Talles disponibles:</b> ${talles}</small>
                </li>`;
            });
            html += '</ul>';
            resultadosCat.innerHTML = html;
        } catch (err) {
            resultadosCat.innerHTML = `<p class="error">Error: ${err.message}</p>`;
        }
    }

    if (btnBuscar) btnBuscar.addEventListener('click', (e) => { e.preventDefault(); buscarCatalogo(inputBuscar.value.trim()); });
    if (btnVerTodo) btnVerTodo.addEventListener('click', (e) => { e.preventDefault(); inputBuscar.value = ''; buscarCatalogo(''); });

    // Cargar catálogo inicial por defecto al abrir la sección
    document.querySelector('a[href="#catalogo"]').addEventListener('click', () => buscarCatalogo(''));

    // --- VENTAS Y CARRITO ---
    const inputItemVenta = document.getElementById('input-item-venta');
    const btnBuscarItemVenta = document.getElementById('btn-buscar-item-venta');
    const resultadosBusquedaVenta = document.getElementById('resultados-busqueda-venta');
    const listaCarritoEl = document.getElementById('lista-carrito');
    const totalVentaEl = document.getElementById('total-venta');
    const nombreClienteEl = document.getElementById('nombre-cliente');
    const btnConfirmarVenta = document.getElementById('btn-confirmar-venta');
    const mensajeVentaEl = document.getElementById('mensaje-venta');

    async function buscarParaVenta(filtro) {
        if (!filtro) return;
        resultadosBusquedaVenta.innerHTML = '<p class="cargando">Buscando...</p>';
        try {
            const { data, error } = await supabaseClient
                .from('productos')
                .select('*')
                .or(`nombre_articulo.ilike.%${filtro}%,marca.ilike.%${filtro}%,codigo.ilike.%${filtro}%`)
                .limit(8);

            if (error) throw error;
            if (!data || data.length === 0) {
                resultadosBusquedaVenta.innerHTML = '<p>No se encontraron productos.</p>';
                return;
            }

            let html = '<div class="productos-grid-select">';
            data.forEach(prod => {
                const precio = prod.lista_mayorista || prod.besol_s_iva || 0;
                html += `<div class="prod-card-mini" style="flex-direction:column; align-items:flex-start; gap:0.3rem;">
                    <span><b>[${prod.marca}]</b> ${prod.nombre_articulo} - $${precio}</span>
                    <div style="display:flex; width:100%; justify-content:space-between; align-items:center;">
                        <small>Talles: <input type="text" id="talle-${prod.id}" value="90" style="width:60px; padding:2px;"></small>
                        <button type="button" class="btn-primary" onclick="agregarAlCarrito(${prod.id}, '${prod.marca}', '${prod.codigo}', '${prod.nombre_articulo.replace(/'/g, "")}', ${precio})">Agregar</button>
                    </div>
                </div>`;
            });
            html += '</div>';
            resultadosBusquedaVenta.innerHTML = html;
        } catch (err) {
            resultadosBusquedaVenta.innerHTML = `<p class="error">Error: ${err.message}</p>`;
        }
    }

    if (btnBuscarItemVenta) btnBuscarItemVenta.addEventListener('click', (e) => { e.preventDefault(); buscarParaVenta(inputItemVenta.value.trim()); });

    window.agregarAlCarrito = function(id, marca, codigo, nombre, precio) {
        const talleInput = document.getElementById(`talle-${id}`);
        const talleSeleccionado = talleInput ? talleInput.value : 'Único';
        
        const itemKey = `${id}-${talleSeleccionado}`;
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
                precio: precio,
                cantidad: 1,
                subtotal: precio
            });
        }
        actualizarCarritoUI();
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
        if (carritoVenta.length === 0) {
            listaCarritoEl.innerHTML = '<p>El carrito está vacío.</p>';
            totalVentaEl.textContent = '$0.00';
            return;
        }

        let html = '<ul class="lista-resultados">';
        let totalGeneral = 0;

        carritoVenta.forEach(item => {
            totalGeneral += item.subtotal;
            html += `<li>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>[${item.marca}] ${item.nombre}</strong> (Talle: <b>${item.talle}</b>)
                        <br><small>Unitario: $${item.precio} | Subtotal: <b>$${item.subtotal}</b></small>
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
        totalVentaEl.textContent = `$${totalGeneral.toFixed(2)}`;
    }

    if (btnConfirmarVenta) {
        btnConfirmarVenta.addEventListener('click', async (e) => {
            e.preventDefault();
            if (carritoVenta.length === 0) {
                alert('Agrega al menos un producto.');
                return;
            }

            const cliente = nombreClienteEl.value.trim() || 'Cliente Web';
            const totalGeneral = carritoVenta.reduce((acc, item) => acc + item.subtotal, 0);
            mensajeVentaEl.innerHTML = '<p class="cargando">Procesando pedido...</p>';

            try {
                const { data: ventaData, error: ventaError } = await supabaseClient
                    .from('ventas')
                    .insert([{ cliente: cliente, total: totalGeneral }])
                    .select()
                    .single();

                if (ventaError) throw ventaError;
                const ventaId = ventaData.id;

                const detalles = carritoVenta.map(item => ({
                    venta_id: ventaId,
                    producto_id: item.id,
                    marca: item.marca,
                    codigo: item.codigo,
                    nombre_articulo: `${item.nombre} (Talle: ${item.talle})`,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.subtotal
                }));

                const { error: detalleError } = await supabaseClient.from('detalle_ventas').insert(detalles);
                if (detalleError) throw detalleError;

                mensajeVentaEl.innerHTML = `<p class="exito">¡Pedido #${ventaId} realizado con éxito! 🎉</p>`;
                carritoVenta = [];
                actualizarCarritoUI();
                nombreClienteEl.value = '';
            } catch (err) {
                mensajeVentaEl.innerHTML = `<p class="error">Error: ${err.message}</p>`;
            }
        });
    }
});