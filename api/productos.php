<?php

declare(strict_types=1);

require_once __DIR__ . '/respuesta.php';
require_once __DIR__ . '/../models/ProductoModel.php';

function validar_producto(array $entrada): array
{
    $camposTexto = ['ref', 'nombre', 'categoria', 'especificacion'];
    foreach ($camposTexto as $campo) {
        if (!isset($entrada[$campo]) || !is_scalar($entrada[$campo])
            || trim((string) $entrada[$campo]) === '') {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} es obligatorio."]);
        }
    }

    $limites = ['ref' => 20, 'nombre' => 120, 'subtitulo' => 180, 'categoria' => 80, 'imagen' => 255];
    foreach ($limites as $campo => $limite) {
        $valor = $entrada[$campo] ?? '';
        if (!is_scalar($valor) || strlen((string) $valor) > $limite) {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} supera la longitud permitida."]);
        }
    }

    if (!isset($entrada['precio']) || !is_numeric($entrada['precio'])
        || (float) $entrada['precio'] < 0 || (float) $entrada['precio'] > 9999999999.99) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El precio debe estar entre 0 y 9.999.999.999,99.']);
    }

    foreach (['stock', 'umbralCritico'] as $campo) {
        if (isset($entrada[$campo]) && filter_var($entrada[$campo], FILTER_VALIDATE_INT) === false) {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} debe ser un entero."]);
        }
        if (isset($entrada[$campo]) && (int) $entrada[$campo] < 0) {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} no puede ser negativo."]);
        }
    }

    $talles = $entrada['talles'] ?? '';
    if (is_array($talles)) {
        foreach ($talles as $talle) {
            if (!is_scalar($talle)) {
                responder_json(400, ['estado' => 'error', 'mensaje' => 'Cada talle debe ser texto.']);
            }
        }
        $talles = implode(',', array_map('strval', $talles));
    } elseif (!is_scalar($talles)) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El campo talles debe ser texto o una lista.']);
    }
    if (strlen((string) $talles) > 120) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'La lista de talles supera la longitud permitida.']);
    }

    $imagen = trim((string) ($entrada['imagen'] ?? ''));
    if ($imagen !== '' && (preg_match('#^assets/[A-Za-z0-9._/-]+$#D', $imagen) !== 1
        || preg_match('#(^|/)\.\.(/|$)#', $imagen) === 1)) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'La imagen debe pertenecer a la carpeta assets/.']);
    }

    return [
        'ref' => trim((string) $entrada['ref']),
        'nombre' => trim((string) $entrada['nombre']),
        'subtitulo' => trim((string) ($entrada['subtitulo'] ?? '')),
        'categoria' => trim((string) $entrada['categoria']),
        'especificacion' => trim((string) $entrada['especificacion']),
        'talles' => trim((string) $talles),
        'precio' => number_format((float) $entrada['precio'], 2, '.', ''),
        'imagen' => $imagen,
        'stock' => (int) ($entrada['stock'] ?? 0),
        'umbralCritico' => (int) ($entrada['umbralCritico'] ?? 0),
    ];
}

function id_producto(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El parámetro id debe ser un entero positivo.']);
    }
    return $id;
}

try {
    $modelo = new ProductoModel();
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($metodo === 'GET') {
        if (isset($_GET['id'])) {
            $producto = $modelo->obtener(id_producto());
            if ($producto === null) {
                responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró el producto.']);
            }
            responder_json(200, ['estado' => 'exito', 'data' => $producto]);
        }

        $filtros = [
            'q' => trim((string) ($_GET['q'] ?? '')),
            'categoria' => trim((string) ($_GET['categoria'] ?? '')),
        ];
        responder_json(200, ['estado' => 'exito', 'data' => $modelo->listar($filtros)]);
    }

    if ($metodo === 'POST') {
        exigir_admin();
        $datos = validar_producto(leer_json());
        $id = $modelo->crear($datos);
        header('Location: productos.php?id=' . $id);
        responder_json(201, ['estado' => 'exito', 'mensaje' => 'Producto creado.', 'data' => ['id' => $id]]);
    }

    if ($metodo === 'PUT') {
        exigir_admin();
        $id = id_producto();
        $datos = validar_producto(leer_json());
        if (!$modelo->actualizar($id, $datos)) {
            responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró el producto.']);
        }
        responder_json(200, ['estado' => 'exito', 'mensaje' => 'Producto actualizado.']);
    }

    if ($metodo === 'DELETE') {
        exigir_admin();
        $id = id_producto();
        if (!$modelo->desactivar($id)) {
            responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró el producto.']);
        }
        responder_json(200, ['estado' => 'exito', 'mensaje' => 'Producto desactivado.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    responder_json(405, ['estado' => 'error', 'mensaje' => 'Método no permitido.']);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        responder_json(409, ['estado' => 'error', 'mensaje' => 'La referencia del producto ya existe o hay una relación inválida.']);
    }
    responder_error_servidor($exception);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}
