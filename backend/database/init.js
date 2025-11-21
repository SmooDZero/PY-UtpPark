const db = require('./db');
const bcrypt = require('bcryptjs');

// Crear tablas
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de usuarios
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('docente', 'alumno', 'administrativo', 'visitante', 'gestor')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        
        // Tabla de vehículos
        db.run(`CREATE TABLE IF NOT EXISTS vehiculos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL,
          placa TEXT UNIQUE NOT NULL,
          marca TEXT NOT NULL,
          modelo TEXT NOT NULL,
          color TEXT NOT NULL,
          tipo TEXT NOT NULL CHECK(tipo IN ('auto', 'moto', 'camioneta')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) return reject(err);
          
          // Tabla de espacios de estacionamiento
          db.run(`CREATE TABLE IF NOT EXISTS espacios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('auto', 'moto', 'camioneta', 'discapacitado')),
            estado TEXT NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupado', 'reservado', 'mantenimiento')),
            ubicacion TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`, (err) => {
            if (err) return reject(err);
            
            // Tabla de asignaciones
            db.run(`CREATE TABLE IF NOT EXISTS asignaciones (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              usuario_id INTEGER NOT NULL,
              vehiculo_id INTEGER NOT NULL,
              espacio_id INTEGER NOT NULL,
              fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
              fecha_fin DATETIME,
              estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'finalizada', 'cancelada')),
              FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
              FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
            )`, (err) => {
              if (err) return reject(err);
              
              // Tabla de notificaciones
              db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                tipo TEXT NOT NULL CHECK(tipo IN ('disponibilidad', 'norma', 'recordatorio')),
                titulo TEXT NOT NULL,
                mensaje TEXT NOT NULL,
                leida INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
              )`, (err) => {
                if (err) return reject(err);
                
                // Tabla de historial de chatbot
                db.run(`CREATE TABLE IF NOT EXISTS chatbot_history (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  usuario_id INTEGER,
                  pregunta TEXT NOT NULL,
                  respuesta TEXT NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
                )`, (err) => {
                  if (err) return reject(err);
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  });
};

// Crear usuarios de ejemplo
const createSampleUsers = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const hashedPasswordDocente = await bcrypt.hash('docente123', 10);
      const hashedPasswordAlumno = await bcrypt.hash('alumno123', 10);
      
      db.serialize(() => {
        // Usuario gestor
        db.run(`INSERT OR IGNORE INTO users (codigo, nombre, email, password, tipo) 
          VALUES (?, ?, ?, ?, ?)`,
          ['G001', 'Gestor Principal', 'gestor@utp.edu.pe', hashedPassword, 'gestor'],
          (err) => {
            if (err) return reject(err);
            
            // Usuario docente
            db.run(`INSERT OR IGNORE INTO users (codigo, nombre, email, password, tipo) 
              VALUES (?, ?, ?, ?, ?)`,
              ['C123456', 'Profesor Ejemplo', 'docente@utp.edu.pe', hashedPasswordDocente, 'docente'],
              (err) => {
                if (err) return reject(err);
                
                // Usuario alumno
                db.run(`INSERT OR IGNORE INTO users (codigo, nombre, email, password, tipo) 
                  VALUES (?, ?, ?, ?, ?)`,
                  ['U22238381', 'Manuel Estudiante', 'alumno@utp.edu.pe', hashedPasswordAlumno, 'alumno'],
                  (err) => {
                    if (err) return reject(err);
                    resolve();
                  }
                );
              }
            );
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Crear espacios de ejemplo
const createSampleSpaces = () => {
  return new Promise((resolve, reject) => {
    const espacios = [
      { numero: 'A-001', tipo: 'auto', ubicacion: 'Zona A' },
      { numero: 'A-002', tipo: 'auto', ubicacion: 'Zona A' },
      { numero: 'A-003', tipo: 'auto', ubicacion: 'Zona A' },
      { numero: 'A-004', tipo: 'auto', ubicacion: 'Zona A' },
      { numero: 'A-005', tipo: 'auto', ubicacion: 'Zona A' },
      { numero: 'M-001', tipo: 'moto', ubicacion: 'Zona M' },
      { numero: 'M-002', tipo: 'moto', ubicacion: 'Zona M' },
      { numero: 'M-003', tipo: 'moto', ubicacion: 'Zona M' },
      { numero: 'C-001', tipo: 'camioneta', ubicacion: 'Zona C' },
      { numero: 'C-002', tipo: 'camioneta', ubicacion: 'Zona C' },
      { numero: 'D-001', tipo: 'discapacitado', ubicacion: 'Zona D' },
      { numero: 'D-002', tipo: 'discapacitado', ubicacion: 'Zona D' },
    ];

    let completed = 0;
    const total = espacios.length;

    if (total === 0) {
      resolve();
      return;
    }

    espacios.forEach(espacio => {
      db.run(`INSERT OR IGNORE INTO espacios (numero, tipo, ubicacion) VALUES (?, ?, ?)`,
        [espacio.numero, espacio.tipo, espacio.ubicacion],
        (err) => {
          if (err) return reject(err);
          completed++;
          if (completed === total) {
            resolve();
          }
        }
      );
    });
  });
};

// Inicializar base de datos
const init = async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    await createTables();
    console.log('✅ Tablas creadas correctamente');
    await createSampleUsers();
    console.log('✅ Usuarios de ejemplo creados');
    await createSampleSpaces();
    console.log('✅ Espacios de ejemplo creados');
    console.log('\n✅ Base de datos inicializada correctamente');
    console.log('\n📋 Usuarios de ejemplo:');
    console.log('   Gestor: G001 / admin123');
    console.log('   Docente: C123456 / docente123');
    console.log('   Alumno: U22238381 / alumno123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar:', error);
    process.exit(1);
  }
};

init();

