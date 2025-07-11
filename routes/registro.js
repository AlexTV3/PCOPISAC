const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/config');

router.post('/', async (req, res) => {
  const { nombre, correo, password } = req.body;

  try {
    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    const pool = await db.getPool();

    const existe = await pool.request()
      .input('Correo', db.sql.VarChar, correo)
      .input('NombreUsuario', db.sql.VarChar, nombre)
      .query(`
        SELECT 1 FROM Usuarios
        WHERE Correo = @Correo OR NombreUsuario = @NombreUsuario
      `);

    if (existe.recordset.length > 0) {
      return res.status(409).json({ mensaje: 'El correo o el nombre ya están registrados' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input('NombreUsuario', db.sql.VarChar, nombre)
      .input('Correo', db.sql.VarChar, correo)
      .input('Contrasena', db.sql.VarChar, hash)
      .input('ID_Rol', db.sql.Int, 2)
      .query(`
        INSERT INTO Usuarios (NombreUsuario, Correo, Contrasena, ID_Rol)
        OUTPUT INSERTED.ID_Usuario AS id
        VALUES (@NombreUsuario, @Correo, @Contrasena, @ID_Rol)
      `);

    const idUsuario = result.recordset[0].id;

    await pool.request()
      .input('ID_Usuario', db.sql.Int, idUsuario)
      .query(`
        INSERT INTO Clientes (ID_Usuario)
        VALUES (@ID_Usuario)
      `);

    res.json({ mensaje: 'Usuario registrado correctamente' });

  } catch (error) {
    console.error('Error en /registro:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
});

module.exports = router;