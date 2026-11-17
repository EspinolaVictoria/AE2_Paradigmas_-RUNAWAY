import { el, formatearPrecio, vaciar } from "../dom.js";
import { listarProductos } from "../api.js";

function crearTarjeta(producto, indice) {
    return el("article", { class: "featured-card" + (indice === 0 ? " featured-main" : "") },
        el("div", { class: "featured-image" },
            el("img", { src: producto.imagen, alt: producto.nombre, loading: "lazy" })
        ),
        el("div", { class: "featured-data" },
            el("span", { text: String(indice + 1).padStart(2, "0") + " / " + producto.categoria.toUpperCase() }),
            el("h3", { text: producto.nombre }),
            el("p", { text: formatearPrecio(producto.precio) }),
            el("a", { href: "#/producto/" + producto.id }, "Ver detalle →")
        )
    );
}

export async function vistaInicio() {
    const raiz = document.getElementById("tpl-inicio").content.cloneNode(true);
    const grilla = raiz.querySelector(".featured-grid");

    // Las piezas destacadas salen de la API; si falla, la portada sigue siendo usable.
    try {
        const productos = await listarProductos();
        vaciar(grilla);
        productos.slice(0, 3).forEach(function (producto, indice) {
            grilla.appendChild(crearTarjeta(producto, indice));
        });
    } catch (error) {
        vaciar(grilla);
        grilla.appendChild(el("p", { class: "estado-carga-spa", text: "No se pudieron cargar las piezas destacadas." }));
    }

    return raiz;
}
