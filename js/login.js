// login.js - Lógica de login para controlHorasClientes
// Utiliza SHA-256 para validar contraseñas

async function sha256(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validarLogin(documento, contrasena) {
    const resp = await fetch('../data/usuarios.json');
    const usuarios = await resp.json();
    const hash = await sha256(contrasena);
    const usuario = usuarios.find(u => u.documento === documento && u.contrasena === hash && u.activo);
    return usuario || null;
}

// Ejemplo de uso:
// document.getElementById('loginForm').onsubmit = async function(e) {
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const pass = document.getElementById('contrasena').value;
//     const usuario = await validarLogin(email, pass);
//     if(usuario) {
//         // Login exitoso
//     } else {
//         // Mostrar error
//     }
// }
