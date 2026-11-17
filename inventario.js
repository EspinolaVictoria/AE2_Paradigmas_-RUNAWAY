const valor1 = document.getElementById("valor1");
const valor2 = document.getElementById("valor2");
const botonCalcular = document.getElementById("botonCalcular");
const resultado = document.getElementById("resultado");

if (valor1 && valor2 && botonCalcular && resultado) {
    botonCalcular.addEventListener("click", function () {
        const numero1 = Number(valor1.value);
        const numero2 = Number(valor2.value);
        const suma = numero1 + numero2;

        let estado = "cero";

        if (suma > 0) {
            estado = "positivo";
        } else if (suma < 0) {
            estado = "negativo";
        }

        resultado.textContent = suma + " (" + estado + ")";
        resultado.className = "resultado " + estado;
    });
}

const cuerpoInventario = document.getElementById("cuerpoInventario");
const filtroInventario = document.getElementById("filtroInventario");
const botonRecargarInventario = document.getElementById("recargarInventario");
const alertaInventario = document.getElementById("alertaInventario");
const totalUnidades = document.getElementById("totalUnidades");
const totalCriticos = document.getElementById("totalCriticos");
const totalDisponibles = document.getElementById("totalDisponibles");

let inventario = [];
let usuarioActual = null;
let puedeEditarStock = false;
let actualizandoStock = false;

async function cargarInventario() {
    if (!cuerpoInventario) {
        return;
    }

    mostrarEstadoCarga("Cargando inventario...");
    cuerpoInventario.setAttribute("aria-busy", "true");

    try {
        const respuesta = await fetch("api/productos.php");
        const resultadoApi = await respuesta.json();

        if (
            !respuesta.ok ||
            resultadoApi.estado !== "exito" ||
            !Array.isArray(resultadoApi.data)
        ) {
            throw new Error(
                resultadoApi.mensaje ||
                "No se pudo obtener la información de inventario."
            );
        }

        inventario = resultadoApi.data.map(function (producto) {
            return {
                ...producto,
                stock: Number(producto.stock),
                umbralCritico: Number(producto.umbralCritico)
            };
        });

        await cargarPermisosInventario();
        renderizarInventario();
    } catch (error) {
        inventario = [];
        mostrarEstadoCarga("No fue posible cargar el inventario.");
        actualizarAlerta(
            "error",
            "No se pudieron consultar los datos de stock."
        );
        console.error(error);
    } finally {
        cuerpoInventario.removeAttribute("aria-busy");
    }
}

