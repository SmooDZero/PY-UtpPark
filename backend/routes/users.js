const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener perfil del usuario actual
router.get('/profile', authenticateToken, (req, res) => {
  db.get(
    `SELECT u.*, v.id as vehiculo_id, v.placa, v.marca, v.modelo, v.color, v.tipo as vehiculo_tipo
     FROM users u
     LEFT JOIN vehiculos v ON u.id = v.usuario_id
     WHERE u.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener perfil' });
      }
      res.json(user);
    }
  );
});

// Registrar vehículo
router.post('/vehiculo', authenticateToken, (req, res) => {
  const { placa, marca, modelo, color, tipo } = req.body;

  if (!placa || !marca || !modelo || !color || !tipo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  db.run(
    'INSERT INTO vehiculos (usuario_id, placa, marca, modelo, color, tipo) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, placa, marca, modelo, color, tipo],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'La placa ya está registrada' });
        }
        return res.status(500).json({ error: 'Error al registrar vehículo' });
      }

      res.status(201).json({
        message: 'Vehículo registrado correctamente',
        vehiculoId: this.lastID
      });
    }
  );
});

// Obtener disponibilidad de espacios
router.get('/espacios/disponibilidad', authenticateToken, (req, res) => {
  db.all(
    `SELECT 
      id, numero, tipo, estado, ubicacion,
      CASE 
        WHEN estado = 'disponible' THEN 1 
        ELSE 0 
      END as disponible
     FROM espacios
     ORDER BY tipo, numero`,
    [],
    (err, espacios) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener espacios' });
      }

      // Calcular estadísticas
      const stats = {
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'disponible').length,
        ocupados: espacios.filter(e => e.estado === 'ocupado').length,
        porTipo: {}
      };

      espacios.forEach(espacio => {
        if (!stats.porTipo[espacio.tipo]) {
          stats.porTipo[espacio.tipo] = { total: 0, disponibles: 0, ocupados: 0 };
        }
        stats.porTipo[espacio.tipo].total++;
        if (espacio.estado === 'disponible') {
          stats.porTipo[espacio.tipo].disponibles++;
        } else if (espacio.estado === 'ocupado') {
          stats.porTipo[espacio.tipo].ocupados++;
        }
      });

      res.json({ espacios, estadisticas: stats });
    }
  );
});

module.exports = router;

