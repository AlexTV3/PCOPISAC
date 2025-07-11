const bcrypt = require('bcrypt');
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'UCSUR123+',
    server: 'dbpcopisac.cvcoqacm4r23.sa-east-1.rds.amazonaws.com',
    port: 1433,
    database: 'PCOPISAC',
    options: {
        encrypt: true,
        trustServerCertificate: true
  }
};

//Unicamente para cifrar la contraseña de un usuario administrador insertado por SMSS:
async function encryptPasswordAndUpdate() {
  const correoAdmin = 'correo@gmail.com'; // ← Cambiar por el correo del admin
  const passwordPlano = 'contraseña';        // ← Cambiar por la contraseña actual del admin

  try {
    await sql.connect(config);
    const hash = await bcrypt.hash(passwordPlano, 10);

    await sql.query`
      UPDATE Usuarios
      SET Contrasena = ${hash}
      WHERE Correo = ${correoAdmin}
    `;

    console.log(' Contraseña encriptada y actualizada.');
    sql.close();
  } catch (err) {
    console.error(' Error al encriptar o actualizar:', err);
    sql.close();
  }
}

encryptPasswordAndUpdate();