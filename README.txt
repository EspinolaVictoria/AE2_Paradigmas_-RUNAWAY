RUNAWAY — PROYECTO UNIFICADO

Esta carpeta reúne en una sola versión las tres etapas anteriores del proyecto:

1. AE1 — Frontend HTML/CSS
   - index.html
   - listado_box.html
   - producto.html
   - comprar.html
   - style.css
   - recursos gráficos y documentación

2. TP2 — JavaScript Vanilla
   - algoritmica.html
   - script.js
   - suma de dos valores numéricos
   - clasificación del resultado como positivo, cero o negativo
   - actualización dinámica de cantidad, subtotal y total en comprar.html

3. Validación de cupón
   - función validarCupon()
   - captura del código desde input de texto
   - uso de trim() y toUpperCase()
   - validación mediante if / else
   - cupón válido: UCP10
   - mensajes de éxito y error mediante clases CSS

El proyecto mantiene la identidad visual y el diseño responsive de RUNAWAY.

ARCHIVOS PRINCIPALES
--------------------
index.html           Portada principal
listado_box.html     Listado de productos
producto.html        Ficha de producto
comprar.html         Formulario de compra, cantidad, subtotal y cupón
algoritmica.html     Ejercicio de suma y clasificación del resultado
style.css            Estilos generales y responsive
script.js            Comportamiento dinámico con JavaScript Vanilla

EJECUCIÓN
---------
No requiere instalación de dependencias.
Abrir index.html directamente en el navegador.

CUPÓN VÁLIDO
------------
UCP10


ACTIVIDAD EVALUATIVA 2 — MONITOR DE INVENTARIO
----------------------------------------------
Se incorporó inventario.html y data/inventario.json.

La lógica JavaScript se encuentra centralizada en app.js y utiliza:
- addEventListener()
- fetch()
- async / await
- manipulación dinámica del DOM
- filter(), find() y reduce()
- alertas de stock crítico

IMPORTANTE:
Como el módulo usa fetch() para leer un archivo JSON local, el proyecto debe abrirse
mediante un servidor local. En Visual Studio Code se puede utilizar Live Server.
Abrir inventario.html desde Live Server para probar la carga del stock.
