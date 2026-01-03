// Cargar tramos existentes al cambiar cliente o fecha
document.getElementById('clienteSelect').addEventListener('change', cargarTramosExistentes);
document.getElementById('fecha').addEventListener('change', cargarTramosExistentes);

function cargarTramosExistentes() {
    const cliente = document.getElementById('clienteSelect').value;
    const fecha = document.getElementById('fecha').value;
    if (!cliente || !fecha) {
        tramos = [];
        renderTramos();
        return;
    }
    fetch('../data/horasClientes.json')
        .then(resp => resp.json())
        .then(registros => {
            const registro = registros.find(r => r.cliente === cliente && r.fecha === fecha);
            tramos = registro ? [...registro.tramos] : [];
            renderTramos();
        })
        .catch(() => {
            tramos = [];
            renderTramos();
        });
}
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
        clientes.filter(c => c.activo !== false).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nombre;
            opt.textContent = c.nombre;
            select.appendChild(opt);
        });
    } catch {}
}

// Renderizar tramos en la tabla tipo Excel
function renderTramos() {
    const tbody = document.getElementById('tbodyTramos');
    if (!tbody) return;
    tbody.innerHTML = '';
    tramos.forEach((tramo, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style='padding:6px; border:1px solid #ccc;'>${tramo.inicio || '-'}</td>
            <td style='padding:6px; border:1px solid #ccc;'>${tramo.fin || '-'}</td>
            <td style='padding:6px; border:1px solid #ccc;'>${tramo.horas || '-'}</td>
            <td style='padding:6px; border:1px solid #ccc;'>
                <button type='button' onclick='editarTramo(${idx})'>Editar</button>
                <button type='button' onclick='eliminarTramo(${idx})'>Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editarTramo = function(idx) {
    const tramo = tramos[idx];
    document.getElementById('nuevoInicio').value = tramo.inicio;
    document.getElementById('nuevoFin').value = tramo.fin;
    document.getElementById('nuevoHoras').value = tramo.horas;
    // Al editar, eliminar el tramo actual para que se re-agregue
    tramos.splice(idx, 1);
    renderTramos();
}

window.actualizarTramo = function(idx, campo, valor) {
    tramos[idx][campo] = valor;
    renderTramos();
}

window.eliminarTramo = function(idx) {
    tramos.splice(idx, 1);
    renderTramos();
}


document.addEventListener('click', function(e) {
    if(e.target && e.target.id === 'addTramoBtn') {
        const inicio = document.getElementById('nuevoInicio').value;
        const fin = document.getElementById('nuevoFin').value;
        let horas = document.getElementById('nuevoHoras').value;
        // Si hay inicio y fin, calcular horas automáticamente
        if(inicio && fin) {
            const [h1, m1] = inicio.split(':').map(Number);
            const [h2, m2] = fin.split(':').map(Number);
            let totalMin = (h2*60 + m2) - (h1*60 + m1);
            if(totalMin < 0) totalMin += 24*60; // por si cruza medianoche
            const horasEnteras = Math.floor(totalMin / 60);
            const minutos = totalMin % 60;
            horas = `${horasEnteras}:${minutos.toString().padStart(2,'0')}`;
        }
        if(!inicio && !fin && !horas) return;
        tramos.push({ inicio, fin, horas });
        document.getElementById('nuevoInicio').value = '';
        document.getElementById('nuevoFin').value = '';
        document.getElementById('nuevoHoras').value = '';
        renderTramos();
    }
});

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
