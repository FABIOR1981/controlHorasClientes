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
                let minutosTotales = 0;
                // Si hay inicio y fin, calcular minutos totales
                if (t.inicio && t.fin) {
                    const [h1, m1] = t.inicio.split(':').map(Number);
                    const [h2, m2] = t.fin.split(':').map(Number);
                    minutosTotales = (h2*60 + m2) - (h1*60 + m1);
                    if(minutosTotales < 0) minutosTotales += 24*60;
                } else if (t.horas && t.horas.includes(':')) {
                    // Si ya viene en formato HH:MM
                    const [h, m] = t.horas.split(':').map(Number);
                    minutosTotales = h*60 + m;
                } else if (t.horas) {
                    // Si viene en decimal (ej: 1.5, 2.25)
                    let partes = t.horas.split('.');
                    let h = parseInt(partes[0] || '0');
                    let m = parseInt(partes[1] || '0');
                    if (m > 0) {
                        // Si los decimales son minutos (ej: 1.30 = 1h 30m)
                        if (m < 60) {
                            minutosTotales = h*60 + m;
                        } else {
                            // Si los decimales son decimales (ej: 1.5 = 1h 30m)
                            minutosTotales = h*60 + Math.round(60 * (parseFloat('0.'+m)));
                        }
                    } else {
                        minutosTotales = h*60;
                    }
                }
                // Formatear a HH:MM
                let horasFinal = Math.floor(minutosTotales/60).toString().padStart(2,'0') + ':' + (minutosTotales%60).toString().padStart(2,'0');
                if (!t.inicio && !t.fin && !t.horas) horasFinal = '-';
                tramosHtml += `${t.inicio || '-'} - ${t.fin || '-'} (${horasFinal})<br>`;
                totalDia += minutosTotales;
            });
            // Mostrar total del día en formato HH:MM
            let totalDiaStr = Math.floor(totalDia/60).toString().padStart(2,'0') + ':' + (totalDia%60).toString().padStart(2,'0');
            html += `<tr><td>${r.fecha}</td><td>${tramosHtml}</td><td>${totalDiaStr}</td></tr>`;
            totalCliente += totalDia;
        });
        // Mostrar total del cliente en formato HH:MM
        let totalClienteStr = Math.floor(totalCliente/60).toString().padStart(2,'0') + ':' + (totalCliente%60).toString().padStart(2,'0');
        html += `<tr class='total-row'><td colspan='2'>Total ${cliente}</td><td>${totalClienteStr}</td></tr>`;
        // (Líneas duplicadas eliminadas)
        html += '</tbody></table>';
    });
    resultado.innerHTML = html;
};

cargarClientesInforme();
