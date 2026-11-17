// Punto de entrada de la SPA de RUNAWAY.
import { vaciar } from "./js/dom.js";
import { registrar, iniciarRouter } from "./js/router.js";

const contenedor = document.getElementById("contenido-principal");

function vistaInicio() {
    const plantilla = document.getElementById("tpl-inicio");
    return plantilla.content.cloneNode(true);
}

registrar(/^\/$/, "inicio", vistaInicio);

function vistaNoEncontrada() {
    const p = document.createElement("p");
    p.className = "estado-carga-spa";
    p.textContent = "La página que buscás no existe.";
    return p;
}

async function mostrar(destino) {
    vaciar(contenedor);
    contenedor.appendChild(await destino.manejador(...destino.args, destino.parametros));
    window.scrollTo(0, 0);
}

iniciarRouter(mostrar, function () {
    vaciar(contenedor);
    contenedor.appendChild(vistaNoEncontrada());
});
