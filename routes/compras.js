const express = require('express');
const router = express.Router();
const db = require('../db/config');

router.post('/', async (req, res) => {
  console.log('Datos recibidos en /compras:', req.body);

  const { carrito, ID_Cliente, tipoComprobante, ruc, razonSocial } = req.body;

  if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).json({ mensaje: 'El carrito está vacío' });
  }

  try {
    const pool = await db.getPool();
    const fechaActual = new Date();
    const estado = 'Pendiente';

    // 1. Insertar pedidos
    const pedidoResult = await pool.request()
      .input('ID_Cliente', db.sql.Int, ID_Cliente)
      .input('Fecha_Pedido', db.sql.DateTime, fechaActual)
      .input('Estado', db.sql.VarChar, estado)
      .query(`
        INSERT INTO Pedidos (ID_Cliente, Fecha_Pedido, Estado)
        OUTPUT INSERTED.ID_Pedido
        VALUES (@ID_Cliente, @Fecha_Pedido, @Estado)
      `);

    const idPedido = pedidoResult.recordset[0].ID_Pedido;

    // 2. Insertar en el DetalleDelPedido
    for (const item of carrito) {
      await pool.request()
        .input('ID_Pedido', db.sql.Int, idPedido)
        .input('ID_Producto', db.sql.Int, item.ID_Producto)
        .input('Cantidad', db.sql.Int, item.cantidad)
        .input('Precio_Unidad', db.sql.Decimal(18, 2), item.PrecioUnitario)
        .query(`
          INSERT INTO DetalleDelPedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unidad)
          VALUES (@ID_Pedido, @ID_Producto, @Cantidad, @Precio_Unidad)
        `);
    }
        // 3. Insertar en comprobantes
    const subtotal = carrito.reduce((acc, p) => acc + p.PrecioUnitario * p.cantidad, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const idTipo = {
      Boleta: 1,
      Factura: 2,
      Proforma: 3
    }[tipoComprobante];

    const reqComprobante = pool.request()
      .input('ID_Pedido', db.sql.Int, idPedido)
      .input('ID_TipoComprobante', db.sql.Int, idTipo)
      .input('Fecha_Emision', db.sql.DateTime, fechaActual)
      .input('IGV', db.sql.Decimal(18, 2), igv)
      .input('Total', db.sql.Decimal(18, 2), total);

    if (tipoComprobante === 'Factura') {
      reqComprobante
        .input('RUC_Cliente', db.sql.VarChar, ruc)
        .input('Nombre_Empresa', db.sql.VarChar, razonSocial);
    } else {
      reqComprobante
        .input('RUC_Cliente', db.sql.VarChar, null)
        .input('Nombre_Empresa', db.sql.VarChar, null);
    }

    await reqComprobante.query(`
      INSERT INTO Comprobantes (
        ID_Pedido, ID_TipoComprobante, Fecha_Emision, RUC_Cliente, Nombre_Empresa, IGV, Total
      )
      VALUES (
        @ID_Pedido, @ID_TipoComprobante, @Fecha_Emision, @RUC_Cliente, @Nombre_Empresa, @IGV, @Total
      )
    `);

    res.json({ mensaje: 'Compra registrada correctamente' });

  } catch (error) {
    console.error('❌ Error al registrar compra:', error);
    res.status(500).json({ mensaje: 'Error al finalizar compra' });
  }
});

module.exports = router;