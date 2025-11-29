const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

// Login con diagnóstico
router.post('/login', (req, res) => {
    const { codigo, password } = req.body;
    
    console.log(`🔍 INTENTO DE LOGIN: Código="${codigo}" | Pass="${password}"`);

    db.get('SELECT * FROM users WHERE codigo = ?', [codigo], async (err, user) => {
        if (err) {
            console.error("❌ Error de Base de Datos:", err.message);
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        
        if (!user) {
            console.log("⚠️ USUARIO NO ENCONTRADO en la BD (Revisar columna 'codigo')");
            return res.status(401).json({ error: 'Credenciales inválidas (Usuario)' });
        }

        console.log(`✅ Usuario encontrado: ${user.nombre}`);
        console.log(`🔐 Hash en BD: ${user.password}`);

        // Comparar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        
        console.log(`🤔 Resultado de comparación: ${validPassword ? 'COINCIDE' : 'NO COINCIDE'}`);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas (Contraseña)' });
        }

        // ... resto del código del token (igual que antes) ...
        const token = jwt.sign(
            { id: user.id, codigo: user.codigo, tipo: user.tipo },
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '24h' }
        );

        // Verificar vehículo
        db.get('SELECT * FROM vehiculos WHERE usuario_id = ?', [user.id], (err, vehiculo) => {
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

