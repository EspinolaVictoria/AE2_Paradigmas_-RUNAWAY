<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function responder_json(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function leer_json(): array
{
    $contenido = file_get_contents('php://input');
    if ($contenido === false || trim($contenido) === '') {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El cuerpo JSON es obligatorio.']);
    }

    try {
        $datos = json_decode($contenido, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El cuerpo JSON no es válido.']);
    }

    if (!is_array($datos)) {
        responder_json(400, ['estado' => 'error', 'mensaje' => 'El cuerpo JSON debe ser un objeto.']);
    }

    return $datos;
}

function usuario_actual(): ?array
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (!isset($_SESSION['usuario_id'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['usuario_id'],
        'rol' => (string) ($_SESSION['usuario_rol'] ?? 'cliente'),
    ];
}

function exigir_usuario(): array
{
    $usuario = usuario_actual();
    if ($usuario === null) {
        responder_json(401, ['estado' => 'error', 'mensaje' => 'Inicie sesión para continuar.']);
    }
    return $usuario;
}

function exigir_admin(): array
{
    $usuario = exigir_usuario();
    if ($usuario['rol'] !== 'admin') {
        responder_json(403, ['estado' => 'error', 'mensaje' => 'No tiene permisos para esta operación.']);
    }
    return $usuario;
}

function responder_error_servidor(Throwable $exception): void
{
    error_log($exception->getMessage());
    responder_json(500, ['estado' => 'error', 'mensaje' => 'Error interno del servidor.']);
}
