import express from 'express';
import { PORT } from './config/env.js';
import mysql from 'mysql2'; // import mysql module without promise
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json());


// Create the connection to database
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'negocio',
});


// A new SELECT query for display all users
app.get('/api/posts', (req, res) => {
  connection.query ("SELECT * FROM clientes", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    })
  });


// A new SELECT query for display all users
app.post('/api/posts', (req, res) => {
  const { nombre, ap_paterno, ap_materno, domicilio, telefono } = req.body;
  connection.query ("INSERT INTO clientes (nombre, ap_paterno, ap_materno, domicilio, telefono) VALUES (?, ?, ?, ?, ?)", [nombre, ap_paterno, ap_materno, domicilio, telefono], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
      res.json({ nombre: nombre, ap_paterno: ap_paterno, ap_materno: ap_materno, domicilio: domicilio, telefono: telefono });
    })
  });


// A new SELECT query for display all users
app.get('/api/posts/:id', (req, res) => {
  connection.query ("SELECT * FROM clientes WHERE id_cliente = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
      res.json(rows[0]);
    })
  });


// A new SELECT query for display all users
app.put('/api/posts/:id', (req, res) => {
  const { nombre, ap_paterno, ap_materno, domicilio, telefono } = req.body;
  connection.query ("UPDATE clientes SET nombre=?, ap_paterno=?, ap_materno=?, domicilio=?, telefono=? WHERE id_cliente = ?", [nombre, ap_paterno, ap_materno, domicilio, telefono, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
      res.json({ nombre: nombre, ap_paterno: ap_paterno, ap_materno: ap_materno, domicilio: domicilio, telefono: telefono});
    })
  });


// A new SELECT query for display all users
app.delete('/api/posts/:id', (req, res) => {
  connection.query ("DELETE from clientes WHERE id_cliente = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
      res.json({ "message": "deleted" });
    })
  });


app.get('/', (req, res) => {
    res.send('Welcome to my Negocio');
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${ PORT }`);
});

export default app;

