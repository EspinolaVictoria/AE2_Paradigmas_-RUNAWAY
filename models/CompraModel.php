<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

final class ReglaCompraException extends RuntimeException
{
    private int $codigoHttp;

    public function __construct(int $codigoHttp, string $mensaje)
    {
        parent::__construct($mensaje);
        $this->codigoHttp = $codigoHttp;
    }

    public function codigoHttp(): int
    {
        return $this->codigoHttp;
    }
}

final class CompraModel
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Conexion::obtener();
    }

    public function listar(?int $usuarioId, bool $esAdmin): array
    {
        $sql = 'SELECT c.id, c.usuario_id, c.nombre_cliente, c.direccion, c.telefono,
                       c.email, c.medio_pago, c.codigo_cupon, c.subtotal,
                       c.descuento, c.total, c.estado, c.fecha_creacion
                FROM compras c';
        $parametros = [];
        if (!$esAdmin) {
            $sql .= ' WHERE c.usuario_id = :usuario_id';
            $parametros['usuario_id'] = $usuarioId;
        }
        $sql .= ' ORDER BY c.fecha_creacion DESC, c.id DESC';

        $consulta = $this->pdo->prepare($sql);
        $consulta->execute($parametros);
        $compras = $consulta->fetchAll();
        foreach ($compras as &$compra) {
            $compra['detalles'] = $this->listarDetalles((int) $compra['id']);
        }
        unset($compra);
        return $compras;
    }

    public function obtener(int $id, ?int $usuarioId, bool $esAdmin): ?array
    {
        $sql = 'SELECT c.id, c.usuario_id, c.nombre_cliente, c.direccion, c.telefono,
                       c.email, c.medio_pago, c.codigo_cupon, c.subtotal,
                       c.descuento, c.total, c.estado, c.fecha_creacion
                FROM compras c WHERE c.id = :id';
        $parametros = ['id' => $id];
        if (!$esAdmin) {
            $sql .= ' AND c.usuario_id = :usuario_id';
            $parametros['usuario_id'] = $usuarioId;
        }

        $consulta = $this->pdo->prepare($sql);
        $consulta->execute($parametros);
        $compra = $consulta->fetch();
        if (!$compra) {
            return null;
        }

        $compra['detalles'] = $this->listarDetalles($id);
        return $compra;
    }

    public function crear(array $cliente, array $items, ?string $codigoCupon, ?int $usuarioId): int
    {
        if ($items === []) {
            throw new ReglaCompraException(400, 'La compra debe incluir al menos un producto.');
        }

        $this->pdo->beginTransaction();
        try {
            $lineas = [];
            $subtotal = 0.0;

            foreach ($items as $item) {
                $productoId = filter_var($item['producto_id'] ?? null, FILTER_VALIDATE_INT);
                $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
                $talle = trim((string) ($item['talle'] ?? ''));
                if ($productoId === false || $productoId === null || $productoId < 1
                    || $cantidad === false || $cantidad === null || $cantidad < 1 || $cantidad > 99
                    || $talle === '') {
                    throw new ReglaCompraException(400, 'Cada producto necesita id, talle y cantidad válida.');
                }

                $consulta = $this->pdo->prepare(
                    'SELECT id, ref, nombre, talles, precio, stock
                     FROM productos WHERE id = :id AND activo = 1 FOR UPDATE'
                );
                $consulta->execute(['id' => $productoId]);
                $producto = $consulta->fetch();
                if (!$producto) {
                    throw new ReglaCompraException(404, 'Uno de los productos ya no está disponible.');
                }

                $tallesDisponibles = array_values(array_filter(array_map('trim', explode(',', $producto['talles']))));
                if (!in_array($talle, $tallesDisponibles, true)) {
                    throw new ReglaCompraException(400, 'El talle seleccionado no está disponible para el producto.');
                }
                if ((int) $producto['stock'] < $cantidad) {
                    throw new ReglaCompraException(409, 'No hay stock suficiente para completar la compra.');
                }

                $precioUnitario = (float) $producto['precio'];
                $subtotalLinea = round($precioUnitario * $cantidad, 2);
                $subtotal += $subtotalLinea;
                $lineas[] = [
                    'producto' => $producto,
                    'talle' => $talle,
                    'cantidad' => $cantidad,
                    'precio' => $precioUnitario,
                    'subtotal' => $subtotalLinea,
                ];
            }

            $porcentaje = 0.0;
            $codigoNormalizado = $codigoCupon !== null && trim($codigoCupon) !== ''
                ? strtoupper(trim($codigoCupon))
                : null;
            if ($codigoNormalizado !== null) {
                $consulta = $this->pdo->prepare(
                    'SELECT porcentaje FROM cupones
                     WHERE codigo = :codigo AND activo = 1
                       AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
                       AND (fecha_fin IS NULL OR fecha_fin >= NOW())'
                );
                $consulta->execute(['codigo' => $codigoNormalizado]);
                $valor = $consulta->fetchColumn();
                if ($valor === false) {
                    throw new ReglaCompraException(400, 'El cupón no existe o ya no está vigente.');
                }
                $porcentaje = (float) $valor;
            }

            $descuento = round($subtotal * $porcentaje / 100, 2);
            $total = round($subtotal - $descuento, 2);

            $consulta = $this->pdo->prepare(
                'INSERT INTO compras
                    (usuario_id, nombre_cliente, direccion, telefono, email, medio_pago,
                     codigo_cupon, subtotal, descuento, total)
                 VALUES
                    (:usuario_id, :nombre_cliente, :direccion, :telefono, :email, :medio_pago,
                     :codigo_cupon, :subtotal, :descuento, :total)'
            );
            $consulta->execute([
                'usuario_id' => $usuarioId,
                'nombre_cliente' => $cliente['nombre'],
                'direccion' => $cliente['direccion'],
                'telefono' => $cliente['telefono'],
                'email' => $cliente['email'],
                'medio_pago' => $cliente['medio_pago'],
                'codigo_cupon' => $codigoNormalizado,
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'descuento' => number_format($descuento, 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
            ]);
            $compraId = (int) $this->pdo->lastInsertId();

            $insertarDetalle = $this->pdo->prepare(
                'INSERT INTO compra_detalles
                    (compra_id, producto_id, producto_ref, producto_nombre, talle,
                     cantidad, precio_unitario, subtotal)
                 VALUES
                    (:compra_id, :producto_id, :producto_ref, :producto_nombre, :talle,
                     :cantidad, :precio_unitario, :subtotal)'
            );
            $descontarStock = $this->pdo->prepare(
                'UPDATE productos SET stock = stock - :cantidad
                 WHERE id = :id AND stock >= :stock_minimo'
            );

            foreach ($lineas as $linea) {
                $producto = $linea['producto'];
                $insertarDetalle->execute([
                    'compra_id' => $compraId,
                    'producto_id' => $producto['id'],
                    'producto_ref' => $producto['ref'],
                    'producto_nombre' => $producto['nombre'],
                    'talle' => $linea['talle'],
                    'cantidad' => $linea['cantidad'],
                    'precio_unitario' => number_format($linea['precio'], 2, '.', ''),
                    'subtotal' => number_format($linea['subtotal'], 2, '.', ''),
                ]);
                $descontarStock->execute([
                    'cantidad' => $linea['cantidad'],
                    'id' => $producto['id'],
                    'stock_minimo' => $linea['cantidad'],
                ]);
                if ($descontarStock->rowCount() !== 1) {
                    throw new ReglaCompraException(409, 'El stock cambió mientras se procesaba la compra.');
                }
            }

            $this->pdo->commit();
            return $compraId;
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }
    }

    public function actualizarEstado(int $id, string $estado): bool
    {
        if (!in_array($estado, ['pendiente', 'confirmada', 'cancelada'], true)) {
            throw new ReglaCompraException(400, 'El estado debe ser pendiente, confirmada o cancelada.');
        }

        $this->pdo->beginTransaction();
        try {
            $consulta = $this->pdo->prepare('SELECT estado FROM compras WHERE id = :id FOR UPDATE');
            $consulta->execute(['id' => $id]);
            $estadoActual = $consulta->fetchColumn();
            if ($estadoActual === false) {
                $this->pdo->rollBack();
                return false;
            }

            if ($estadoActual !== 'cancelada' && $estado === 'cancelada') {
                $this->ajustarStockDetalles($id, true);
            } elseif ($estadoActual === 'cancelada' && $estado !== 'cancelada') {
                $this->ajustarStockDetalles($id, false);
            }

            $actualizar = $this->pdo->prepare('UPDATE compras SET estado = :estado WHERE id = :id');
            $actualizar->execute(['estado' => $estado, 'id' => $id]);
            $this->pdo->commit();
            return true;
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }
    }

    public function eliminar(int $id, ?int $usuarioId, bool $esAdmin): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sql = 'SELECT usuario_id, estado FROM compras WHERE id = :id';
            $parametros = ['id' => $id];
            if (!$esAdmin) {
                $sql .= ' AND usuario_id = :usuario_id';
                $parametros['usuario_id'] = $usuarioId;
            }
            $sql .= ' FOR UPDATE';
            $consulta = $this->pdo->prepare($sql);
            $consulta->execute($parametros);
            $compra = $consulta->fetch();
            if (!$compra) {
                $this->pdo->rollBack();
                return false;
            }
            if ($compra['estado'] !== 'pendiente') {
                throw new ReglaCompraException(409, 'Solo se pueden eliminar compras pendientes.');
            }

            $this->ajustarStockDetalles($id, true);
            $eliminar = $this->pdo->prepare('DELETE FROM compras WHERE id = :id');
            $eliminar->execute(['id' => $id]);
            $this->pdo->commit();
            return true;
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }
    }

    private function listarDetalles(int $compraId): array
    {
        $consulta = $this->pdo->prepare(
            'SELECT producto_id, producto_ref, producto_nombre, talle,
                    cantidad, precio_unitario, subtotal
             FROM compra_detalles WHERE compra_id = :compra_id ORDER BY id'
        );
        $consulta->execute(['compra_id' => $compraId]);
        return $consulta->fetchAll();
    }

    private function ajustarStockDetalles(int $compraId, bool $devolver): void
    {
        $detalles = $this->listarDetalles($compraId);
        foreach ($detalles as $detalle) {
            if ($detalle['producto_id'] === null) {
                continue;
            }
            if ($devolver) {
                $consulta = $this->pdo->prepare(
                    'UPDATE productos SET stock = stock + :cantidad WHERE id = :id'
                );
                $consulta->execute(['cantidad' => $detalle['cantidad'], 'id' => $detalle['producto_id']]);
                continue;
            }

            $consulta = $this->pdo->prepare(
                'UPDATE productos SET stock = stock - :cantidad
                 WHERE id = :id AND stock >= :stock_minimo'
            );
            $consulta->execute([
                'cantidad' => $detalle['cantidad'],
                'id' => $detalle['producto_id'],
                'stock_minimo' => $detalle['cantidad'],
            ]);
            if ($consulta->rowCount() !== 1) {
                throw new ReglaCompraException(409, 'No hay stock suficiente para reactivar la compra.');
            }
        }
    }
}
