// Router por hash: #/, #/catalogo, #/producto/3, #/comprar?producto_id=3
const rutas = [];

export function registrar(patron, nombre, titulo, manejador) {
    rutas.push({ patron, nombre, titulo, manejador });
}

export function irA(hash) {
    window.location.hash = hash;
}

function resolver() {
    const crudo = window.location.hash.replace(/^#/, "") || "/";
    const [ruta, consulta = ""] = crudo.split("?");
    const parametros = new URLSearchParams(consulta);

    for (const candidata of rutas) {
        const coincidencia = ruta.match(candidata.patron);
        if (coincidencia) {
            return { ...candidata, args: coincidencia.slice(1), parametros };
        }
    }
    return null;
}

export function iniciarRouter(alCambiar, noEncontrada) {
    async function navegar() {
        const destino = resolver();
        if (!destino) {
            noEncontrada();
            return;
        }
        await alCambiar(destino);
    }

    window.addEventListener("hashchange", navegar);
    navegar();
}
