document.addEventListener("DOMContentLoaded", function () {
    const campoBuscar = document.getElementById("campoBuscar");
    const selectCategoria = document.getElementById("selectCategoria");
    const botonLimpiar = document.getElementById("botonLimpiar");
    const cuerpoCatalogo = document.getElementById("cuerpoCatalogo");
    const contadorCatalogo = document.getElementById("contadorCatalogo");

    if (!campoBuscar || !selectCategoria || !botonLimpiar || !cuerpoCatalogo) {
        return;
    }

    let catalogo = [];

    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function formatearPrecio(valor) {
        return "$" + Number(valor).toLocaleString("es-AR");
    }

    function cargarCategorias() {
        const categorias = [...new Set(catalogo.map(function (producto) {
            return producto.categoria;
        }))];

        categorias.forEach(function (categoria) {
            const opcion = document.createElement("option");
            opcion.value = categoria;
            opcion.textContent = categoria;
            selectCategoria.appendChild(opcion);
        });
    }

    function crearCeldaTexto(texto) {
        const celda = document.createElement("td");
        celda.textContent = texto;
        return celda;
    }

    function crearFilaProducto(producto) {
        const fila = document.createElement("tr");

        const referencia = crearCeldaTexto(producto.ref);

        const visual = document.createElement("td");
        const imagen = document.createElement("img");
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;
        visual.appendChild(imagen);

        const productoCelda = document.createElement("td");
        const nombre = document.createElement("strong");
        const subtitulo = document.createElement("small");
        nombre.textContent = producto.nombre;
        subtitulo.textContent = producto.subtitulo;
        productoCelda.append(nombre, subtitulo);

        const especificacion = crearCeldaTexto(producto.especificacion);
        const talles = crearCeldaTexto(producto.talles);
        const precio = crearCeldaTexto(formatearPrecio(producto.precio));

        const accion = document.createElement("td");
        const enlace = document.createElement("a");
        enlace.href = producto.enlace;
        enlace.textContent = "Ver pieza →";
        accion.appendChild(enlace);

        fila.append(
            referencia,
            visual,
            productoCelda,
            especificacion,
            talles,
            precio,
            accion
        );

        return fila;
    }

    function mostrarMensajeTabla(mensaje) {
        cuerpoCatalogo.replaceChildren();

        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.className = "catalogo-sin-resultados";
        celda.textContent = mensaje;

        fila.appendChild(celda);
        cuerpoCatalogo.appendChild(fila);
    }

    function mostrarProductos(productos) {
        cuerpoCatalogo.replaceChildren();

        if (productos.length === 0) {
            mostrarMensajeTabla("No se encontraron piezas con esa búsqueda.");
        } else {
            productos.forEach(function (producto) {
                cuerpoCatalogo.appendChild(crearFilaProducto(producto));
            });
        }

        if (contadorCatalogo) {
            contadorCatalogo.textContent =
                productos.length + " DE " + catalogo.length + " ITEMS / DROP 01";
        }
    }

    function aplicarFiltros() {
        const textoBuscado = normalizar(campoBuscar.value.trim());
        const categoriaElegida = selectCategoria.value;

        const resultado = catalogo.filter(function (producto) {
            const coincideCategoria =
                categoriaElegida === "todas" ||
                producto.categoria === categoriaElegida;

            const textoDelProducto = [
                producto.ref,
                producto.nombre,
                producto.subtitulo,
                producto.categoria,
                producto.especificacion
            ].join(" ");

            const coincideTexto =
                normalizar(textoDelProducto).includes(textoBuscado);

            return coincideCategoria && coincideTexto;
        });

        mostrarProductos(resultado);
    }

    function limpiarBusqueda() {
        campoBuscar.value = "";
        selectCategoria.value = "todas";
        aplicarFiltros();
        campoBuscar.focus();
    }

    async function cargarCatalogo() {
        try {
            const respuesta = await fetch("data/catalogo.json");

            if (!respuesta.ok) {
                throw new Error("No se pudo leer data/catalogo.json");
            }

            catalogo = await respuesta.json();
            cargarCategorias();
            aplicarFiltros();
        } catch (error) {
            mostrarMensajeTabla("No se pudo cargar el catálogo.");

            if (contadorCatalogo) {
                contadorCatalogo.textContent = "ERROR DE CARGA";
            }

            console.error(error);
        }
    }

    campoBuscar.addEventListener("input", aplicarFiltros);
    selectCategoria.addEventListener("change", aplicarFiltros);
    botonLimpiar.addEventListener("click", limpiarBusqueda);

    cargarCatalogo();
});
