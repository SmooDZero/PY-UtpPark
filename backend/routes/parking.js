const express = require('express');
const db = require('../database/db');
const { authenticateToken, isGestor } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los espacios (gestor)
router.get('/espacios', authenticateToken, isGestor, (req, res) => {
  db.all(
    `SELECT 
      e.*,
      a.usuario_id,
      u.nombre as usuario_nombre,
      u.codigo as usuario_codigo,
      v.placa,
      a.fecha_inicio,
      a.estado as asignacion_estado
     FROM espacios e
     LEFT JOIN asignaciones a ON e.id = a.espacio_id AND a.estado = 'activa'
     LEFT JOIN users u ON a.usuario_id = u.id
     LEFT JOIN vehiculos v ON a.vehiculo_id = v.id
     ORDER BY e.numero`,
    [],
    (err, espacios) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener espacios' });
      }
      res.json(espacios);
    }
  );
});

// Asignar espacio a usuario (gestor)
router.post('/asignar', authenticateToken, isGestor, (req, res) => {
  const { usuario_id, vehiculo_id, espacio_id } = req.body;

  if (!usuario_id || !vehiculo_id || !espacio_id) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  db.serialize(() => {
    // Verificar que el espacio esté disponible
    db.get('SELECT estado FROM espacios WHERE id = ?', [espacio_id], (err, espacio) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar espacio' });
      }

      if (!espacio) {
        return res.status(404).json({ error: 'Espacio no encontrado' });
      }

      if (espacio.estado !== 'disponible') {
        return res.status(400).json({ error: 'El espacio no está disponible' });
      }

      // Verificar que el usuario tenga el vehículo
      db.get('SELECT * FROM vehiculos WHERE id = ? AND usuario_id = ?', 
        [vehiculo_id, usuario_id], (err, vehiculo) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar vehículo' });
        }

        if (!vehiculo) {
          return res.status(400).json({ error: 'El vehículo no pertenece al usuario' });
        }

        // Crear asignación
        db.run(
          `INSERT INTO asignaciones (usuario_id, vehiculo_id, espacio_id) 
           VALUES (?, ?, ?)`,
          [usuario_id, vehiculo_id, espacio_id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error al crear asignación' });
            }

            // Actualizar estado del espacio
            db.run(
              'UPDATE espacios SET estado = ? WHERE id = ?',
              ['ocupado', espacio_id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Error al actualizar espacio' });
                }

                res.status(201).json({
                  message: 'Espacio asignado correctamente',
                  asignacionId: this.lastID
                });
              }
            );
          }
        );
      });
    });
  });
});

// Liberar espacio (gestor)
router.post('/liberar/:espacioId', authenticateToken, isGestor, (req, res) => {
  const espacioId = req.params.espacioId;

  db.serialize(() => {
    // Finalizar asignación activa
    db.run(
      `UPDATE asignaciones 
       SET estado = 'finalizada', fecha_fin = CURRENT_TIMESTAMP 
       WHERE espacio_id = ? AND estado = 'activa'`,
      [espacioId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al liberar espacio' });
        }

        // Actualizar estado del espacio
        db.run(
          'UPDATE espacios SET estado = ? WHERE id = ?',
          ['disponible', espacioId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error al actualizar espacio' });
            }

            res.json({ message: 'Espacio liberado correctamente' });
          }
        );
      }
    );
  });
});

// Crear nuevo espacio (gestor)
router.post('/espacios', authenticateToken, isGestor, (req, res) => {
  const { numero, tipo, ubicacion } = req.body;

  if (!numero || !tipo) {
    return res.status(400).json({ error: 'Número y tipo son requeridos' });
  }

  db.run(
    'INSERT INTO espacios (numero, tipo, ubicacion) VALUES (?, ?, ?)',
    [numero, tipo, ubicacion || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'El número de espacio ya existe' });
        }
        return res.status(500).json({ error: 'Error al crear espacio' });
      }

      res.status(201).json({
        message: 'Espacio creado correctamente',
        espacioId: this.lastID
      });
    }
  );
});

// Obtener usuarios con vehículos (gestor)
router.get('/usuarios', authenticateToken, isGestor, (req, res) => {
  db.all(
    `SELECT 
      u.id, u.codigo, u.nombre, u.email, u.tipo,
      v.id as vehiculo_id, v.placa, v.marca, v.modelo, v.color, v.tipo as vehiculo_tipo
     FROM users u
     INNER JOIN vehiculos v ON u.id = v.usuario_id
     WHERE u.tipo != 'gestor'
     ORDER BY u.nombre`,
    [],
    (err, usuarios) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      res.json(usuarios);
    }
  );
});

module.exports = router;

