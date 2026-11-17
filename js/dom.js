// Utilidades de DOM. Todo el contenido dinámico se arma con createElement y
// textContent: nunca se usa innerHTML, así los datos de la API no pueden inyectar HTML.

export function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);

    for (const [clave, valor] of Object.entries(atributos)) {
        if (valor === null || valor === undefined || valor === false) {
            continue;
        }
        if (clave === "class") {
            nodo.className = valor;
        } else if (clave === "text") {
            nodo.textContent = valor;
        } else if (clave === "dataset") {
            Object.assign(nodo.dataset, valor);
        } else if (clave.startsWith("on") && typeof valor === "function") {
            nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
        } else {
            nodo.setAttribute(clave, valor === true ? "" : valor);
        }
    }

    nodo.append(...hijos.flat().filter((h) => h !== null && h !== undefined && h !== false));
    return nodo;
}

export function formatearPrecio(valor) {
    return "$" + Number(valor).toLocaleString("es-AR");
}

export function normalizar(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

export function vaciar(nodo) {
    nodo.replaceChildren();
}
