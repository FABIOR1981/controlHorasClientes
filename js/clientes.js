// clientes.js - Gestión de clientes: alta, listado y baja lógica

let clientes = [];

// Cargar clientes desde el archivo JSON y renderizar la tabla
async function cargarClientes() {
    try {
        const resp = await fetch('../data/listaClientes.json');
        clientes = await resp.json();
    } catch { clientes = []; }
    renderTablaClientes();
}

function renderTablaClientes() {
    const tbody = document.getElementById('tbodyClientes');
    tbody.innerHTML = '';
    clientes.forEach((c, idx) => {
        const tr = document.createElement('tr');
        const valorHora = c.valorHora == null || c.valorHora === '' ? '-' : Number(c.valorHora).toFixed(2);
        tr.innerHTML = `
            <td>${c.nombre}</td>
            <td>${c.rubro || ''}</td>
            <td>${valorHora}</td>
            <td class='${c.activo === false ? "inactivo" : ""}'>${c.activo === false ? 'Inactivo' : 'Activo'}</td>
            <td>
                <button type='button' onclick='editarCliente(${idx})'>Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function guardarClientes() {
    await fetch('/.netlify/functions/update-clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: clientes })
    });
}
// Editar cliente: carga los datos en el formulario para modificar
window.editarCliente = function(idx) {
    const cliente = clientes[idx];
    document.getElementById('nombreCliente').value = cliente.nombre || '';
    document.getElementById('rubroCliente').value = cliente.rubro || '';
    document.getElementById('valorHoraCliente').value = cliente.valorHora == null || cliente.valorHora === '' ? '' : cliente.valorHora;
    document.getElementById('activoCliente').value = cliente.activo === false ? 'false' : 'true';
    document.getElementById('altaClienteForm').setAttribute('data-edit', idx);
    document.getElementById('msgAlta').textContent = 'Editando cliente. Modifica y guarda para actualizar.';
    document.getElementById('msgAlta').style.color = '#1976d2';
}

window.toggleActivo = async function(idx) {
    clientes[idx].activo = clientes[idx].activo === false ? true : false;
    await guardarClientes();
    renderTablaClientes();
}

document.getElementById('altaClienteForm').onsubmit = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreCliente').value.trim();
    const rubro = document.getElementById('rubroCliente').value;
    const valorHoraRaw = document.getElementById('valorHoraCliente').value.trim();
    const activo = document.getElementById('activoCliente').value === 'true';
    const msg = document.getElementById('msgAlta');
    const editIdx = this.getAttribute('data-edit');
    const valorHora = valorHoraRaw === '' ? 0 : Number(valorHoraRaw);
    if(!nombre) {
        msg.textContent = 'El nombre es obligatorio.';
        msg.style.color = '#c00';
        return;
    }
    if(!rubro) {
        msg.textContent = 'Debe seleccionar un rubro.';
        msg.style.color = '#c00';
        return;
    }
    if (Number.isNaN(valorHora)) {
        msg.textContent = 'El valor hora debe ser numérico.';
        msg.style.color = '#c00';
        return;
    }
    if(editIdx !== null && editIdx !== '') {
        // Editar cliente existente
        const editIndex = Number(editIdx);
        if(clientes.some((c, i) => i !== editIndex && c.nombre.toLowerCase() === nombre.toLowerCase())) {
            msg.textContent = 'Ya existe un cliente con ese nombre.';
            msg.style.color = '#c00';
            return;
        }
        clientes[editIndex].nombre = nombre;
        clientes[editIndex].rubro = rubro;
        clientes[editIndex].valorHora = valorHora;
        clientes[editIndex].activo = activo;
        await guardarClientes();
        msg.textContent = 'Cliente actualizado correctamente.';
        msg.style.color = '#080';
        this.removeAttribute('data-edit');
    } else {
        // Alta nuevo cliente
        if(clientes.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
            msg.textContent = 'Ya existe un cliente con ese nombre.';
            msg.style.color = '#c00';
            return;
        }
        clientes.push({ nombre, rubro, valorHora, activo });
        await guardarClientes();
        msg.textContent = 'Cliente guardado correctamente.';
        msg.style.color = '#080';
    }
    document.getElementById('altaClienteForm').reset();
    document.getElementById('activoCliente').value = 'true';
    renderTablaClientes();

}

// Llenar el combo de rubros desde config.js (funciona si el DOM ya está cargado o no)
function populateRubros() {
    if (window.config && Array.isArray(window.config.rubros) && window.config.rubros.length > 0) {
        const rubroSelect = document.getElementById('rubroCliente');
        if (!rubroSelect) {
            return;
        }
        // Evitar duplicados si se recarga el DOM
        rubroSelect.innerHTML = '<option value="">Seleccione un rubro</option>';
        window.config.rubros.forEach(rubro => {
            const opt = document.createElement('option');
            opt.value = rubro;
            opt.textContent = rubro;
            rubroSelect.appendChild(opt);
        });
    } else {
        // No se encontró window.config.rubros o está vacío
    }
}

// Exponer para depuración manual
window.populateRubros = populateRubros;

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', populateRubros);
} else {
    // Si el DOM ya está listo, intentarlo de inmediato
    populateRubros();
}

// Reintentar un segundo después si sigue vacío
setTimeout(() => {
    const select = document.getElementById('rubroCliente');
    if (select && select.options.length <= 1) {
        populateRubros();
    }
}, 1000);


async function guardarClientes() {
    await fetch('/.netlify/functions/update-clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: clientes })
    });
}

cargarClientes();
