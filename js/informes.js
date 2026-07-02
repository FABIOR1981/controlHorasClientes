// informes.js - Lógica para mostrar informes de horas por cliente y periodo

let vistaActual = 'classic';

function getReportConfig() {
    if (document.getElementById('formInforme2')) {
        return {
            formId: 'formInforme2',
            selectId: 'clienteInforme2',
            startId: 'fechaInicio2',
            endId: 'fechaFin2',
            resultId: 'resultadoInforme2',
            buttonId: 'btnGenerarInforme2',
            mode: 'nuevo'
        };
    }

    return {
        formId: 'formInforme',
        selectId: 'clienteInforme',
        startId: 'fechaInicio',
        endId: 'fechaFin',
        resultId: 'resultadoInforme',
        buttonId: null,
        mode: 'classic'
    };
}

function sanitizeFileName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'informe';
}

function buildReportFileName(cliente, fechaInicio, fechaFin) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    if (cliente === 'todos') {
        return `Informe_${today}.pdf`;
    }
    const safeCliente = sanitizeFileName(cliente);
    const inicio = (fechaInicio || today).replace(/-/g, '');
    const fin = (fechaFin || today).replace(/-/g, '');
    return `${safeCliente}_${inicio}_${fin}.pdf`;
}

function triggerPdfDownload(fileName) {
    const previousTitle = document.title;
    document.title = fileName;
    window.setTimeout(() => {
        window.print();
        window.setTimeout(() => {
            document.title = previousTitle;
        }, 500);
    }, 150);
}

function getHorasTotalesEnMinutos(tramos) {
    return (tramos || []).reduce((sum, t) => {
        let minutosTotales = 0;
        if (t.inicio && t.fin) {
            const [h1, m1] = t.inicio.split(':').map(Number);
            const [h2, m2] = t.fin.split(':').map(Number);
            minutosTotales = (h2*60 + m2) - (h1*60 + m1);
            if(minutosTotales < 0) minutosTotales += 24*60;
        } else if (t.horas && t.horas.includes(':')) {
            const [h, m] = t.horas.split(':').map(Number);
            minutosTotales = h*60 + m;
        } else if (t.horas) {
            let partes = t.horas.split('.');
            let h = parseInt(partes[0] || '0');
            let m = parseInt(partes[1] || '0');
            if (m > 0) {
                if (m < 60) {
                    minutosTotales = h*60 + m;
                } else {
                    minutosTotales = h*60 + Math.round(60 * (parseFloat('0.'+m)));
                }
            } else {
                minutosTotales = h*60;
            }
        }
        return sum + minutosTotales;
    }, 0);
}

function formatearHoras(minutos) {
    if (!Number.isFinite(minutos)) return '-';
    const horas = Math.floor(minutos / 60).toString().padStart(2, '0');
    const mins = (minutos % 60).toString().padStart(2, '0');
    return `${horas}:${mins}`;
}

function renderInformeClassic(registros, cliente) {
    let html = '';
    const clientesAgrupados = {};
    registros.forEach(r => {
        if(!clientesAgrupados[r.cliente]) clientesAgrupados[r.cliente] = [];
        clientesAgrupados[r.cliente].push(r);
    });
    const clientesOrdenados = Object.keys(clientesAgrupados).sort((a, b) => a.localeCompare(b));
    clientesOrdenados.forEach(nombreCliente => {
        html += `<h3>Cliente: ${nombreCliente}</h3>`;
        html += `<table class='tabla-informe'><thead><tr><th>Fecha</th><th>Carga Horaria</th><th>Total horas</th></tr></thead><tbody>`;
        let totalCliente = 0;
        clientesAgrupados[nombreCliente].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(r => {
            let tramosHtml = '';
            let totalDia = 0;
            r.tramos.forEach(t => {
                const minutosTotales = getHorasTotalesEnMinutos([t]);
                const horasFinal = formatearHoras(minutosTotales);
                tramosHtml += `${t.inicio || '-'} - ${t.fin || '-'} (${horasFinal})<br>`;
                totalDia += minutosTotales;
            });
            const totalDiaStr = formatearHoras(totalDia);
            html += `<tr><td>${r.fecha}</td><td>${tramosHtml}</td><td>${totalDiaStr}</td></tr>`;
            totalCliente += totalDia;
        });
        const totalClienteStr = formatearHoras(totalCliente);
        html += `<tr class='total-row'><td colspan='2'>Total ${nombreCliente}</td><td>${totalClienteStr}</td></tr>`;
        html += '</tbody></table>';
    });
    return html;
}

