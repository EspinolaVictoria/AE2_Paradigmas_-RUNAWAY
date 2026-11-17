import { el, formatearPrecio, vaciar } from "../dom.js";
import { obtenerProducto } from "../api.js";
import { anunciar } from "../anuncios.js";

function mensajeError(texto) {
    return el("div", { class: "estado-carga-spa" },
        el("p", { text: texto }),
        el("p", {}, el("a", { class: "link-line", href: "#/catalogo" }, "← Volver a la colección"))
    );
}

export async function vistaDetalle(id) {
    let producto;
    try {
        producto = await obtenerProducto(id);
    } catch (error) {
        anunciar(error.message);
        return mensajeError(error.message);
    }

    const raiz = document.getElementById("tpl-detalle").content.cloneNode(true);
    const imagen = raiz.getElementById("detalleImagen");
    imagen.src = producto.imagen;
    imagen.alt = producto.nombre + " - campaña RUNAWAY";

    raiz.getElementById("detalleRef").textContent = producto.ref;
    raiz.getElementById("detalleKicker").textContent = "CHAPTER 01 / " + producto.categoria.toUpperCase();
    raiz.getElementById("detalleNombre").textContent = producto.nombre;
    raiz.getElementById("detallePrecio").textContent = formatearPrecio(producto.precio);
    raiz.getElementById("detalleDescripcion").textContent = producto.especificacion;

    const specs = raiz.getElementById("detalleSpecs");
    [
        ["Línea", producto.subtitulo],
        ["Categoría", producto.categoria],
        ["Referencia", producto.ref],
        ["Origen", "RUNAWAY / 2026"]
    ].forEach(function ([etiqueta, valor]) {
        specs.appendChild(el("div", {}, el("span", { text: etiqueta }), el("strong", { text: valor })));
    });

    const talles = String(producto.talles).split(",").map((t) => t.trim()).filter(Boolean);
    const contenedorTalles = raiz.getElementById("detalleTalles");
    const botonComprar = raiz.getElementById("detalleComprar");
    let talleElegido = talles.includes("M") ? "M" : talles[0];

    function actualizarCompra() {
        botonComprar.setAttribute(
            "href",
            "#/comprar?producto_id=" + encodeURIComponent(producto.id) +
                "&talle=" + encodeURIComponent(talleElegido)
        );
    }

    function elegirTalle(talle) {
        talleElegido = talle;
        contenedorTalles.querySelectorAll("button").forEach(function (boton) {
            boton.setAttribute("aria-pressed", String(boton.dataset.talle === talle));
        });
        actualizarCompra();
    }

    talles.forEach(function (talle) {
        contenedorTalles.appendChild(el("button", {
            type: "button",
            "aria-pressed": String(talle === talleElegido),
            dataset: { talle },
            text: talle,
            onclick: function () {
                elegirTalle(talle);
                anunciar("Talle " + talle + " seleccionado.");
            }
        }));
    });
    actualizarCompra();

    const textoStock = raiz.getElementById("detalleStock");
    if (Number(producto.stock) < 1) {
        textoStock.textContent = "Sin stock disponible por el momento.";
        textoStock.classList.add("mensaje-error");
        botonComprar.setAttribute("aria-disabled", "true");
        botonComprar.removeAttribute("href");
    } else if (Number(producto.stock) < Number(producto.umbralCritico)) {
        textoStock.textContent = "Últimas unidades: quedan " + producto.stock + ".";
    }

    return raiz;
}
