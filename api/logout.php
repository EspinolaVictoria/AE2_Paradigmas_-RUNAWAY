<?php

declare(strict_types=1);

require_once __DIR__ . '/respuesta.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(405, [
        'estado' => 'error',
        'mensaje' => 'Método no permitido.',
    ]);
}

exigir_usuario();

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $parametros = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        [
            'expires' => time() - 42000,
            'path' => $parametros['path'] ?: '/',
            'domain' => $parametros['domain'],
            'secure' => (bool) $parametros['secure'],
            'httponly' => (bool) $parametros['httponly'],
            'samesite' => $parametros['samesite'] ?: 'Lax',
        ]
    );
}


session_destroy();

responder_json(200, [
    'estado' => 'exito',
    'mensaje' => 'Sesión cerrada correctamente.',
]);
