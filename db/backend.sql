-- RUNAWAY AE4: esquema persistente para usuarios, catálogo, inventario y compras.
-- Importar desde phpMyAdmin de XAMPP. El script es seguro de volver a importar:
-- INSERT IGNORE agrega productos/cupones iniciales sin reponer el stock ya modificado.

CREATE DATABASE IF NOT EXISTS backend
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE backend;

CREATE TABLE IF NOT EXISTS usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    rol            ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- CU02/CU03 (catálogo y ficha), además de stock/umbral de AE2.
CREATE TABLE IF NOT EXISTS productos (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ref              VARCHAR(20) NOT NULL UNIQUE,
    nombre           VARCHAR(120) NOT NULL,
    subtitulo        VARCHAR(180) NOT NULL DEFAULT '',
    categoria        VARCHAR(80) NOT NULL,
    especificacion   TEXT NOT NULL,
    talles           VARCHAR(120) NOT NULL DEFAULT '',
    precio           DECIMAL(12, 2) UNSIGNED NOT NULL,
    imagen           VARCHAR(255) NOT NULL DEFAULT '',
    stock            INT UNSIGNED NOT NULL DEFAULT 0,
    umbral_critico   INT UNSIGNED NOT NULL DEFAULT 0,
    activo           TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productos_categoria_activo (categoria, activo)
) ENGINE=InnoDB;

-- Cupón usado por la calculadora de AE2; el total se valida en el servidor.
CREATE TABLE IF NOT EXISTS cupones (
    codigo       VARCHAR(40) PRIMARY KEY,
    porcentaje   DECIMAL(5, 2) UNSIGNED NOT NULL,
    descripcion  VARCHAR(160) NOT NULL,
    activo       TINYINT(1) NOT NULL DEFAULT 1,
    fecha_inicio DATETIME NULL,
    fecha_fin    DATETIME NULL,
    CONSTRAINT chk_cupon_porcentaje CHECK (porcentaje <= 100)
) ENGINE=InnoDB;

-- CU06/CU07: datos de checkout, confirmación y consulta del pedido.
CREATE TABLE IF NOT EXISTS compras (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT NULL,
    nombre_cliente  VARCHAR(100) NOT NULL,
    direccion       VARCHAR(200) NOT NULL,
    telefono        VARCHAR(40) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    medio_pago      VARCHAR(40) NOT NULL,
    codigo_cupon    VARCHAR(40) NULL,
    subtotal        DECIMAL(12, 2) UNSIGNED NOT NULL,
    descuento       DECIMAL(12, 2) UNSIGNED NOT NULL DEFAULT 0,
    total           DECIMAL(12, 2) UNSIGNED NOT NULL,
    estado          ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_compras_usuario_fecha (usuario_id, fecha_creacion),
    CONSTRAINT fk_compras_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- El detalle conserva el nombre, referencia y precio al momento de la compra.
CREATE TABLE IF NOT EXISTS compra_detalles (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compra_id         BIGINT UNSIGNED NOT NULL,
    producto_id       INT UNSIGNED NULL,
    producto_ref      VARCHAR(20) NOT NULL,
    producto_nombre   VARCHAR(120) NOT NULL,
    talle             VARCHAR(20) NOT NULL,
    cantidad          INT UNSIGNED NOT NULL,
    precio_unitario   DECIMAL(12, 2) UNSIGNED NOT NULL,
    subtotal          DECIMAL(12, 2) UNSIGNED NOT NULL,
    CONSTRAINT fk_detalles_compra
      FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_producto
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    INDEX idx_detalles_compra (compra_id)
) ENGINE=InnoDB;

-- Datos iniciales basados en el catálogo y el monitor de inventario de AE2.
INSERT IGNORE INTO productos
    (ref, nombre, subtitulo, categoria, especificacion, talles, precio, imagen, stock, umbral_critico)
VALUES
    ('001', 'Nocturne Hoodie', 'Heavyweight / Black', 'Hoodies',
     'Algodón premium · calce oversized · acabado lavado · construcción estructurada',
     'S,M,L,XL', 245000.00, 'assets/campaign-batman.jpg', 3, 5),
    ('002', 'Obsidian Tee', 'Heavy Cotton / Black', 'Remeras',
     'Algodón compacto · hombro caído · cuello reforzado · gráfica tonal',
     'S,M,L,XL', 135000.00, 'assets/campaign-head.jpg', 12, 5),
    ('003', 'Armor Cargo', 'Utility / Charcoal', 'Pantalones',
     'Gabardina técnica · bolsillos de volumen · ajuste lateral · corte wide',
     '28,30,32,34', 289000.00, 'assets/campaign-detail.jpg', 2, 4);

INSERT IGNORE INTO cupones (codigo, porcentaje, descripcion)
VALUES ('UCP10', 10.00, '10% de descuento');
