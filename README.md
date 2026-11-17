# RUNAWAY — AE4 Paradigmas y Lenguajes de Programación III

RUNAWAY es un e-commerce académico de indumentaria desarrollado para la materia Paradigmas y Lenguajes de Programación III.

El proyecto evoluciona la versión realizada en el AE2 hacia una aplicación dinámica con arquitectura cliente-servidor, API REST, persistencia en MySQL, autenticación de usuarios, control de acceso y consumo asíncrono mediante JavaScript.

## Funcionalidades

- Página principal responsive.
- Catálogo dinámico de productos.
- Búsqueda y filtrado de productos.
- Vista de detalle de cada producto.
- Proceso de compra.
- Cálculo de tarifas y aplicación del cupón `UCP10`.
- Registro de compras en MySQL.
- Registro de usuarios.
- Inicio y cierre de sesión.
- Perfil de usuario.
- Contraseñas almacenadas mediante BCRYPT.
- Monitor de inventario conectado a la base de datos.
- Alertas automáticas de stock crítico.
- Modificación persistente de stock para usuarios administradores.
- Control de acceso mediante sesiones y roles.

## Arquitectura

El sistema utiliza una arquitectura separada entre frontend y backend.

### Frontend

Desarrollado con:

- HTML5.
- CSS3.
- JavaScript Vanilla.
- Fetch API.
- Async/Await.
- Navegación tipo SPA para Inicio, Catálogo, Detalle y Compra.

El frontend consume los datos del servidor de manera asíncrona y actualiza la interfaz sin utilizar `innerHTML` para datos dinámicos.

### Backend

Desarrollado con:

- PHP 8.
- PDO.
- MySQL.
- API REST con respuestas JSON.
- Prepared Statements.
- Sesiones PHP.
- Arquitectura organizada mediante modelos y endpoints de API.

Los modelos concentran el acceso a los datos, mientras que los archivos de la carpeta `api` reciben las solicitudes HTTP y devuelven las respuestas JSON correspondientes.

## Base de datos

La estructura inicial se encuentra en:

`db/backend.sql`

La base contiene información de:

- usuarios;
- productos;
- cupones;
- compras;
- detalle de compras.

Los productos incluyen stock y umbral crítico para el funcionamiento del monitor de inventario.

## Seguridad

El proyecto implementa medidas relacionadas con OWASP Top 10:

- PDO con Prepared Statements para reducir el riesgo de SQL Injection.
- `password_hash()` con `PASSWORD_BCRYPT` para almacenar contraseñas.
- `password_verify()` para autenticación.
- sesiones PHP para identificar usuarios autenticados.
- regeneración del ID de sesión después del inicio de sesión.
- cookies de sesión con `HttpOnly` y `SameSite=Lax`.
- control de acceso por rol.
- respuesta `401 Unauthorized` cuando se intenta acceder a funciones privadas sin sesión.
- respuesta `403 Forbidden` cuando un usuario autenticado no posee los permisos necesarios.
- mensajes genéricos ante errores internos del servidor.
- uso de `textContent`, `createElement()` y `replaceChildren()` para evitar insertar directamente HTML recibido desde la API.

## API REST

Los principales endpoints se encuentran dentro de la carpeta `api`.

Entre ellos:

- `api/productos.php`
- `api/tarifas.php`
- `api/compras.php`
- `api/registro.php`
- `api/login.php`
- `api/perfil.php`
- `api/logout.php`

La documentación adicional de la API se encuentra en:

`docs/API_REST.md`

## Ejecución

El proyecto necesita PHP y MySQL.

### 1. Iniciar MySQL

Abrir XAMPP e iniciar:

`MySQL`

### 2. Crear la base de datos

Ingresar a phpMyAdmin e importar:

`db/backend.sql`

El script crea la base de datos `backend` y sus tablas.

### 3. Configurar la conexión

Revisar:

`config/conexion.php`

La configuración por defecto está preparada para una instalación habitual de XAMPP utilizando:

- host: `localhost`
- base de datos: `backend`
- usuario: `root`
- contraseña vacía

### 4. Iniciar el servidor PHP

Abrir PowerShell en la carpeta raíz del proyecto y ejecutar:

```powershell
C:\xampp\php\php.exe -S localhost:8000
```

### 5. Abrir la aplicación

Página principal:

`http://localhost:8000/index.html`

Cuenta:

`http://localhost:8000/cuenta.html`

Inventario:

`http://localhost:8000/inventario.html`

## Cuenta administrativa

Los usuarios registrados se crean inicialmente con rol de cliente.

El rol administrador permite realizar las operaciones protegidas de gestión de inventario.

Para las pruebas académicas puede asignarse el rol `admin` a un usuario desde la base de datos.

Después de modificar el rol se debe volver a iniciar sesión para actualizar los datos almacenados en la sesión.

## Accesibilidad

La interfaz utiliza:

- HTML semántico.
- navegación mediante teclado.
- estados de foco visibles.
- textos alternativos en imágenes.
- etiquetas asociadas a formularios.
- encabezados de tablas con `scope`.
- regiones `aria-live` para mensajes dinámicos.
- enlace para saltar directamente al contenido principal.

## Cupón de prueba

Código:

`UCP10`

Descuento:

`10 %`

## Integrantes

Proyecto desarrollado para Paradigmas y Lenguajes de Programación III.

Universidad de la Cuenca del Plata — 2026.
