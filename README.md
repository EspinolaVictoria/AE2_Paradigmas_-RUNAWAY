# RUNAWAY — AE4 en desarrollo

RUNAWAY es un e-commerce académico de indumentaria desarrollado para Paradigmas y Lenguajes de Programación III. Esta versión reúne la interfaz del proyecto y los módulos dinámicos realizados por el equipo.

## Funcionalidades incluidas

- Portada, colección, ficha de producto y checkout responsive.
- Monitor de inventario y alertas de stock (`inventario.html`, `app.js`, `data/inventario.json`).
- Buscador y filtro dinámico de catálogo (`buscador.js`, `data/catalogo.json`).
- API REST JSON para consultar, crear, actualizar y desactivar productos (`api/productos.php`).
- Calculador de tarifas y cupón UCP10 conectado a MySQL (`tarifas.js`, `api/tarifas.php`).
- Registro de compras persistentes desde el checkout (`api/compras.php`), con cálculo del total y control de stock en el servidor.
- Registro, inicio de sesión, perfil y cierre de sesión mediante PHP, PDO, sesiones y MySQL (`cuenta.html`, `auth.js`, `api/`, `config/`, `db/`).

La documentación de métodos, parámetros, ejemplos JSON y códigos HTTP se encuentra en [`docs/API_REST.md`](docs/API_REST.md).

## Ejecución completa

Esta versión utiliza PHP y MySQL, por lo que para probar todas las funciones no debe abrirse con doble clic ni únicamente con Live Server.

1. Iniciar MySQL en XAMPP.
2. Importar `db/backend.sql` desde phpMyAdmin.
3. Revisar `config/conexion.php`. Por defecto está configurado para usuario `root` sin contraseña, que es la configuración habitual de XAMPP.
4. Abrir una terminal en la raíz del proyecto y ejecutar:

```powershell
C:\xampp\php\php.exe -S localhost:8000
```

5. Abrir en el navegador:

`http://localhost:8000/index.html`

La cuenta se encuentra en `http://localhost:8000/cuenta.html`.

## Cupón

Código válido: `UCP10` (10% de descuento).


## Seguridad y arquitectura

La versión actual aplica:
- sesiones PHP para endpoints privados;
- respuesta `401 Unauthorized` cuando no existe una sesión activa;
- regeneración del ID de sesión luego de autenticar;
- destrucción de sesión y expiración de la cookie al cerrar sesión;
- `password_hash(..., PASSWORD_BCRYPT)` y `password_verify()`;
- PDO con Prepared Statements y parámetros nombrados;
- renderizado seguro del frontend mediante `textContent`, `createElement()` y `replaceChildren()`;
- endpoints PHP con respuestas JSON y códigos HTTP semánticos;
- consumo asíncrono mediante `fetch()` y `async/await`.
