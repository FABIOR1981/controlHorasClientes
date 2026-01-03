// alta_cliente.js - Lógica para alta de clientes en controlHorasClientes

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
    // Leer clientes existentes
    let clientes = [];
    try {
        const resp = await fetch('../data/listaClientes.json');
        clientes = await resp.json();
    } catch {}
    // Verificar si ya existe
    if(clientes.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
        msg.textContent = 'Ya existe un cliente con ese nombre.';
        msg.style.color = '#c00';
        return;
    }
    // Agregar nuevo cliente
    clientes.push({ nombre, contacto });
    // Guardar realmente usando función serverless
    try {
        const resp = await fetch('/.netlify/functions/update-clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: clientes })
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            msg.textContent = 'Cliente guardado correctamente.';
            msg.style.color = '#080';
            document.getElementById('altaClienteForm').reset();
        } else {
            msg.textContent = 'Error al guardar: ' + (result.error || '');
            msg.style.color = '#c00';
        }
    } catch {
        msg.textContent = 'No se pudo guardar el cliente (error de red o función).';
        msg.style.color = '#c00';
    }
};
