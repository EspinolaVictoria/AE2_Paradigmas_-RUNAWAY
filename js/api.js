// Cliente de la API REST de productos, tarifas y compras (ver docs/API_REST.md).
// Todas las llamadas usan fetch() con async/await y devuelven el JSON ya validado.

async function pedir(url, opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(url, {
            ...opciones,
            headers: { Accept: "application/json", ...(opciones.headers || {}) }
        });
    } catch (error) {
        throw new Error("No se pudo conectar con el servidor.");
    }

    let cuerpo;
    try {
        cuerpo = await respuesta.json();
    } catch (error) {
        throw new Error("La respuesta del servidor no es válida.");
    }

    if (!respuesta.ok || cuerpo.estado !== "exito") {
        throw new Error(cuerpo.mensaje || "La operación no pudo completarse.");
    }
    return cuerpo;
}

export async function listarProductos({ q = "", categoria = "" } = {}) {
    const parametros = new URLSearchParams();
    if (q) {
        parametros.set("q", q);
    }
    if (categoria) {
        parametros.set("categoria", categoria);
    }
    const consulta = parametros.toString();
    const cuerpo = await pedir("api/productos.php" + (consulta ? "?" + consulta : ""));
    return cuerpo.data;
}

export async function obtenerProducto(id) {
    const cuerpo = await pedir("api/productos.php?id=" + encodeURIComponent(id));
    return cuerpo.data;
}

export function obtenerTarifas(productoId) {
    const consulta = productoId ? "?producto_id=" + encodeURIComponent(productoId) : "";
    return pedir("api/tarifas.php" + consulta);
}

export async function crearCompra(datos) {
    const cuerpo = await pedir("api/compras.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return cuerpo.data;
}
