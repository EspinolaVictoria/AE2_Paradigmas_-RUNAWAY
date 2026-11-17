<?php

declare(strict_types=1);

/** Conexión PDO única para los modelos del servidor. */
final class Conexion
{
    private static ?PDO $instancia = null;

    private function __construct()
    {
    }

    public static function obtener(): PDO
    {
        if (self::$instancia instanceof PDO) {
            return self::$instancia;
        }

        $host = getenv('DB_HOST') ?: 'localhost';
        $base = getenv('DB_NAME') ?: 'backend';
        $usuario = getenv('DB_USER') ?: 'root';
        $contrasena = getenv('DB_PASS') ?: '';
        $charset = 'utf8mb4';
        $dsn = "mysql:host={$host};dbname={$base};charset={$charset}";

        self::$instancia = new PDO($dsn, $usuario, $contrasena, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$instancia;
    }
}

/* Compatibilidad temporal con login/registro/perfil/logout de la AE2. */
try {
    $pdo = Conexion::obtener();
} catch (PDOException $exception) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'estado' => 'error',
        'mensaje' => 'No se pudo conectar con la base de datos.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
