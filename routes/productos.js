const express = require('express');
const router = express.Router();
const db = require('../db/config');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  }
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ID_Producto, NombreProd, PrecioUnitario, Stock, Descripcion, Imagen
      FROM Productos
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  const { NombreProd, PrecioUnitario, Descripcion, Stock } = req.body;
  const imagen = req.file ? req.file.filename : null;

  try {
    const pool = await db.getPool();
    await pool.request()
      .input('NombreProd', db.sql.VarChar, NombreProd)
      .input('PrecioUnitario', db.sql.Decimal(10, 2), PrecioUnitario)
      .input('Descripcion', db.sql.VarChar, Descripcion)
      .input('Stock', db.sql.Int, Stock)
      .input('Imagen', db.sql.VarChar, imagen)
      .query(`
        INSERT INTO Productos (NombreProd, PrecioUnitario, Descripcion, Stock, Imagen)
        VALUES (@NombreProd, @PrecioUnitario, @Descripcion, @Stock, @Imagen)
      `);

    res.json({ mensaje: 'Producto agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ mensaje: 'Error al agregar producto', error });
  }
});

router.put('/:id', upload.single('imagen'), async (req, res) => {
  const { id } = req.params;
  const { NombreProd, PrecioUnitario, Descripcion } = req.body;
  const imagen = req.file ? req.file.filename : null;

  try {
    const pool = await db.getPool();
    const request = pool.request()
      .input('NombreProd', db.sql.VarChar, NombreProd)
      .input('PrecioUnitario', db.sql.Decimal(10, 2), PrecioUnitario)
      .input('Descripcion', db.sql.VarChar, Descripcion)
      .input('ID', db.sql.Int, id);

    if (imagen) {
      request.input('Imagen', db.sql.VarChar, imagen);
    }

    const query = `
      UPDATE Productos SET
        NombreProd = @NombreProd,
        PrecioUnitario = @PrecioUnitario,
        Descripcion = @Descripcion
        ${imagen ? ', Imagen = @Imagen' : ''}
      WHERE ID_Producto = @ID
    `;

    await request.query(query);

    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar producto', error });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await db.getPool();
    await pool.request()
      .input('ID', db.sql.Int, req.params.id)
      .query('DELETE FROM Productos WHERE ID_Producto = @ID');

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar producto', error });
  }
});

module.exports = router;
