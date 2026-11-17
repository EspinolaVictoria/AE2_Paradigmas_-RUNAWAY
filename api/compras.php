<?php

declare(strict_types=1);

require_once __DIR__ . '/respuesta.php';
require_once __DIR__ . '/../models/CompraModel.php';

function id_compra(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El parámetro id debe ser un entero positivo.']);
    }
    return $id;
}

function validar_cliente_compra(array $entrada): array
{
    $cliente = is_array($entrada['cliente'] ?? null) ? $entrada['cliente'] : $entrada;
    $campos = ['nombre', 'direccion', 'telefono', 'email', 'medio_pago'];
    foreach ($campos as $campo) {
        if (!isset($cliente[$campo]) || !is_scalar($cliente[$campo])
            || trim((string) $cliente[$campo]) === '') {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} es obligatorio."]);
        }
    }

    $longitudes = ['nombre' => 100, 'direccion' => 200, 'telefono' => 40, 'email' => 150];
    foreach ($longitudes as $campo => $maximo) {
        if (strlen(trim((string) $cliente[$campo])) > $maximo) {
            responder_json(400, ['estado' => 'error', 'mensaje' => "El campo {$campo} supera la longitud permitida."]);
        }
    }

    $email = trim((string) $cliente['email']);
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El correo electrónico no es válido.']);
    }

    $mediosPermitidos = ['tarjeta_credito', 'tarjeta_debito', 'transferencia', 'mercado_pago'];
    $medioPago = (string) $cliente['medio_pago'];
    if (!in_array($medioPago, $mediosPermitidos, true)) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El medio de pago seleccionado no es válido.']);
    }

    return [
        'nombre' => trim((string) $cliente['nombre']),
        'direccion' => trim((string) $cliente['direccion']),
        'telefono' => trim((string) $cliente['telefono']),
        'email' => $email,
        'medio_pago' => $medioPago,
    ];
}

try {
    $modelo = new CompraModel();
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($metodo === 'GET') {
        $usuario = exigir_usuario();
        $esAdmin = $usuario['rol'] === 'admin';
        if (isset($_GET['id'])) {
            $compra = $modelo->obtener(id_compra(), $usuario['id'], $esAdmin);
            if ($compra === null) {
                responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró la compra.']);
            }
            responder_json(200, ['estado' => 'exito', 'data' => $compra]);
        }

        responder_json(200, [
            'estado' => 'exito',
            'data' => $modelo->listar($usuario['id'], $esAdmin),
        ]);
    }

    if ($metodo === 'POST') {
        $entrada = leer_json();
        $cliente = validar_cliente_compra($entrada);
        $items = $entrada['items'] ?? null;
        if (!is_array($items)) {
            responder_json(400, ['estado' => 'error', 'mensaje' => 'El campo items debe ser una lista.']);
        }
        foreach ($items as $item) {
            if (!is_array($item)) {
                responder_json(400, ['estado' => 'error', 'mensaje' => 'Cada elemento de items debe ser un objeto.']);
            }
        }
        if (isset($entrada['codigo_cupon']) && !is_scalar($entrada['codigo_cupon'])) {
            responder_json(400, ['estado' => 'error', 'mensaje' => 'El código de cupón debe ser texto.']);
        }

        $usuario = usuario_actual();
        $codigoCupon = isset($entrada['codigo_cupon'])
            ? (string) $entrada['codigo_cupon']
            : null;
        $id = $modelo->crear($cliente, $items, $codigoCupon, $usuario['id'] ?? null);
        header('Location: compras.php?id=' . $id);
        responder_json(201, [
            'estado' => 'exito',
            'mensaje' => 'Compra registrada.',
            'data' => ['id' => $id],
        ]);
    }

    if ($metodo === 'PUT') {
        exigir_admin();
        $id = id_compra();
        $entrada = leer_json();
        $estado = trim((string) ($entrada['estado'] ?? ''));
        if (!$modelo->actualizarEstado($id, $estado)) {
            responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró la compra.']);
        }
        responder_json(200, ['estado' => 'exito', 'mensaje' => 'Estado de compra actualizado.']);
    }

    if ($metodo === 'DELETE') {
        $usuario = exigir_usuario();
        if (!$modelo->eliminar(id_compra(), $usuario['id'], $usuario['rol'] === 'admin')) {
            responder_json(404, ['estado' => 'error', 'mensaje' => 'No se encontró la compra.']);
        }
        responder_json(200, ['estado' => 'exito', 'mensaje' => 'Compra pendiente eliminada y stock restituido.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    responder_json(405, ['estado' => 'error', 'mensaje' => 'Método no permitido.']);
} catch (ReglaCompraException $exception) {
    responder_json($exception->codigoHttp(), ['estado' => 'error', 'mensaje' => $exception->getMessage()]);
} catch (PDOException $exception) {
    responder_error_servidor($exception);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}
