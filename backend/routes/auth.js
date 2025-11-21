const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

// Login
router.post('/login', (req, res) => {
  const { codigo, password } = req.body;

  if (!codigo || !password) {
    return res.status(400).json({ error: 'Código y contraseña son requeridos' });
  }

  db.get('SELECT * FROM users WHERE codigo = ?', [codigo], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si tiene vehículo registrado
    db.get('SELECT * FROM vehiculos WHERE usuario_id = ?', [user.id], (err, vehiculo) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar vehículo' });
      }

      const token = jwt.sign(
        { id: user.id, codigo: user.codigo, tipo: user.tipo },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          codigo: user.codigo,
          nombre: user.nombre,
          email: user.email,
          tipo: user.tipo,
          tieneVehiculo: !!vehiculo
        }
      });
    });
  });
});

// Registro (solo para usuarios, no gestores)
router.post('/register', async (req, res) => {
  const { codigo, nombre, email, password, tipo } = req.body;

  if (!codigo || !nombre || !email || !password || !tipo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!['docente', 'alumno', 'administrativo', 'visitante'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de usuario inválido' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (codigo, nombre, email, password, tipo) VALUES (?, ?, ?, ?, ?)',
      [codigo, nombre, email, hashedPassword, tipo],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'El código o email ya está registrado' });
          }
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }

        res.status(201).json({
          message: 'Usuario registrado correctamente',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;

