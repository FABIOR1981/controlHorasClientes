// clientes.js - Gestión de clientes: alta, listado y baja lógica

let clientes = [];

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
        tr.innerHTML = `
            <td>${c.nombre}</td>
            <td>${c.rubro || ''}</td>
            <td class='${c.activo === false ? "inactivo" : ""}'>${c.activo === false ? 'Inactivo' : 'Activo'}</td>
            <td>
                <button type='button' onclick='editarCliente(${idx})'>Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
// Editar cliente: carga los datos en el formulario para modificar
window.editarCliente = function(idx) {
    document.getElementById('nombreCliente').value = clientes[idx].nombre;
    document.getElementById('rubroCliente').value = clientes[idx].rubro || '';
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
    const msg = document.getElementById('msgAlta');
    const editIdx = this.getAttribute('data-edit');
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
    if(editIdx !== null) {
        // Editar cliente existente
        if(clientes.some((c, i) => i != editIdx && c.nombre.toLowerCase() === nombre.toLowerCase())) {
            msg.textContent = 'Ya existe un cliente con ese nombre.';
            msg.style.color = '#c00';
            return;
        }
        clientes[editIdx].nombre = nombre;
        clientes[editIdx].rubro = rubro;
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
        clientes.push({ nombre, rubro, activo: true });
        await guardarClientes();
        msg.textContent = 'Cliente guardado correctamente.';
        msg.style.color = '#080';
    }
// Llenar el combo de rubros desde config.js
window.addEventListener('DOMContentLoaded', () => {
    if (window.config && Array.isArray(window.config.rubros)) {
        const rubroSelect = document.getElementById('rubroCliente');
        // Evitar duplicados si se recarga el DOM
        rubroSelect.innerHTML = '<option value="">Seleccione un rubro</option>';
        window.config.rubros.forEach(rubro => {
            const opt = document.createElement('option');
            opt.value = rubro;
            opt.textContent = rubro;
            rubroSelect.appendChild(opt);
        });
    }
});
    document.getElementById('altaClienteForm').reset();
    renderTablaClientes();
}

async function guardarClientes() {
    await fetch('/.netlify/functions/update-clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: clientes })
    });
}

cargarClientes();
