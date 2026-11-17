// Punto de entrada de la SPA de RUNAWAY.
import { vaciar } from "./js/dom.js";
import { registrar, iniciarRouter } from "./js/router.js";
import { anunciar } from "./js/anuncios.js";
import { vistaCatalogo } from "./js/vistas/catalogo.js";
import { vistaDetalle } from "./js/vistas/detalle.js";
import { vistaComprar } from "./js/vistas/comprar.js";

const contenedor = document.getElementById("contenido-principal");
const enlacesMenu = document.querySelectorAll("[data-ruta]");

function vistaInicio() {
    const plantilla = document.getElementById("tpl-inicio");
    return plantilla.content.cloneNode(true);
}

registrar(/^\/$/, "inicio", "Inicio", vistaInicio);
registrar(/^\/catalogo$/, "catalogo", "Colección", vistaCatalogo);
registrar(/^\/comprar$/, "comprar", "Comprar", vistaComprar);
registrar(/^\/producto\/(\d+)$/, "catalogo", "Detalle de producto", vistaDetalle);

function vistaNoEncontrada() {
    const p = document.createElement("p");
    p.className = "estado-carga-spa";
    p.textContent = "La página que buscás no existe.";
    return p;
}

function marcarMenuActivo(nombreRuta) {
    enlacesMenu.forEach(function (enlace) {
        if (enlace.dataset.ruta === nombreRuta) {
            enlace.setAttribute("aria-current", "page");
        } else {
            enlace.removeAttribute("aria-current");
        }
    });
}

function terminarNavegacion(titulo) {
    document.title = "RUNAWAY - " + titulo;
    anunciar("Navegaste a " + titulo);
    window.scrollTo(0, 0);
    // El foco pasa al contenido nuevo para que teclado y lectores no queden en el enlace anterior.
    contenedor.focus({ preventScroll: true });
}

async function mostrar(destino) {
    marcarMenuActivo(destino.nombre);
    vaciar(contenedor);
    contenedor.appendChild(await destino.manejador(...destino.args, destino.parametros));
    terminarNavegacion(destino.titulo);
}

iniciarRouter(mostrar, function () {
    marcarMenuActivo("");
    vaciar(contenedor);
    contenedor.appendChild(vistaNoEncontrada());
    terminarNavegacion("página no encontrada");
});
