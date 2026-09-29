# Actividad Evaluativa 2 — Opción 12
## Monitor de Inventario y Alerta de Estado Crítico

**Integrante responsable de la mejora:** Espínola Victoria  
**Proyecto:** RUNAWAY  
**Materia:** Paradigmas y Lenguajes de Programación III

## Mejora incorporada

Se agregó un módulo de inventario que consulta los datos de stock desde `data/inventario.json`.
La carga se realiza mediante `fetch()` utilizando `async / await`. Los productos se mantienen
en memoria durante la sesión para permitir ajustes de stock sin recargar la página.

El sistema compara el stock actual de cada producto con su `umbralCritico`. Cuando el stock es
inferior a ese valor, la interfaz marca la fila como crítica, modifica la etiqueta de estado y
actualiza una alerta general en el DOM.

Todos los eventos se encuentran desacoplados del HTML. Los botones, el selector de filtro y la
recarga de datos utilizan `addEventListener()` desde `app.js`; no se utilizan atributos `onclick`
ni `onsubmit`.

## Flujo de funcionamiento

1. El usuario accede a `inventario.html`.
2. `app.js` solicita `data/inventario.json` de forma asíncrona.
3. Los datos recibidos se almacenan temporalmente en un array.
4. La tabla se genera dinámicamente en el DOM.
5. Se calculan las unidades totales y la cantidad de productos críticos.
6. Al aumentar o reducir el stock, se vuelve a evaluar el umbral de cada producto.
7. La interfaz actualiza los indicadores y las alertas sin recargar la página.

## Fundamentación mediante VSDM

Para esta mejora se utiliza VSDM como criterio conceptual de organización de vistas. El mismo
dominio de productos puede presentar información diferente según el tipo de usuario.

**Vista pública:** el visitante consulta catálogo, ficha, talles y precio. No necesita conocer
umbrales internos ni realizar ajustes de stock.

**Vista de gestión:** el operador consulta cantidad disponible, umbral crítico, estado del
inventario y controles de ajuste.

La separación permite reutilizar la información del producto y, al mismo tiempo, mostrar en cada
vista únicamente los datos necesarios para la tarea correspondiente.

### Mapa simplificado de vistas

Visitante  
`Inicio → Colección → Producto → Comprar`

Operador de gestión  
`Inventario → Filtrar estado → Consultar stock → Ajustar cantidad → Ver alerta`

En una implementación completa, la vista de inventario debería estar protegida por autenticación
y permisos. En esta etapa se desarrolla la vista y su comportamiento frontend.
