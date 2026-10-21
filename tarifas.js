document.addEventListener("DOMContentLoaded", function () {
    const cantidad = document.getElementById("cantidadProducto");
    const subtotalElemento = document.getElementById("subtotalProducto");
    const totalElemento = document.getElementById("totalProducto");
    const listaProductos = document.getElementById("productos");
    const campoCupon = document.getElementById("codigoCupon");
    const botonCupon = document.getElementById("botonCupon");
    const mensajeCupon = document.getElementById("mensajeCupon");

    if (!cantidad || !subtotalElemento || !totalElemento) {
        return;
    }

    let tablaTarifas = null;
    let descuentoActivo = 0;

    function formatearPrecio(valor) {
        return "$" + valor.toLocaleString("es-AR");
    }

    function actualizarPresupuesto() {
        if (!tablaTarifas) {
            return;
        }

        const producto = tablaTarifas.producto;
        let unidades = Number(cantidad.value);

        if (!Number.isInteger(unidades) || unidades < 1) {
            unidades = 1;
            cantidad.value = 1;
        }

        const subtotal = producto.precioUnitario * unidades;
        const total = Math.round(subtotal * (1 - descuentoActivo / 100));
        const subtotalFormateado = formatearPrecio(subtotal);

        subtotalElemento.textContent = subtotalFormateado;
        totalElemento.textContent = formatearPrecio(total);

        if (listaProductos) {
            listaProductos.value =
                unidades + " x " + producto.nombre +
                " / Talle " + producto.talle +
                " / " + subtotalFormateado;
        }
    }

    async function cargarTarifas() {
        try {
            const respuesta = await fetch("data/tarifas.json");

            if (!respuesta.ok) {
                throw new Error("No se pudo cargar la tabla de tarifas.");
            }

            tablaTarifas = await respuesta.json();
            actualizarPresupuesto();
        } catch (error) {
            if (mensajeCupon) {
                mensajeCupon.textContent = "No se pudieron cargar los precios.";
                mensajeCupon.classList.remove("mensaje-exito");
                mensajeCupon.classList.add("mensaje-error");
            }
            console.error(error);
        }
    }

    function aplicarCupon() {
        if (!tablaTarifas || !campoCupon || !mensajeCupon) {
            return;
        }

        const codigo = campoCupon.value.trim().toUpperCase();
        mensajeCupon.classList.remove("mensaje-error", "mensaje-exito");

        if (codigo === "") {
            descuentoActivo = 0;
            mensajeCupon.textContent = "Por favor, ingrese un código";
            mensajeCupon.classList.add("mensaje-error");
        } else {
            const promocion = tablaTarifas.descuentos[codigo];

            if (promocion) {
                descuentoActivo = promocion.porcentaje;
                mensajeCupon.textContent =
                    "¡Cupón aplicado! Tenés un " + descuentoActivo + "% de descuento";
                mensajeCupon.classList.add("mensaje-exito");
            } else {
                descuentoActivo = 0;
                mensajeCupon.textContent = "Código inválido o vencido";
                mensajeCupon.classList.add("mensaje-error");
            }
        }

        actualizarPresupuesto();
    }

    cantidad.addEventListener("change", actualizarPresupuesto);

    if (botonCupon) {
        botonCupon.addEventListener("click", aplicarCupon);
    }

    cargarTarifas();
});
