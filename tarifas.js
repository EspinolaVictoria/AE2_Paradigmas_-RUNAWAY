document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.querySelector(".formulario-compra");
    const cantidad = document.getElementById("cantidadProducto");
    const subtotalElemento = document.getElementById("subtotalProducto");
    const totalElemento = document.getElementById("totalProducto");
    const listaProductos = document.getElementById("productos");
    const nombreProducto = document.getElementById("nombreProducto");
    const referenciaProducto = document.getElementById("referenciaProducto");
    const tallaProducto = document.getElementById("talleProducto");
    const precioUnitario = document.getElementById("precioUnitario");
    const imagenProducto = document.getElementById("imagenProducto");
    const campoCupon = document.getElementById("codigoCupon");
    const botonCupon = document.getElementById("botonCupon");
    const mensajeCupon = document.getElementById("mensajeCupon");

    if (!formulario || !cantidad || !subtotalElemento || !totalElemento) {
        return;
    }

    let tablaTarifas = null;
    let descuentoActivo = 0;
    let codigoCuponValido = null;

    function formatearPrecio(valor) {
        return "$" + Number(valor).toLocaleString("es-AR");
    }

    function mostrarMensaje(mensaje, tipo) {
        if (!mensajeCupon) {
            return;
        }
        mensajeCupon.textContent = mensaje;
        mensajeCupon.classList.remove("mensaje-error", "mensaje-exito");
        if (tipo) {
            mensajeCupon.classList.add(tipo);
        }
    }

    function actualizarPresupuesto() {
        if (!tablaTarifas) {
            return;
        }

        const producto = tablaTarifas.producto;
        let unidades = Number(cantidad.value);
        if (!Number.isInteger(unidades) || unidades < 1) {
            unidades = 1;
            cantidad.value = "1";
        }

        const subtotal = producto.precioUnitario * unidades;
        const total = Math.round(subtotal * (1 - descuentoActivo / 100));
        const subtotalFormateado = formatearPrecio(subtotal);
        subtotalElemento.textContent = subtotalFormateado;
        totalElemento.textContent = formatearPrecio(total);

        if (listaProductos) {
            listaProductos.value = unidades + " x " + producto.nombre +
                " / Talle " + producto.talle + " / " + subtotalFormateado;
        }
    }

    function mostrarProducto(producto) {
        if (nombreProducto) {
            nombreProducto.textContent = producto.nombre;
        }
        if (referenciaProducto) {
            referenciaProducto.textContent = producto.ref + " / " + producto.categoria.toUpperCase();
        }
        if (tallaProducto) {
            tallaProducto.textContent = producto.talle;
        }
        if (precioUnitario) {
            precioUnitario.textContent = formatearPrecio(producto.precioUnitario);
        }
        if (imagenProducto) {
            imagenProducto.src = producto.imagen;
            imagenProducto.alt = producto.nombre;
        }
        cantidad.max = String(producto.stock);
        const botonEnviar = formulario.querySelector("button[type='submit']");
        if (botonEnviar) {
            botonEnviar.disabled = Number(producto.stock) < 1;
        }
        if (Number(producto.stock) < 1) {
            mostrarMensaje("Este producto no tiene stock disponible.", "mensaje-error");
        }
    }

    async function cargarTarifas() {
        try {
            const parametros = new URLSearchParams(window.location.search);
            const productoId = parametros.get("producto_id");
            const consulta = productoId
                ? "?producto_id=" + encodeURIComponent(productoId)
                : "?ref=001";
            const respuesta = await fetch("api/tarifas.php" + consulta, {
                headers: { Accept: "application/json" }
            });
            const resultado = await respuesta.json();

            if (!respuesta.ok || resultado.estado !== "exito") {
                throw new Error(resultado.mensaje || "No se pudo cargar la tabla de tarifas.");
            }

            tablaTarifas = resultado;
            mostrarProducto(tablaTarifas.producto);
            actualizarPresupuesto();
        } catch (error) {
            mostrarMensaje(error.message || "No se pudieron cargar los precios.", "mensaje-error");
            console.error(error);
        }
    }

    function aplicarCupon() {
        if (!tablaTarifas || !campoCupon) {
            return;
        }

        const codigo = campoCupon.value.trim().toUpperCase();
        const promocion = tablaTarifas.descuentos[codigo];
        if (codigo === "" || !promocion) {
            descuentoActivo = 0;
            codigoCuponValido = null;
            mostrarMensaje(codigo === "" ? "Ingresá un código de descuento." : "Código inválido o vencido.", "mensaje-error");
        } else {
            descuentoActivo = Number(promocion.porcentaje);
            codigoCuponValido = codigo;
            mostrarMensaje("¡Cupón aplicado! Tenés un " + descuentoActivo + "% de descuento.", "mensaje-exito");
        }

        actualizarPresupuesto();
    }

    function datosCompra() {
        const valoresPago = {
            credito: "tarjeta_credito",
            debito: "tarjeta_debito",
            transferencia: "transferencia",
            mercadopago: "mercado_pago"
        };
        const producto = tablaTarifas.producto;

        return {
            cliente: {
                nombre: document.getElementById("nombre").value.trim(),
                direccion: document.getElementById("direccion").value.trim(),
                telefono: document.getElementById("telefono").value.trim(),
                email: document.getElementById("email").value.trim(),
                medio_pago: valoresPago[document.getElementById("pago").value] || ""
            },
            items: [{
                producto_id: producto.id,
                talle: producto.talle,
                cantidad: Number(cantidad.value)
            }],
            codigo_cupon: codigoCuponValido
        };
    }

    async function confirmarCompra(evento) {
        evento.preventDefault();
        if (!tablaTarifas) {
            mostrarMensaje("Esperá a que se carguen los precios antes de confirmar.", "mensaje-error");
            return;
        }

        const botonEnviar = formulario.querySelector("button[type='submit']");
        if (botonEnviar) {
            botonEnviar.disabled = true;
        }
        mostrarMensaje("Registrando la compra…", null);

        try {
            const respuesta = await fetch("api/compras.php", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(datosCompra())
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || resultado.estado !== "exito") {
                throw new Error(resultado.mensaje || "No se pudo registrar la compra.");
            }

            tablaTarifas.producto.stock = Math.max(
                0,
                Number(tablaTarifas.producto.stock) - Number(cantidad.value)
            );
            mostrarProducto(tablaTarifas.producto);
            formulario.reset();
            cantidad.value = "1";
            descuentoActivo = 0;
            codigoCuponValido = null;
            actualizarPresupuesto();
            mostrarMensaje(
                "Compra N.º " + resultado.data.id + " registrada. El sitio guarda el medio de pago, pero no procesa cobros.",
                "mensaje-exito"
            );
        } catch (error) {
            mostrarMensaje(error.message || "No se pudo conectar con la API de compras.", "mensaje-error");
            console.error(error);
        } finally {
            if (botonEnviar) {
                botonEnviar.disabled = Boolean(tablaTarifas && Number(tablaTarifas.producto.stock) < 1);
            }
        }
    }

    cantidad.addEventListener("input", actualizarPresupuesto);
    if (botonCupon) {
        botonCupon.addEventListener("click", aplicarCupon);
    }
    formulario.addEventListener("submit", confirmarCompra);
    cargarTarifas();
});
