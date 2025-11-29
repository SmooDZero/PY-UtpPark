const mysql = require('mysql2');

// Configuración de conexión (Ajusta con tus datos de Workbench)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Tu usuario de MySQL
    password: 'admin', // Tu contraseña de MySQL
    database: 'bd_estacionamiento', // La base de datos nueva que creamos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = {};

// --- ADAPTADORES (Para que MySQL se comporte como SQLite) ---

// 1. db.all -> Para obtener listas (SELECT * FROM...)
db.all = (sql, params, callback) => {
    pool.query(sql, params, (err, rows) => {
        if (err) {
            console.error("❌ Error MySQL:", err.message);
            if (callback) callback(err, null);
        } else {
            if (callback) callback(null, rows);
        }
    });
};

// 2. db.get -> Para obtener un solo dato (SELECT ... LIMIT 1)
db.get = (sql, params, callback) => {
    pool.query(sql, params, (err, rows) => {
        if (err) {
            console.error("❌ Error MySQL:", err.message);
            if (callback) callback(err, null);
        } else {
            // SQLite devuelve el objeto directo, MySQL devuelve un array.
            // Devolvemos el primer elemento rows[0]
            if (callback) callback(null, rows[0]);
        }
    });
};

// 3. db.run -> Para INSERT, UPDATE, DELETE
db.run = function (sql, params, callback) {
    pool.query(sql, params, function (err, result) {
        if (err) {
            console.error("❌ Error MySQL:", err.message);
            if (callback) callback(err);
        } else {
            // Simulamos el contexto "this" de SQLite
            // this.lastID = ID del nuevo registro
            // this.changes = filas afectadas
            const context = {
                lastID: result.insertId,
                changes: result.affectedRows
            };
            if (callback) callback.call(context, null);
        }
    });
};

// 4. db.serialize -> MySQL no lo necesita, pero lo dejamos vacío para que no de error
db.serialize = (callback) => {
    if (callback) callback();
};

console.log('✅ Conectado a MySQL (Modo Compatibilidad SQLite)');

module.exports = db;
