const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/config');

router.post('/', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const pool = await db.getPool();
    const result = await pool.request()
      .input('Correo', db.sql.VarChar, correo)
      .query(`
        SELECT ID_Usuario, NombreUsuario, Contrasena, ID_Rol
        FROM Usuarios
        WHERE Correo = @Correo
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuario = result.recordset[0];
    const esValida = await bcrypt.compare(password, usuario.Contrasena);

    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const rol = usuario.ID_Rol === 1 ? 'Administrador' : 'Cliente';

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.ID_Usuario,
        nombre: usuario.NombreUsuario,
        rol
      }
    });

  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
});
module.exports = router;