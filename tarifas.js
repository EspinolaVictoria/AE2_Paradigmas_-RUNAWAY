// Calculador de presupuesto del checkout. Los precios y promociones vienen del JSON.
const formularioTarifas = document.querySelector(".formulario-compra");

if (formularioTarifas) {
    const cantidad = document.getElementById("cantidadProducto");
    const campoCupon = document.getElementById("codigoCupon");
    const botonCupon = document.getElementById("botonCupon");
    const mensajeCupon = document.getElementById("mensajeCupon");
    const subtotalElemento = document.getElementById("subtotalProducto");
    const totalElemento = document.getElementById("totalProducto");
    const listaProductos = document.getElementById("productos");

    let tablaTarifas = null;
    let descuentoActivo = 0;

    const formatearPrecio = (importe) =>
        "$" + importe.toLocaleString("es-AR");

    function actualizarPresupuesto() {
        if (!tablaTarifas || !cantidad || !subtotalElemento || !totalElemento) {
            return;
        }

        const producto = tablaTarifas.productos["nocturne-hoodie"];
        const unidades = Math.max(1, Number.parseInt(cantidad.value, 10) || 1);
        cantidad.value = unidades;

        const subtotal = producto.precioUnitario * unidades;
        const total = Math.round(subtotal * (1 - descuentoActivo / 100));
        const subtotalFormateado = formatearPrecio(subtotal);

        subtotalElemento.textContent = subtotalFormateado;
        totalElemento.textContent = formatearPrecio(total);

        if (listaProductos) {
            listaProductos.value =
                unidades + " x " + producto.nombre + " / Talle " + producto.talle +
                " / " + subtotalFormateado;
        }
    }

    async function cargarTarifas() {
        try {
            const respuesta = await fetch("data/tarifas.json");

            if (!respuesta.ok) {
                throw new Error("No se pudo cargar la tabla de precios.");
            }

            tablaTarifas = await respuesta.json();
            actualizarPresupuesto();
        } catch (error) {
            if (mensajeCupon) {
                mensajeCupon.textContent =
                    "No se pudieron cargar los precios. Abrí el proyecto mediante un servidor local.";
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
        const promocion = tablaTarifas.descuentos[codigo];
        mensajeCupon.classList.remove("mensaje-error", "mensaje-exito");

        if (!codigo) {
            descuentoActivo = 0;
            mensajeCupon.textContent = "Por favor, ingresá un código";
            mensajeCupon.classList.add("mensaje-error");
        } else if (promocion) {
            descuentoActivo = promocion.porcentaje;
            mensajeCupon.textContent = "¡Cupón aplicado! Tenés " + promocion.descripcion;
            mensajeCupon.classList.add("mensaje-exito");
        } else {
            descuentoActivo = 0;
            mensajeCupon.textContent = "Código inválido o vencido";
            mensajeCupon.classList.add("mensaje-error");
        }

        actualizarPresupuesto();
    }

    if (cantidad) {
        cantidad.addEventListener("change", actualizarPresupuesto);
    }

    if (botonCupon) {
        botonCupon.addEventListener("click", aplicarCupon);
    }

    cargarTarifas();
}
