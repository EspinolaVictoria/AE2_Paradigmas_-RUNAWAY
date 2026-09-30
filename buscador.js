/*
 * buscador.js - Buscador y filtro de catálogo en tiempo real
 * Dependencia: data/catalogo.json
 */

// Referencias del DOM
const campoBuscar      = document.getElementById("buscarProducto");
const selectCategoria  = document.getElementById("filtroCategoria");
const botonLimpiar     = document.getElementById("limpiarBusqueda");
const cuerpoCatalogo   = document.getElementById("cuerpoCatalogo");
const contadorCatalogo = document.getElementById("contadorCatalogo");

// Estado del catálogo (se carga una sola vez)
let catalogo = [];

// Fetch inicial de datos
async function cargarCatalogo() {
    mostrarMensaje("Cargando catálogo...");

    try {
        const respuesta = await fetch("data/catalogo.json");
        if (!respuesta.ok) throw new Error("Error HTTP: " + respuesta.status);

        catalogo = await respuesta.json();
        cargarCategorias();
        aplicarFiltros();
    } catch (error) {
        mostrarMensaje("No se pudo cargar el catálogo. ¿Está corriendo el servidor local?");
        contadorCatalogo.textContent = "ERROR DE CARGA";
        console.error(error);
    }
}

// Normaliza texto para búsqueda (quita tildes y pasa a minúsculas)
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Filtra el array en memoria según el texto y la categoría elegida
function aplicarFiltros() {
    const textoBuscado = normalizar(campoBuscar.value.trim());
    const categoriaElegida = selectCategoria.value;

    const resultado = catalogo.filter(producto => {
        const coincideCategoria = categoriaElegida === "todas" || producto.categoria === categoriaElegida;
        
        // Unimos los campos relevantes para buscar en todos lados a la vez
        const textoDelProducto = normalizar(
            `${producto.ref} ${producto.nombre} ${producto.subtitulo} ${producto.categoria} ${producto.especificacion}`
        );
        const coincideTexto = textoDelProducto.includes(textoBuscado);

        return coincideCategoria && coincideTexto;
    });

    mostrarProductos(resultado);
}

// Renderiza la tabla con los resultados
function mostrarProductos(lista) {
    if (lista.length === 0) {
        mostrarMensaje("No se encontraron piezas con esa búsqueda.");
    } else {
        cuerpoCatalogo.innerHTML = lista.map(crearFila).join("");
    }

    contadorCatalogo.textContent = `${lista.length} DE ${catalogo.length} ITEMS / DROP 01`;
}

// Template para cada fila de producto
function crearFila(producto) {
    return `
        <tr>
            <td>${producto.ref}</td>
            <td><img src="${producto.imagen}" alt="${producto.nombre}"></td>
            <td><strong>${producto.nombre}</strong><small>${producto.subtitulo}</small></td>
            <td>${producto.especificacion}</td>
            <td>${producto.talles}</td>
            <td>$${producto.precio.toLocaleString("es-AR")}</td>
            <td><a href="${producto.enlace}">Ver pieza →</a></td>
        </tr>`;
}

// Mensajes de estado en la tabla (cargando, error, sin resultados)
function mostrarMensaje(texto) {
    cuerpoCatalogo.innerHTML = `<tr><td colspan="7" class="mensajeCatalogo">${texto}</td></tr>`;
}

// Extrae categorías únicas de los datos y llena el select
function cargarCategorias() {
    const categorias = [...new Set(catalogo.map(p => p.categoria))];

    categorias.forEach(categoria => {
        const opcion = document.createElement("option");
        opcion.value = categoria;
        opcion.textContent = categoria;
        selectCategoria.appendChild(opcion);
    });
}

// Resetea los filtros y devuelve el foco al input
function limpiarBusqueda() {
    campoBuscar.value = "";
    selectCategoria.value = "todas";
    aplicarFiltros();
    campoBuscar.focus();
}

// Init de eventos (solo si estamos en la página correcta
if (cuerpoCatalogo && campoBuscar && selectCategoria) {
    campoBuscar.addEventListener("input", aplicarFiltros);
    selectCategoria.addEventListener("change", aplicarFiltros);
    botonLimpiar.addEventListener("click", limpiarBusqueda);

    cargarCatalogo();
}