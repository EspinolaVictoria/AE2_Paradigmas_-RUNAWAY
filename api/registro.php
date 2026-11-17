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

$nombre = trim((string) ($datos['nombre'] ?? ''));
$email = trim((string) ($datos['email'] ?? ''));
$password = (string) ($datos['password'] ?? '');

if ($nombre === '' || $email === '' || $password === '') {
    responder_json(400, [
        'estado' => 'error',
        'mensaje' => 'Todos los campos son obligatorios.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder_json(400, [
        'estado' => 'error',
        'mensaje' => 'Correo con formato inválido.',
    ]);
}

if (strlen($password) < 6) {
    responder_json(400, [
        'estado' => 'error',
        'mensaje' => 'La contraseña debe tener al menos 6 caracteres.',
    ]);
}

$passwordHash = password_hash(
    $password,
    PASSWORD_BCRYPT
);

try {
    $modelo = new UsuarioModel(Conexion::obtener());

    $usuarioId = $modelo->crear(
        $nombre,
        $email,
        $passwordHash
    );

    responder_json(201, [
        'estado' => 'exito',
        'mensaje' => 'Usuario registrado correctamente.',
        'usuario' => [
            'id' => $usuarioId,
            'nombre' => $nombre,
            'email' => $email,
            'rol' => 'cliente',
        ],
    ]);
} catch (PDOException $exception) {
    if ((string) $exception->getCode() === '23000') {
        responder_json(409, [
            'estado' => 'error',
            'mensaje' => 'El correo electrónico ya existe.',
        ]);
    }

    responder_error_servidor($exception);
} catch (Throwable $exception) {
    responder_error_servidor($exception);
}