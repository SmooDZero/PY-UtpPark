const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si es gestor
const isGestor = (req, res, next) => {
  if (req.user.tipo !== 'gestor') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de gestor' });
  }
  next();
};

module.exports = { authenticateToken, isGestor };

