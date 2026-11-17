import { el, formatearPrecio } from "../dom.js";
import { obtenerTarifas } from "../api.js";
import { anunciar } from "../anuncios.js";

export async function vistaComprar(parametros) {
    let tarifas;
    try {
        tarifas = await obtenerTarifas(parametros.get("producto_id"));
    } catch (error) {
        anunciar(error.message);
        return el("div", { class: "estado-carga-spa" },
            el("p", { text: error.message }),
            el("p", {}, el("a", { class: "link-line", href: "#/catalogo" }, "← Volver a la colección"))
        );
    }

    const producto = tarifas.producto;
    const raiz = document.getElementById("tpl-comprar").content.cloneNode(true);
    const cantidad = raiz.getElementById("cantidadProducto");
    const selectTalle = raiz.getElementById("talleCompra");
    const mensaje = raiz.getElementById("mensajeCompra");
    const botonEnviar = raiz.querySelector("button[type='submit']");
    // Las referencias se toman ahora: al insertar el fragmento en la página queda vacío.
    const campoCupon = raiz.getElementById("codigoCupon");
    const botonCupon = raiz.getElementById("botonCupon");
    const textoTalle = raiz.getElementById("talleProducto");
    const textoSubtotal = raiz.getElementById("subtotalProducto");
    const textoDescuento = raiz.getElementById("descuentoProducto");
    const textoTotal = raiz.getElementById("totalProducto");

    const estado = { descuento: 0, cupon: null };

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.classList.remove("mensaje-error", "mensaje-exito");
        if (tipo) {
            mensaje.classList.add(tipo);
        }
    }

    function unidades() {
        const n = Number(cantidad.value);
        return Number.isInteger(n) && n >= 1 ? n : 1;
    }

    function actualizarResumen() {
        const subtotal = producto.precioUnitario * unidades();
        const total = Math.round(subtotal * (1 - estado.descuento / 100));
        textoTalle.textContent = selectTalle.value;
        textoSubtotal.textContent = formatearPrecio(subtotal);
        textoDescuento.textContent =
            estado.descuento > 0 ? "−" + estado.descuento + "%" : "—";
        textoTotal.textContent = formatearPrecio(total);
    }

    // Datos fijos del producto elegido.
    const imagen = raiz.getElementById("imagenProducto");
    imagen.src = producto.imagen;
    imagen.alt = producto.nombre;
    raiz.getElementById("referenciaProducto").textContent =
        producto.ref + " / " + producto.categoria.toUpperCase();
    raiz.getElementById("nombreProducto").textContent = producto.nombre;
    raiz.getElementById("precioUnitario").textContent = formatearPrecio(producto.precioUnitario);

    producto.talles.forEach(function (talle) {
        selectTalle.appendChild(el("option", { value: talle, text: talle }));
    });
    const talleInicial = parametros.get("talle");
    selectTalle.value = producto.talles.includes(talleInicial) ? talleInicial : producto.talle;

    cantidad.max = String(producto.stock);
    if (Number(producto.stock) < 1) {
        botonEnviar.disabled = true;
        mostrarMensaje("Este producto no tiene stock disponible.", "mensaje-error");
    }

    function aplicarCupon() {
        const codigo = campoCupon.value.trim().toUpperCase();
        const promocion = tarifas.descuentos[codigo];

        if (codigo === "" || !promocion) {
            estado.descuento = 0;
            estado.cupon = null;
            mostrarMensaje(codigo === "" ? "Ingresá un código de descuento." : "Código inválido o vencido.", "mensaje-error");
        } else {
            estado.descuento = Number(promocion.porcentaje);
            estado.cupon = codigo;
            mostrarMensaje("¡Cupón aplicado! Tenés un " + estado.descuento + "% de descuento.", "mensaje-exito");
        }
        actualizarResumen();
    }

    botonCupon.addEventListener("click", aplicarCupon);
    cantidad.addEventListener("input", actualizarResumen);
    selectTalle.addEventListener("change", actualizarResumen);
    actualizarResumen();

    return raiz;
}
