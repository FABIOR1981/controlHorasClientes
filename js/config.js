// Archivo de configuración para controlHorasClientes
// Modificar los valores según corresponda

window.config = {
        rubros: [
            "Importador",
            "Exportador",
            "Despachante de Aduana",
            "Comercio",
            "Agente",
            "Línea marítima",
            "Aerolínea"
        ],
    googleCalendarAccount: "", // Cuenta de Gmail para futura integración
    // Otros parámetros de configuración pueden agregarse aquí
    sessionDuration: 8 * 60 * 60 * 1000 // Duración de sesión en milisegundos (8 horas)
};

// Debug: confirmar carga de config
//console.log('config.js cargado, window.config:', window.config);
