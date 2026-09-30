// Operación numérica: lectura de entradas y actualización del resultado en el DOM.
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

// Monitor de inventario.
// Los datos se cargan de forma asíncrona desde un archivo JSON local.
const cuerpoInventario = document.getElementById("cuerpoInventario");
const filtroInventario = document.getElementById("filtroInventario");
const botonRecargarInventario = document.getElementById("recargarInventario");
const alertaInventario = document.getElementById("alertaInventario");
const totalUnidades = document.getElementById("totalUnidades");
const totalCriticos = document.getElementById("totalCriticos");
const totalDisponibles = document.getElementById("totalDisponibles");

let inventario = [];

async function cargarInventario() {
    if (!cuerpoInventario) {
        return;
    }

    mostrarEstadoCarga("Cargando inventario...");

    try {
        const respuesta = await fetch("data/inventario.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo obtener la información de inventario.");
        }

        inventario = await respuesta.json();
        renderizarInventario();
    } catch (error) {
        cuerpoInventario.innerHTML = "";
        mostrarEstadoCarga(
            "No fue posible cargar el inventario. Abrí el proyecto mediante un servidor local."
        );
        actualizarAlerta("error", "No se pudieron consultar los datos de stock.");
        console.error(error);
    }
}

function renderizarInventario() {
    if (!cuerpoInventario) {
        return;
    }

    const filtro = filtroInventario ? filtroInventario.value : "todos";

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

    cuerpoInventario.innerHTML = "";

    if (productosFiltrados.length === 0) {
        mostrarEstadoCarga("No hay productos para el filtro seleccionado.");
    } else {
        productosFiltrados.forEach(function (producto) {
            cuerpoInventario.appendChild(crearFilaInventario(producto));
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
    referencia.textContent = producto.id;

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
    etiquetaEstado.textContent = esCritico ? "Crítico" : "Disponible";
    estado.appendChild(etiquetaEstado);

    const acciones = document.createElement("td");
    const grupoAcciones = document.createElement("div");
    grupoAcciones.className = "acciones-stock";

    const botonRestar = crearBotonStock("−", "restar", producto.id, "Reducir una unidad");
    const botonSumar = crearBotonStock("+", "sumar", producto.id, "Agregar una unidad");

    grupoAcciones.append(botonRestar, botonSumar);
    acciones.appendChild(grupoAcciones);

    fila.append(referencia, nombre, stock, umbral, estado, acciones);

    return fila;
}

function crearBotonStock(texto, accion, idProducto, etiqueta) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-stock";
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.producto = idProducto;
    boton.setAttribute("aria-label", etiqueta);
    return boton;
}

function modificarStock(idProducto, accion) {
    const producto = inventario.find(function (item) {
        return item.id === idProducto;
    });

    if (!producto) {
        return;
    }

    if (accion === "sumar") {
        producto.stock += 1;
    }

    if (accion === "restar" && producto.stock > 0) {
        producto.stock -= 1;
    }

    renderizarInventario();
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
            "Atención: " + criticos + " producto(s) se encuentran por debajo del umbral crítico."
        );
    } else {
        actualizarAlerta("normal", "Inventario estable: no hay productos en estado crítico.");
    }
}

function actualizarAlerta(tipo, mensaje) {
    if (!alertaInventario) {
        return;
    }

    alertaInventario.className = "alerta-inventario alerta-" + tipo;
    alertaInventario.textContent = mensaje;
}

function mostrarEstadoCarga(mensaje) {
    if (!cuerpoInventario) {
        return;
    }

    cuerpoInventario.innerHTML = "";

    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 6;
    celda.className = "estado-carga-inventario";
    celda.textContent = mensaje;

    fila.appendChild(celda);
    cuerpoInventario.appendChild(fila);
}

if (filtroInventario) {
    filtroInventario.addEventListener("change", renderizarInventario);
}

if (botonRecargarInventario) {
    botonRecargarInventario.addEventListener("click", cargarInventario);
}

if (cuerpoInventario) {
    cuerpoInventario.addEventListener("click", function (evento) {
        const boton = evento.target.closest(".boton-stock");

        if (!boton) {
            return;
        }

        modificarStock(boton.dataset.producto, boton.dataset.accion);
    });

    cargarInventario();
}
