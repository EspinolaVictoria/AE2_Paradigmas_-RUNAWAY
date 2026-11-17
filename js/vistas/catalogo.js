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
    raiz.querySelector(".tabla-productos").appendChild(cuerpo);

    cuerpo.appendChild(filaMensaje("Cargando catálogo..."));

    try {
        const productos = await listarProductos();
        vaciar(cuerpo);
        if (productos.length === 0) {
            cuerpo.appendChild(filaMensaje("No hay piezas disponibles."));
        }
        productos.forEach(function (producto) {
            cuerpo.appendChild(crearFila(producto));
        });
        contador.textContent = productos.length + " ITEMS / DROP 01";
    } catch (error) {
        vaciar(cuerpo);
        cuerpo.appendChild(filaMensaje(error.message));
        contador.textContent = "ERROR DE CARGA";
        anunciar("No se pudo cargar el catálogo.");
    }

    return raiz;
}
