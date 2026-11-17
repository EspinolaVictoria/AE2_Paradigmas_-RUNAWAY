# Capítulo 1 — Dominio del Problema y Trazabilidad AE1

## 1.1 Problema

RUNAWAY es una marca de indumentaria *streetwear* de Posadas, Argentina. Su tienda necesita mostrar las piezas de la colección, permitir elegir talle y registrar pedidos, y además controlar el stock para no vender prendas agotadas.

En el AE1 se resolvió la parte visual: cinco páginas HTML estáticas (inicio, colección, producto, compra e inventario) con la identidad de la marca. Esa maqueta tenía tres límites:

- **Datos duplicados**: cada producto estaba escrito a mano en varias páginas, por lo que un cambio de precio obligaba a editar varios archivos.
- **Sin persistencia**: el formulario de compra no guardaba nada.
- **Sin continuidad**: cada enlace recargaba la página completa y el usuario perdía el contexto (producto, talle, cupón).

## 1.2 Casos de uso

| Caso | Actor | Descripción | Dónde se resuelve ahora |
|---|---|---|---|
| CU02 | Cliente | Consultar el catálogo y filtrarlo por texto o categoría | Vista `#/catalogo`, `GET /api/productos.php?q=&categoria=` |
| CU03 | Cliente | Ver la ficha de una pieza y elegir talle | Vista `#/producto/:id`, `GET /api/productos.php?id=` |
| CU06 | Cliente | Completar los datos, aplicar un cupón y confirmar el pedido | Vista `#/comprar`, `GET /api/tarifas.php` y `POST /api/compras.php` |
| CU07 | Cliente / Admin | Consultar compras registradas | `GET /api/compras.php` (la vista de cuenta se mantiene en `cuenta.html`) |

## 1.3 Evolución de la maqueta estática a SPA

| Aspecto | AE1 (maqueta) | AE2 (SPA) |
|---|---|---|
| Páginas | `index`, `listado_box`, `producto`, `comprar` | Un único `index.html` con vistas por ruta (`#/`, `#/catalogo`, `#/producto/:id`, `#/comprar`) |
| Datos | Escritos en el HTML | Obtenidos de la API con `fetch()` y `async/await` |
| Navegación | Recarga completa | Router por hash; cambia solo el contenido de `<main>` |
| Buscador | Filtraba un JSON local en el navegador | Consulta al servidor con `q` y `categoria` |
| Compra | Producto fijo en el texto | Producto, talle y precio vienen de la API; el servidor recalcula el total |
| Seguridad del DOM | Contenido fijo | Sin `innerHTML`: los nodos se crean con `createElement` y `textContent` |
| Accesibilidad | Sin tratamiento específico | Foco visible, enlace para saltar al contenido, `aria-live="polite"`, `aria-pressed` en talles |

### Estructura del front-end

```
index.html          shell: menú, <main>, región aria-live y <template> estáticos
app.js              punto de entrada: registra rutas y gestiona foco y título
js/router.js        router por hash
js/api.js           cliente fetch() de productos, tarifas y compras
js/dom.js           helpers seguros para crear nodos
js/anuncios.js      anuncios para lectores de pantalla
js/vistas/          inicio, catalogo, detalle, comprar
```

## 1.4 Trazabilidad

| Requisito | Evidencia |
|---|---|
| Consigna 2.1: SPA dinámica con JavaScript Vanilla y `fetch()` | `app.js`, `js/router.js`, `js/api.js` |
| Consigna 4.A: HTML sin PHP embebido | Todas las páginas son `.html` estáticas; el PHP queda en `api/` |
| Consigna 4.A: `async/await` | `js/api.js` y las vistas |
| Consigna 4.A: evitar `innerHTML` inseguro | No hay `innerHTML` en el código de la SPA (`js/dom.js` usa `textContent`) |
| Consigna 4.A: `aria-live="polite"` | `#anuncios` en `index.html` y `#mensajeCompra` en la plantilla de compra |
| Consigna 4.A: `:focus-visible` | Final de `style.css` |
| Consigna 4.A: navegación por teclado | Enlace «Saltar al contenido», foco al cambiar de vista, talles como `<button>` |