function renderInformeNuevo(registros, cliente) {
    const clientesAgrupados = {};
    registros.forEach(r => {
        if(!clientesAgrupados[r.cliente]) clientesAgrupados[r.cliente] = [];
        clientesAgrupados[r.cliente].push(r);
    });
    const clientesOrdenados = Object.keys(clientesAgrupados).sort((a, b) => a.localeCompare(b));

    let html = '<div class="report-sheet">';
    html += `<h2>Informe de horas${cliente !== 'todos' ? ` - ${cliente}` : ''}</h2>`;
    html += '<div class="report-summary">';
    clientesOrdenados.forEach(nombreCliente => {
        const totalCliente = clientesAgrupados[nombreCliente].reduce((sum, r) => sum + getHorasTotalesEnMinutos(r.tramos), 0);
        html += `<div class="report-card"><strong>${nombreCliente}</strong><span>${formatearHoras(totalCliente)} hs</span></div>`;
    });
    html += '</div>';
    html += '<table class="tabla-informe tabla-informe-nueva"><thead><tr><th>Cliente</th><th>Fecha</th><th>Detalle</th><th>Horas</th></tr></thead><tbody>';
    clientesOrdenados.forEach(nombreCliente => {
        clientesAgrupados[nombreCliente].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(r => {
            const detalle = (r.tramos || []).map(t => `${t.inicio || '-'} - ${t.fin || '-'} (${formatearHoras(getHorasTotalesEnMinutos([t]))})`).join('<br>');
            const totalDia = formatearHoras(getHorasTotalesEnMinutos(r.tramos));
            html += `<tr><td>${nombreCliente}</td><td>${r.fecha}</td><td>${detalle}</td><td>${totalDia}</td></tr>`;
        });
    });
    html += '</tbody></table></div>';
    return html;
}

async function cargarClientesInforme(config = getReportConfig()) {
    const select = document.getElementById(config.selectId);
    if (!select) return;
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

async function generarInforme(config, { shouldDownload = false } = {}) {
    const cliente = document.getElementById(config.selectId).value;
    const fechaInicio = document.getElementById(config.startId).value;
    const fechaFin = document.getElementById(config.endId).value;
    const resultado = document.getElementById(config.resultId);
    if (!resultado) return;

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

    const html = config.mode === 'nuevo' ? renderInformeNuevo(registros, cliente) : renderInformeClassic(registros, cliente);
    resultado.innerHTML = html;

    if (shouldDownload) {
        const fileName = buildReportFileName(cliente, fechaInicio, fechaFin);
        window.setTimeout(() => triggerPdfDownload(fileName), 100);
    }
}

function setVistaInforme(vista) {
    vistaActual = vista;
    const config = getReportConfig();
    if (config.formId === 'formInforme') {
        const form = document.getElementById(config.formId);
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const config = getReportConfig();
    cargarClientesInforme(config);
    const form = document.getElementById(config.formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generarInforme(config, { shouldDownload: false });
        });
    }
    const button = config.buttonId ? document.getElementById(config.buttonId) : null;
    if (button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            generarInforme(config, { shouldDownload: true });
        });
    }
    if (config.mode === 'classic') {
        setVistaInforme('classic');
    }
});
