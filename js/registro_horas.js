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
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button type='button' onclick='editarTramo(${idx})'>Editar</button>
                    <button type='button' onclick='eliminarTramo(${idx})'>Eliminar</button>
                </div>
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
        const msg = document.getElementById('msgRegistro');
        // Validar que la hora final sea estrictamente mayor que la inicial (no permite cruzar medianoche)
        if(inicio && fin) {
            const [h1, m1] = inicio.split(':').map(Number);
            const [h2, m2] = fin.split(':').map(Number);
            const minutosInicio = h1*60 + m1;
            const minutosFin = h2*60 + m2;
            if(minutosFin <= minutosInicio) {
                msg.textContent = 'La hora final debe ser mayor que la hora inicial (no se permite cruzar medianoche).';
                msg.style.color = '#c00';
                return;
            }
            let totalMin = minutosFin - minutosInicio;
            const horasEnteras = Math.floor(totalMin / 60);
            const minutos = totalMin % 60;
            horas = `${horasEnteras}:${minutos.toString().padStart(2,'0')}`;
        }
        if(!inicio && !fin && !horas) return;
        tramos.push({ inicio, fin, horas });
        document.getElementById('nuevoInicio').value = '';
        document.getElementById('nuevoFin').value = '';
        document.getElementById('nuevoHoras').value = '';
        msg.textContent = '';
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
    // Validar solapamientos con otros clientes en la misma fecha
    let conflictos = [];
    registros.filter(r => r.fecha === fecha && r.cliente !== cliente).forEach(r => {
        r.tramos.forEach((t2, idx2) => {
            tramos.forEach((t1, idx1) => {
                if (t1.inicio && t1.fin && t2.inicio && t2.fin) {
                    // Convertir a minutos
                    const t1ini = t1.inicio.split(':').map(Number);
                    const t1fin = t1.fin.split(':').map(Number);
                    const t2ini = t2.inicio.split(':').map(Number);
                    const t2fin = t2.fin.split(':').map(Number);
                    const t1start = t1ini[0]*60 + t1ini[1];
                    const t1end = t1fin[0]*60 + t1fin[1];
                    const t2start = t2ini[0]*60 + t2ini[1];
                    const t2end = t2fin[0]*60 + t2fin[1];
                    // Verificar solapamiento
                    if (t1start < t2end && t2start < t1end) {
                        conflictos.push(`Conflicto: ${cliente} (${t1.inicio}-${t1.fin}) y ${r.cliente} (${t2.inicio}-${t2.fin}) en ${fecha}`);
                    }
                    // Verificar franja idéntica
                    if (t1.inicio === t2.inicio && t1.fin === t2.fin) {
                        conflictos.push(`Franja idéntica: ${cliente} y ${r.cliente} (${t1.inicio}-${t1.fin}) en ${fecha}`);
                    }
                }
            });
        });
    });
    if (conflictos.length > 0) {
        mostrarModalConflictos(conflictos.join('\n'));
        return;
    }
    // Buscar si ya existe registro para cliente y fecha
    let registro = registros.find(r => r.cliente === cliente && r.fecha === fecha);
    if (registro) {
        registro.tramos = tramos;
    } else {
        registros.push({ cliente, fecha, tramos });
    }
    cargarClientes();
    renderTramos();

    // Modal para mostrar conflictos
    function mostrarModalConflictos(mensaje) {
        let modal = document.getElementById('modalConflictos');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalConflictos';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.4)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.innerHTML = `<div style='background:#fff; padding:32px; border-radius:8px; max-width:500px; box-shadow:0 2px 12px #0003;'>
                <h3 style='margin-top:0;'>Conflicto de horarios</h3>
                <textarea style='width:100%;height:120px;'>${mensaje}</textarea>
                <div style='margin-top:18px; text-align:right;'><button id='cerrarModalConflictos'>Cerrar</button></div>
            </div>`;
            document.body.appendChild(modal);
            document.getElementById('cerrarModalConflictos').onclick = function() {
                modal.remove();
            };
        } else {
            modal.querySelector('textarea').value = mensaje;
            modal.style.display = 'flex';
        }
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
