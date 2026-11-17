// Punto de entrada de la SPA de RUNAWAY.
import { vaciar } from "./js/dom.js";

const contenedor = document.getElementById("contenido-principal");

function iniciar() {
    vaciar(contenedor);
    const plantilla = document.getElementById("tpl-inicio");
    contenedor.appendChild(plantilla.content.cloneNode(true));
}

iniciar();
