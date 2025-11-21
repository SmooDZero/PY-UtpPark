const express = require('express');
const cron = require('node-cron');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Función para verificar disponibilidad y enviar notificaciones
const verificarDisponibilidad = () => {
  db.all(
    `SELECT tipo, COUNT(*) as total, 
     SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles
     FROM espacios
     GROUP BY tipo`,
    [],
    (err, stats) => {
      if (err) {
        console.error('Error al verificar disponibilidad:', err);
        return;
      }

      stats.forEach(stat => {
        const porcentajeDisponible = (stat.disponibles / stat.total) * 100;
        
        // Si quedan menos del 20% de espacios disponibles
        if (porcentajeDisponible < 20 && stat.disponibles > 0) {
          // Enviar notificación a todos los usuarios
          db.all('SELECT id FROM users WHERE tipo != ?', ['gestor'], (err, usuarios) => {
            if (err) return;
            
            usuarios.forEach(usuario => {
              db.run(
                `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) 
                 VALUES (?, ?, ?, ?)`,
                [
                  usuario.id,
                  'disponibilidad',
                  '⚠️ Pocos espacios disponibles',
                  `Quedan solo ${stat.disponibles} espacios de tipo ${stat.tipo} disponibles. Te recomendamos llegar temprano.`
                ]
              );
            });
          });
        }
      });
    }
  );
};

// Programar verificación cada hora
cron.schedule('0 * * * *', () => {
  verificarDisponibilidad();
});

// Enviar notificación de norma diaria
cron.schedule('0 8 * * *', () => {
  const normas = [
    {
      titulo: '📋 Norma del día: Velocidad máxima',
      mensaje: 'Recuerda que la velocidad máxima dentro del estacionamiento es de 10 km/h. Conduce con precaución.'
    },
    {
      titulo: '📋 Norma del día: Uso de espacios',
      mensaje: 'Estaciona únicamente en el espacio asignado. El uso de espacios no autorizados puede resultar en multas.'
    },
    {
      titulo: '📋 Norma del día: Documentación',
      mensaje: 'Mantén siempre tu vehículo con la documentación al día: SOAT, revisión técnica y seguro vigente.'
    }
  ];

  const normaDelDia = normas[Math.floor(Math.random() * normas.length)];

  db.all('SELECT id FROM users WHERE tipo != ?', ['gestor'], (err, usuarios) => {
    if (err) return;
    
    usuarios.forEach(usuario => {
      db.run(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) 
         VALUES (?, ?, ?, ?)`,
        [usuario.id, 'norma', normaDelDia.titulo, normaDelDia.mensaje]
      );
    });
  });
});

// Obtener notificaciones del usuario
router.get('/', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM notificaciones 
     WHERE usuario_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [req.user.id],
    (err, notificaciones) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener notificaciones' });
      }
      res.json(notificaciones);
    }
  );
});

// Marcar notificación como leída
router.put('/:id/leida', authenticateToken, (req, res) => {
  const notificacionId = req.params.id;

  db.run(
    'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
    [notificacionId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar notificación' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      res.json({ message: 'Notificación marcada como leída' });
    }
  );
});

// Obtener notificaciones no leídas
router.get('/no-leidas', authenticateToken, (req, res) => {
  db.all(
    `SELECT COUNT(*) as count FROM notificaciones 
     WHERE usuario_id = ? AND leida = 0`,
    [req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener notificaciones' });
      }
      res.json({ count: result[0].count });
    }
  );
});

module.exports = router;

