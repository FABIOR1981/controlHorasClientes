// informes.js - Lógica para mostrar informes de horas por cliente y periodo

async function cargarClientesInforme() {
    const select = document.getElementById('clienteInforme');
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

function filtrarPorFecha(registros, inicio, fin) {
    return registros.filter(r => r.fecha >= inicio && r.fecha <= fin);
}

document.getElementById('formInforme').onsubmit = async function(e) {
    e.preventDefault();
    const cliente = document.getElementById('clienteInforme').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const resultado = document.getElementById('resultadoInforme');
    resultado.innerHTML = '';
    let registros = [];
    try {
        const resp = await fetch('../data/horasClientes.json');
        registros = await resp.json();
    } catch {}
    registros = filtrarPorFecha(registros, fechaInicio, fechaFin);
    if(cliente !== 'todos') {
        registros = registros.filter(r => r.cliente === cliente);
    }
    if(registros.length === 0) {
        resultado.innerHTML = '<p>No hay registros para el periodo seleccionado.</p>';
        return;
    }
    // Agrupar por cliente y fecha, y ordenar
    let html = '';
    const clientesAgrupados = {};
    registros.forEach(r => {
        if(!clientesAgrupados[r.cliente]) clientesAgrupados[r.cliente] = [];
        clientesAgrupados[r.cliente].push(r);
    });
    // Ordenar clientes alfabéticamente
    const clientesOrdenados = Object.keys(clientesAgrupados).sort((a, b) => a.localeCompare(b));
    clientesOrdenados.forEach(cliente => {
        html += `<h3>Cliente: ${cliente}</h3>`;
        html += `<table class='tabla-informe'><thead><tr><th>Fecha</th><th>Tramos</th><th>Total horas</th></tr></thead><tbody>`;
        let totalCliente = 0;
        // Ordenar registros por fecha
        clientesAgrupados[cliente].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(r => {
            let tramosHtml = '';
            let totalDia = 0;
            r.tramos.forEach(t => {
                let horasMostrar = t.horas;
                // Si hay inicio y fin, recalcular en formato decimal correcto
                if (t.inicio && t.fin) {
                    const [h1, m1] = t.inicio.split(':').map(Number);
                    const [h2, m2] = t.fin.split(':').map(Number);
                    let totalMin = (h2*60 + m2) - (h1*60 + m1);
                    if(totalMin < 0) totalMin += 24*60;
                    const horas = Math.floor(totalMin / 60);
                    const minutos = totalMin % 60;
                    horasMostrar = `${horas}.${minutos.toString().padStart(2,'0')}`;
                }
                tramosHtml += `${t.inicio || '-'} - ${t.fin || '-'} (${horasMostrar || '-'})<br>`;
                totalDia += parseFloat(horasMostrar) || 0;
            });
            html += `<tr><td>${r.fecha}</td><td>${tramosHtml}</td><td>${totalDia.toFixed(2)}</td></tr>`;
            totalCliente += totalDia;
        });
        html += `<tr class='total-row'><td colspan='2'>Total ${cliente}</td><td>${totalCliente.toFixed(2)}</td></tr>`;
        html += '</tbody></table>';
    });
    resultado.innerHTML = html;
};

cargarClientesInforme();
