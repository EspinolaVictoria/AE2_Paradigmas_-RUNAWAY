<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

final class ProductoModel
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Conexion::obtener();
    }

    public function listar(array $filtros = []): array
    {
        $sql = 'SELECT id, ref, nombre, subtitulo, categoria, especificacion,
                       talles, precio, imagen, stock,
                       umbral_critico AS umbralCritico, activo
                FROM productos
                WHERE activo = 1';
        $parametros = [];

        if (!empty($filtros['categoria'])) {
            $sql .= ' AND categoria = :categoria';
            $parametros['categoria'] = $filtros['categoria'];
        }

        if (!empty($filtros['q'])) {
            $sql .= ' AND (ref LIKE :busqueda_ref OR nombre LIKE :busqueda_nombre
                           OR subtitulo LIKE :busqueda_subtitulo OR categoria LIKE :busqueda_categoria
                           OR especificacion LIKE :busqueda_especificacion)';
            $termino = '%' . $filtros['q'] . '%';
            $parametros['busqueda_ref'] = $termino;
            $parametros['busqueda_nombre'] = $termino;
            $parametros['busqueda_subtitulo'] = $termino;
            $parametros['busqueda_categoria'] = $termino;
            $parametros['busqueda_especificacion'] = $termino;
        }

        $sql .= ' ORDER BY id';
        $consulta = $this->pdo->prepare($sql);
        $consulta->execute($parametros);
        return $consulta->fetchAll();
    }

    public function obtener(int $id): ?array
    {
        $consulta = $this->pdo->prepare(
            'SELECT id, ref, nombre, subtitulo, categoria, especificacion,
                    talles, precio, imagen, stock,
                    umbral_critico AS umbralCritico, activo
             FROM productos WHERE id = :id AND activo = 1'
        );
        $consulta->execute(['id' => $id]);
        $producto = $consulta->fetch();
        return $producto ?: null;
    }

    public function obtenerPorReferencia(string $referencia): ?array
    {
        $consulta = $this->pdo->prepare(
            'SELECT id, ref, nombre, subtitulo, categoria, especificacion,
                    talles, precio, imagen, stock,
                    umbral_critico AS umbralCritico, activo
             FROM productos WHERE ref = :ref AND activo = 1'
        );
        $consulta->execute(['ref' => $referencia]);
        $producto = $consulta->fetch();
        return $producto ?: null;
    }

    public function crear(array $datos): int
    {
        $consulta = $this->pdo->prepare(
            'INSERT INTO productos
                (ref, nombre, subtitulo, categoria, especificacion, talles,
                 precio, imagen, stock, umbral_critico)
             VALUES
                (:ref, :nombre, :subtitulo, :categoria, :especificacion, :talles,
                 :precio, :imagen, :stock, :umbral_critico)'
        );
        $consulta->execute($this->parametrosProducto($datos));
        return (int) $this->pdo->lastInsertId();
    }

    public function actualizar(int $id, array $datos): bool
    {
        $parametros = $this->parametrosProducto($datos);
        $parametros['id'] = $id;
        $consulta = $this->pdo->prepare(
            'UPDATE productos
             SET ref = :ref, nombre = :nombre, subtitulo = :subtitulo,
                 categoria = :categoria, especificacion = :especificacion,
                 talles = :talles, precio = :precio, imagen = :imagen,
                 stock = :stock, umbral_critico = :umbral_critico, activo = 1
             WHERE id = :id'
        );
        $consulta->execute($parametros);
        return $consulta->rowCount() > 0 || $this->existe($id);
    }

    public function desactivar(int $id): bool
    {
        $consulta = $this->pdo->prepare(
            'UPDATE productos SET activo = 0 WHERE id = :id AND activo = 1'
        );
        $consulta->execute(['id' => $id]);
        return $consulta->rowCount() > 0;
    }

    private function existe(int $id): bool
    {
        $consulta = $this->pdo->prepare('SELECT 1 FROM productos WHERE id = :id');
        $consulta->execute(['id' => $id]);
        return (bool) $consulta->fetchColumn();
    }

    private function parametrosProducto(array $datos): array
    {
        return [
            'ref' => $datos['ref'],
            'nombre' => $datos['nombre'],
            'subtitulo' => $datos['subtitulo'],
            'categoria' => $datos['categoria'],
            'especificacion' => $datos['especificacion'],
            'talles' => $datos['talles'],
            'precio' => $datos['precio'],
            'imagen' => $datos['imagen'],
            'stock' => $datos['stock'],
            'umbral_critico' => $datos['umbralCritico'],
        ];
    }
}
