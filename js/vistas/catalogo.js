import { el, formatearPrecio, vaciar } from "../dom.js";
import { listarProductos } from "../api.js";
import { anunciar } from "../anuncios.js";

function celda(contenido) {
    return el("td", {}, contenido);
}

function crearFila(producto) {
    return el("tr", {},
        celda(producto.ref),
        celda(el("img", { src: producto.imagen, alt: producto.nombre, loading: "lazy" })),
        celda([el("strong", { text: producto.nombre }), el("small", { text: producto.subtitulo })]),
        celda(producto.especificacion),
        celda(String(producto.talles).split(",").join(" · ")),
        celda(formatearPrecio(producto.precio)),
        celda(el("a", { href: "#/producto/" + producto.id }, "Ver pieza →"))
    );
}

function filaMensaje(texto) {
    return el("tr", {}, el("td", { colspan: 7, class: "catalogo-sin-resultados", text: texto }));
}

export async function vistaCatalogo() {
    const raiz = document.getElementById("tpl-catalogo").content.cloneNode(true);
    const cuerpo = document.createElement("tbody");
    const contador = raiz.getElementById("contadorCatalogo");
    const campoBuscar = raiz.getElementById("campoBuscar");
    const selectCategoria = raiz.getElementById("selectCategoria");
    const botonLimpiar = raiz.getElementById("botonLimpiar");
    raiz.querySelector(".tabla-productos").appendChild(cuerpo);

    let totalCatalogo = 0;
    let temporizador = null;
    let ultimaConsulta = 0;

    function cargarCategorias(productos) {
        const categorias = [...new Set(productos.map((p) => p.categoria))];
        categorias.forEach(function (categoria) {
            selectCategoria.appendChild(el("option", { value: categoria, text: categoria }));
        });
    }

    function mostrar(productos) {
        vaciar(cuerpo);
        if (productos.length === 0) {
            cuerpo.appendChild(filaMensaje("No se encontraron piezas con esa búsqueda."));
        }
        productos.forEach(function (producto) {
            cuerpo.appendChild(crearFila(producto));
        });
        contador.textContent = productos.length + " DE " + totalCatalogo + " ITEMS / DROP 01";
        anunciar(productos.length + " de " + totalCatalogo + " piezas encontradas.");
    }

    // Consulta la API con los filtros actuales. Se descartan respuestas viejas si el
    // usuario siguió escribiendo mientras la petición estaba en curso.
    async function buscar() {
        const numero = ++ultimaConsulta;
        try {
            const productos = await listarProductos({
                q: campoBuscar.value.trim(),
                categoria: selectCategoria.value
            });
            if (numero === ultimaConsulta) {
                mostrar(productos);
            }
        } catch (error) {
            if (numero === ultimaConsulta) {
                vaciar(cuerpo);
                cuerpo.appendChild(filaMensaje(error.message));
                contador.textContent = "ERROR DE CARGA";
                anunciar("No se pudo cargar el catálogo.");
            }
        }
    }

    campoBuscar.addEventListener("input", function () {
        window.clearTimeout(temporizador);
        temporizador = window.setTimeout(buscar, 250);
    });
    selectCategoria.addEventListener("change", buscar);
    botonLimpiar.addEventListener("click", function () {
        campoBuscar.value = "";
        selectCategoria.value = "";
        buscar();
        campoBuscar.focus();
    });
    // Enter en el buscador no debe recargar la página.
    raiz.querySelector(".catalog-controls").addEventListener("submit", function (evento) {
        evento.preventDefault();
    });

    cuerpo.appendChild(filaMensaje("Cargando catálogo..."));
    try {
        const todos = await listarProductos();
        totalCatalogo = todos.length;
        cargarCategorias(todos);
        mostrar(todos);
    } catch (error) {
        vaciar(cuerpo);
        cuerpo.appendChild(filaMensaje(error.message));
        contador.textContent = "ERROR DE CARGA";
        anunciar("No se pudo cargar el catálogo.");
    }

    return raiz;
}
