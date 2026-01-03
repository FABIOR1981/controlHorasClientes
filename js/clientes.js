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
            <td>${c.contacto || ''}</td>
            <td class='${c.activo === false ? "inactivo" : ""}'>${c.activo === false ? 'Inactivo' : 'Activo'}</td>
            <td>
                <button type='button' onclick='toggleActivo(${idx})'>${c.activo === false ? 'Reactivar' : 'Baja'}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.toggleActivo = async function(idx) {
    clientes[idx].activo = clientes[idx].activo === false ? true : false;
    await guardarClientes();
    renderTablaClientes();
}

document.getElementById('altaClienteForm').onsubmit = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreCliente').value.trim();
    const contacto = document.getElementById('contactoCliente').value.trim();
    const msg = document.getElementById('msgAlta');
    if(!nombre) {
        msg.textContent = 'El nombre es obligatorio.';
        msg.style.color = '#c00';
        return;
    }
    if(clientes.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
        msg.textContent = 'Ya existe un cliente con ese nombre.';
        msg.style.color = '#c00';
        return;
    }
    clientes.push({ nombre, contacto, activo: true });
    await guardarClientes();
    msg.textContent = 'Cliente guardado correctamente.';
    msg.style.color = '#080';
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
