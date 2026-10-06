# Control Horas Clientes

Aplicación web para registrar las horas trabajadas para cada cliente y sacar informes. Tiene login de usuarios, alta de clientes, carga de horas e informes de resumen.

Sitio publicado: https://controlhorasclientes.netlify.app

## Funcionalidades

- **Login** con usuario y contraseña. Las contraseñas se guardan como hash SHA-256 en `data/usuarios.json`.
- **Panel principal** con acceso a las distintas secciones.
- **Clientes**: alta y modificación de la lista de clientes.
- **Registrar horas**: carga de horas trabajadas por cliente y fecha.
- **Informes**: resumen de horas por cliente.

## Cómo se usa

1. Entrá al sitio e iniciá sesión.
2. En **Clientes** cargá los clientes con los que trabajás.
3. En **Registrar Horas** anotá las horas de cada trabajo.
4. En **Informes** consultá el resumen de horas por cliente.

## Cómo funciona

- El frontend es HTML, CSS y JavaScript, sin build.
- Los datos están en archivos JSON dentro de `data/`:
  - `usuarios.json`: usuarios y hash de contraseña.
  - `listaClientes.json`: clientes.
  - `horasClientes.json`: horas registradas.
- Para guardar cambios, la app llama a dos Netlify Functions que actualizan esos archivos en el repositorio a través de la API de GitHub:
  - `update-clientes.js`
  - `update-horas.js`
- `hash_sha256.html` es una utilidad para calcular el hash de una contraseña nueva antes de agregarla a `usuarios.json`.

## Publicación en Netlify

Configurar estas variables de entorno:

| Variable | Para qué sirve |
|---|---|
| `GITHUB_TOKEN` | Token con permiso de escritura sobre este repositorio. |
| `GITHUB_REPO` | Repositorio donde están los JSON (por ejemplo `FABIOR1981/controlHorasClientes`). |
| `GITHUB_BRANCH` | Rama donde se guardan los cambios (por ejemplo `main`). |

## Estructura

```
index.html                 Entrada de la aplicación
html/                      Pantallas: login, dashboard, clientes, registro de horas, informes
js/                        Lógica de cada pantalla y configuración (config.js)
css/                       Estilos de cada pantalla
data/                      Datos en JSON (usuarios, clientes, horas)
netlify/functions/         Funciones que guardan los JSON en GitHub
documentacion/LEEME.md     Aviso: la documentación está en documentacion-central
```

Más información en [DETALLE.md](https://github.com/FABIOR1981/documentacion-central/blob/main/controlHorasClientes/documentacion/DETALLE.md), en documentacion-central.
