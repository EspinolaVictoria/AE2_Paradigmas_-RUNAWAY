<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/respuesta.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(405, [
        'estado' => 'error',
        'mensaje' => 'Método no permitido.',
    ]);
}

$datos = leer_json();

$email = trim((string) ($datos['email'] ?? ''));
$password = (string) ($datos['password'] ?? '');

if ($email === '' || $password === '') {
    responder_json(400, [
        'estado' => 'error',
        'mensaje' => 'Ingrese correo y contraseña.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder_json(400, [
        'estado' => 'error',
        'mensaje' => 'Correo con formato inválido.',
    ]);
}

try {
    $modelo = new UsuarioModel(Conexion::obtener());
    $usuario = $modelo->buscarPorEmail($email);

    if (
        $usuario === null ||
        !password_verify($password, $usuario['password'])
    ) {
        responder_json(401, [
            'estado' => 'error',
            'mensaje' => 'Credenciales incorrectas.',
        ]);
    }

    iniciar_sesion_segura();
    session_regenerate_id(true);

    $_SESSION['usuario_id'] = (int) $usuario['id'];
    $_SESSION['usuario_nombre'] = (string) $usuario['nombre'];
    $_SESSION['usuario_email'] = (string) $usuario['email'];
    $_SESSION['usuario_rol'] = (string) $usuario['rol'];

    responder_json(200, [
        'estado' => 'exito',
        'mensaje' => 'Autenticación exitosa.',
        'usuario' => [
            'id' => (int) $usuario['id'],
            'nombre' => (string) $usuario['nombre'],
            'email' => (string) $usuario['email'],
            'rol' => (string) $usuario['rol'],
        ],
    ]);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}