// registro_horas.js - Lógica para registrar horas por cliente y día

let tramos = [];

// Cargar clientes en el select
async function cargarClientes() {
    const select = document.getElementById('clienteSelect');
    select.innerHTML = '';
    try {
        const resp = await fetch('../data/listaClientes.json');
        const clientes = await resp.json();
        clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nombre;
            opt.textContent = c.nombre;
            select.appendChild(opt);
        });
    } catch {}
}

// Renderizar tramos horarios
function renderTramos() {
    const container = document.getElementById('tramosContainer');
    container.innerHTML = '';
    tramos.forEach((tramo, idx) => {
        container.innerHTML += `<div class="tramo-item">
            <label>Hora inicio: <input type="time" value="${tramo.inicio}" onchange="actualizarTramo(${idx}, 'inicio', this.value)"></label>
            <label>Hora fin: <input type="time" value="${tramo.fin}" onchange="actualizarTramo(${idx}, 'fin', this.value)"></label>
            <label>Horas totales: <input type="number" min="0" step="0.1" value="${tramo.horas}" onchange="actualizarTramo(${idx}, 'horas', this.value)"></label>
            <button type="button" onclick="eliminarTramo(${idx})">Eliminar</button>
        </div>`;
    });
}

window.actualizarTramo = function(idx, campo, valor) {
    tramos[idx][campo] = valor;
    renderTramos();
}

window.eliminarTramo = function(idx) {
    tramos.splice(idx, 1);
    renderTramos();
}

document.getElementById('agregarTramoBtn').onclick = function() {
    tramos.push({ inicio: '', fin: '', horas: '' });
    renderTramos();
};

document.getElementById('registroHorasForm').onsubmit = async function(e) {
    e.preventDefault();
    const cliente = document.getElementById('clienteSelect').value;
    const fecha = document.getElementById('fecha').value;
    const msg = document.getElementById('msgRegistro');
    if (!cliente || !fecha || tramos.length === 0) {
        msg.textContent = 'Completa todos los campos y agrega al menos un tramo.';
        msg.style.color = '#c00';
        return;
    }
    // Leer registros existentes
    let registros = [];
    try {
        const resp = await fetch('../data/horasClientes.json');
        registros = await resp.json();
    } catch {}
    // Buscar si ya existe registro para cliente y fecha
    let registro = registros.find(r => r.cliente === cliente && r.fecha === fecha);
    if (registro) {
        registro.tramos = tramos;
    } else {
        registros.push({ cliente, fecha, tramos });
    }
    // Guardar realmente usando función serverless
    try {
        const resp = await fetch('/.netlify/functions/update-horas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: registros })
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            msg.textContent = 'Registro guardado correctamente.';
            msg.style.color = '#080';
            tramos = [];
            renderTramos();
            document.getElementById('registroHorasForm').reset();
        } else {
            msg.textContent = 'Error al guardar: ' + (result.error || '');
            msg.style.color = '#c00';
        }
    } catch {
        msg.textContent = 'No se pudo guardar el registro (error de red o función).';
        msg.style.color = '#c00';
    }
};

cargarClientes();
renderTramos();
