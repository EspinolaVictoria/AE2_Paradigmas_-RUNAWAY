<?php

declare(strict_types=1);

require_once __DIR__ . '/respuesta.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder_json(405, [
        'estado' => 'error',
        'mensaje' => 'Método no permitido.',
    ]);
}

$sesion = exigir_usuario();

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../models/UsuarioModel.php';

try {
    $modelo = new UsuarioModel(Conexion::obtener());
    $usuario = $modelo->buscarPorId($sesion['id']);

    if ($usuario === null) {
        responder_json(401, [
            'estado' => 'error',
            'mensaje' => 'La sesión no corresponde a un usuario válido.',
        ]);
    }

    responder_json(200, [
        'estado' => 'exito',
        'data' => [
            'id' => (int) $usuario['id'],
            'nombre' => (string) $usuario['nombre'],
            'email' => (string) $usuario['email'],
            'rol' => (string) $usuario['rol'],
        ],
    ]);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}
