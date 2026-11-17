<?php

declare(strict_types=1);

final class UsuarioModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function buscarPorEmail(string $email): ?array
    {
        $sql = '
            SELECT id, nombre, email, password, rol
            FROM usuarios
            WHERE email = :email
            LIMIT 1
        ';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'email' => $email,
        ]);

        $usuario = $stmt->fetch();

        return $usuario === false ? null : $usuario;
    }

    public function buscarPorId(int $id): ?array
    {
        $sql = '
            SELECT id, nombre, email, rol
            FROM usuarios
            WHERE id = :id
            LIMIT 1
        ';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id' => $id,
        ]);

        $usuario = $stmt->fetch();

        return $usuario === false ? null : $usuario;
    }

    public function crear(
        string $nombre,
        string $email,
        string $passwordHash
    ): int {
        $sql = '
            INSERT INTO usuarios (nombre, email, password)
            VALUES (:nombre, :email, :password)
        ';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'nombre' => $nombre,
            'email' => $email,
            'password' => $passwordHash,
        ]);

        return (int) $this->pdo->lastInsertId();
    }
}