async function cargarPermisosInventario() {
    usuarioActual = null;
    puedeEditarStock = false;

    try {
        const respuesta = await fetch("api/perfil.php", {
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            return;
        }

        const resultadoApi = await respuesta.json();

        if (
            resultadoApi.estado === "exito" &&
            resultadoApi.data
        ) {
            usuarioActual = resultadoApi.data;
            puedeEditarStock = usuarioActual.rol === "admin";
        }
    } catch (error) {
        console.error("No se pudo verificar la sesión:", error);
    }
}

function renderizarInventario() {
    if (!cuerpoInventario) {
        return;
    }

    const filtro = filtroInventario
        ? filtroInventario.value
        : "todos";

    const productosFiltrados = inventario.filter(function (producto) {
        const esCritico = producto.stock < producto.umbralCritico;

        if (filtro === "criticos") {
            return esCritico;
        }

        if (filtro === "disponibles") {
            return !esCritico;
        }

        return true;
    });

    cuerpoInventario.replaceChildren();

    if (productosFiltrados.length === 0) {
        mostrarEstadoCarga(
            "No hay productos para el filtro seleccionado."
        );
    } else {
        productosFiltrados.forEach(function (producto) {
            cuerpoInventario.appendChild(
                crearFilaInventario(producto)
            );
        });
    }

    actualizarIndicadores();
}

function crearFilaInventario(producto) {
    const fila = document.createElement("tr");
    const esCritico = producto.stock < producto.umbralCritico;

    if (esCritico) {
        fila.classList.add("fila-stock-critico");
    }

    const referencia = document.createElement("td");
    referencia.textContent = producto.ref || producto.id;

    const nombre = document.createElement("td");
    const nombreProducto = document.createElement("strong");
    const categoria = document.createElement("small");

    nombreProducto.textContent = producto.nombre;
    categoria.textContent = producto.categoria;

    nombre.append(nombreProducto, categoria);

    const stock = document.createElement("td");
    stock.textContent = producto.stock;

    const umbral = document.createElement("td");
    umbral.textContent = producto.umbralCritico;

    const estado = document.createElement("td");
    const etiquetaEstado = document.createElement("span");

    etiquetaEstado.className = esCritico
        ? "estado-stock estado-critico"
        : "estado-stock estado-normal";

    etiquetaEstado.textContent = esCritico
        ? "Crítico"
        : "Disponible";

    estado.appendChild(etiquetaEstado);

    const acciones = document.createElement("td");

    if (puedeEditarStock) {
        const grupoAcciones = document.createElement("div");
        grupoAcciones.className = "acciones-stock";

        const botonRestar = crearBotonStock(
            "−",
            "restar",
            producto.id,
            "Reducir una unidad de " + producto.nombre
        );

        const botonSumar = crearBotonStock(
            "+",
            "sumar",
            producto.id,
            "Agregar una unidad de " + producto.nombre
        );

        if (producto.stock <= 0) {
            botonRestar.disabled = true;
        }

        grupoAcciones.append(botonRestar, botonSumar);
        acciones.appendChild(grupoAcciones);
    } else {
        acciones.textContent = "Solo administrador";
    }

    fila.append(
        referencia,
        nombre,
        stock,
        umbral,
        estado,
        acciones
    );

    return fila;
}

function crearBotonStock(texto, accion, idProducto, etiqueta) {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "boton-stock";
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.producto = String(idProducto);
    boton.setAttribute("aria-label", etiqueta);

    return boton;
}

async function modificarStock(idProducto, accion, boton) {
    if (!puedeEditarStock || actualizandoStock) {
        return;
    }

    const producto = inventario.find(function (item) {
        return String(item.id) === String(idProducto);
    });

    if (!producto) {
        actualizarAlerta(
            "error",
            "No se encontró el producto seleccionado."
        );
        return;
    }

    let nuevoStock = producto.stock;

    if (accion === "sumar") {
        nuevoStock += 1;
    } else if (accion === "restar") {
        if (producto.stock <= 0) {
            return;
        }

        nuevoStock -= 1;
    } else {
        return;
    }

    const datosProducto = {
        ref: producto.ref,
        nombre: producto.nombre,
        subtitulo: producto.subtitulo || "",
        categoria: producto.categoria,
        especificacion: producto.especificacion,
        talles: producto.talles || "",
        precio: producto.precio,
        imagen: producto.imagen || "",
        stock: nuevoStock,
        umbralCritico: producto.umbralCritico
    };

    actualizandoStock = true;
    boton.disabled = true;

    actualizarAlerta(
        "normal",
        "Actualizando stock..."
    );

    try {
        const respuesta = await fetch(
            "api/productos.php?id=" + encodeURIComponent(producto.id),
            {
                method: "PUT",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datosProducto)
            }
        );

        const resultadoApi = await respuesta.json();

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                puedeEditarStock = false;
                throw new Error(
                    "La sesión finalizó. Iniciá sesión nuevamente."
                );
            }

            if (respuesta.status === 403) {
                puedeEditarStock = false;
                throw new Error(
                    "No tenés permisos para modificar el inventario."
                );
            }

            throw new Error(
                resultadoApi.mensaje ||
                "No se pudo actualizar el stock."
            );
        }

        await cargarInventario();
    } catch (error) {
        actualizarAlerta(
            "error",
            error.message || "No se pudo actualizar el stock."
        );

        console.error(error);
    } finally {
        actualizandoStock = false;

        if (boton.isConnected) {
            boton.disabled = false;
        }
    }
}

function actualizarIndicadores() {
    const unidades = inventario.reduce(function (acumulado, producto) {
        return acumulado + producto.stock;
    }, 0);

    const criticos = inventario.filter(function (producto) {
        return producto.stock < producto.umbralCritico;
    }).length;

    const disponibles = inventario.length - criticos;

    if (totalUnidades) {
        totalUnidades.textContent = unidades;
    }

    if (totalCriticos) {
        totalCriticos.textContent = criticos;
    }

    if (totalDisponibles) {
        totalDisponibles.textContent = disponibles;
    }

    if (criticos > 0) {
        actualizarAlerta(
            "critico",
            "Atención: " +
                criticos +
                " producto(s) se encuentran por debajo del umbral crítico."
        );
    } else {
        actualizarAlerta(
            "normal",
            "Inventario estable: no hay productos en estado crítico."
        );
    }
}

function actualizarAlerta(tipo, mensaje) {
    if (!alertaInventario) {
        return;
    }

    alertaInventario.className =
        "alerta-inventario alerta-" + tipo;

    alertaInventario.textContent = mensaje;
}

function mostrarEstadoCarga(mensaje) {
    if (!cuerpoInventario) {
        return;
    }

    cuerpoInventario.replaceChildren();

    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 6;
    celda.className = "estado-carga-inventario";
    celda.textContent = mensaje;

    fila.appendChild(celda);
    cuerpoInventario.appendChild(fila);
}

if (filtroInventario) {
    filtroInventario.addEventListener(
        "change",
        renderizarInventario
    );
}

if (botonRecargarInventario) {
    botonRecargarInventario.addEventListener(
        "click",
        cargarInventario
    );
}

if (cuerpoInventario) {
    cuerpoInventario.addEventListener(
        "click",
        async function (evento) {
            const boton = evento.target.closest(".boton-stock");

            if (!boton) {
                return;
            }

            await modificarStock(
                boton.dataset.producto,
                boton.dataset.accion,
                boton
            );
        }
    );

    cargarInventario();
}
