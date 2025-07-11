const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const productosRouter = require('./routes/productos');
app.use('/productos', productosRouter);
const loginRoute = require('./routes/login');
app.use('/login', loginRoute);
const registroRoute = require('./routes/registro');
app.use('/registro', registroRoute);
app.use('/uploads', express.static('uploads'));
const comprasRoute = require('./routes/compras');
app.use('/compras', comprasRoute);

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
