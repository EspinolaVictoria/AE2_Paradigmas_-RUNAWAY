// Anuncios para tecnologías de asistencia a través de la región aria-live="polite".
const region = document.getElementById("anuncios");

export function anunciar(mensaje) {
    if (!region) {
        return;
    }
    // Se vacía primero para que repetir el mismo mensaje vuelva a anunciarse.
    region.textContent = "";
    window.setTimeout(function () {
        region.textContent = mensaje;
    }, 50);
}
