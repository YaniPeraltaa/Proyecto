const SUPABASE_URL = 'https://arfrmpefkrzvaajvcfbc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yMh7ZnbaV44Dd0-WyS9X3A_ZKPvLubu';

let supabaseClient = null;

if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('No se pudo cargar la librería de Supabase desde el CDN.');
}

document.addEventListener('DOMContentLoaded', () => {
    const inputTexto = document.getElementById('input-operacion');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnConsultar = document.getElementById('btn-consultar');
    const contenedorResultados = document.getElementById('resultados');

    if (!supabaseClient) {
        if (contenedorResultados) {
            contenedorResultados.innerHTML = '<p class="error">Error: No se pudo cargar el SDK de Supabase. Revisa tu conexión a internet.</p>';
        }
        return;
    }

    // Evento del botón Guardar
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();
            const texto = inputTexto.value.trim();

            if (!texto) {
                alert('Por favor, ingresa un texto u operación antes de enviar.');
                return;
            }

            contenedorResultados.innerHTML = '<p class="cargando">Guardando en Supabase...</p>';

            try {
                const { data, error } = await supabaseClient
                    .from('operaciones')
                    .insert([{ operacion: texto }]);

                if (error) {
                    console.error('Error al insertar:', error);
                    contenedorResultados.innerHTML = `<p class="error">Error al guardar: ${error.message}</p>`;
                } else {
                    inputTexto.value = '';
                    contenedorResultados.innerHTML = `<p class="exito">¡Operación guardada exitosamente!</p>`;
                    await consultarOperaciones();
                }
            } catch (err) {
                console.error('Error inesperado:', err);
                contenedorResultados.innerHTML = `<p class="error">Error inesperado: ${err.message}</p>`;
            }
        });
    }

    // Función para consultar todos los registros
    async function consultarOperaciones() {
        if (!contenedorResultados) return;
        contenedorResultados.innerHTML = '<p class="cargando">Cargando registros de Supabase...</p>';

        try {
            const { data, error } = await supabaseClient
                .from('operaciones')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) {
                console.error('Error al consultar:', error);
                contenedorResultados.innerHTML = `<p class="error">Error de Supabase: ${error.message}</p>`;
            } else {
                if (!data || data.length === 0) {
                    contenedorResultados.innerHTML = '<p>No hay registros almacenados aún.</p>';
                    return;
                }

                let html = '<ul class="lista-resultados">';
                data.forEach(item => {
                    const fecha = item.creado_en ? new Date(item.creado_en).toLocaleString() : 'Sin fecha';
                    html += `<li>
                        <strong>ID ${item.id}:</strong> ${item.operacion}
                        <br><small>Fecha: ${fecha}</small>
                    </li>`;
                });
                html += '</ul>';

                contenedorResultados.innerHTML = html;
            }
        } catch (err) {
            console.error('Error inesperado al consultar:', err);
            contenedorResultados.innerHTML = `<p class="error">Error inesperado: ${err.message}</p>`;
        }
    }

    // Evento del botón Consultar
    if (btnConsultar) {
        btnConsultar.addEventListener('click', (e) => {
            e.preventDefault();
            consultarOperaciones();
        });
    }
});