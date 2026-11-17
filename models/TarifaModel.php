<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';
require_once __DIR__ . '/ProductoModel.php';

final class TarifaModel
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Conexion::obtener();
    }

    public function obtenerProducto(int $id): ?array
    {
        return (new ProductoModel($this->pdo))->obtener($id);
    }

    public function obtenerProductoPorReferencia(string $referencia): ?array
    {
        return (new ProductoModel($this->pdo))->obtenerPorReferencia($referencia);
    }

    public function listarProductos(): array
    {
        return (new ProductoModel($this->pdo))->listar();
    }

    public function listarDescuentos(): array
    {
        $consulta = $this->pdo->prepare(
            'SELECT codigo, porcentaje, descripcion
             FROM cupones
             WHERE activo = :activo
               AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
               AND (fecha_fin IS NULL OR fecha_fin >= NOW())
             ORDER BY codigo'
        );
        $consulta->execute(['activo' => 1]);

        $descuentos = [];
        foreach ($consulta->fetchAll() as $cupon) {
            $descuentos[$cupon['codigo']] = [
                'porcentaje' => (float) $cupon['porcentaje'],
                'descripcion' => $cupon['descripcion'],
            ];
        }
        return $descuentos;
    }

    public function obtenerDescuento(string $codigo): ?array
    {
        $consulta = $this->pdo->prepare(
            'SELECT codigo, porcentaje, descripcion
             FROM cupones
             WHERE codigo = :codigo AND activo = 1
               AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
               AND (fecha_fin IS NULL OR fecha_fin >= NOW())'
        );
        $consulta->execute(['codigo' => strtoupper($codigo)]);
        $cupon = $consulta->fetch();
        if (!$cupon) {
            return null;
        }

        return [
            'codigo' => $cupon['codigo'],
            'porcentaje' => (float) $cupon['porcentaje'],
            'descripcion' => $cupon['descripcion'],
        ];
    }
}
