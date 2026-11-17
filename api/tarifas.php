<?php

declare(strict_types=1);

require_once __DIR__ . '/respuesta.php';
require_once __DIR__ . '/../models/TarifaModel.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    responder_json(405, ['estado' => 'error', 'mensaje' => 'Método no permitido.']);
}

try {
    $modelo = new TarifaModel();
    $productos = $modelo->listarProductos();

    $producto = null;
    if (isset($_GET['producto_id'])) {
        $id = filter_var($_GET['producto_id'], FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            responder_json(400, ['estado' => 'error', 'mensaje' => 'producto_id debe ser un entero positivo.']);
        }
        $producto = $modelo->obtenerProducto($id);
    } elseif (isset($_GET['ref'])) {
        $producto = $modelo->obtenerProductoPorReferencia(trim((string) $_GET['ref']));
    } else {
        $producto = $modelo->obtenerProductoPorReferencia('001');
    }

    if ($producto === null) {
        responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró el producto solicitado.']);
    }

    $talles = array_values(array_filter(array_map('trim', explode(',', (string) $producto['talles']))));
    $tallePredeterminado = in_array('M', $talles, true) ? 'M' : ($talles[0] ?? '');

    responder_json(200, [
        'estado' => 'exito',
        'producto' => [
            'id' => (int) $producto['id'],
            'ref' => $producto['ref'],
            'nombre' => $producto['nombre'],
            'categoria' => $producto['categoria'],
            'imagen' => $producto['imagen'],
            'talles' => $talles,
            'stock' => (int) $producto['stock'],
            'talle' => $tallePredeterminado,
            'precioUnitario' => (float) $producto['precio'],
        ],
        'productos' => $productos,
        'descuentos' => $modelo->listarDescuentos(),
    ]);
} catch (PDOException $exception) {
    responder_error_servidor($exception);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}
