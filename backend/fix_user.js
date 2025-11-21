const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta correcta a tu base de datos
const dbPath = path.join(__dirname, "database", "parking.db");
const db = new sqlite3.Database(dbPath);

// Crear usuario 0 si no existe
db.run(
  `INSERT OR IGNORE INTO users (id, nombre, email, password)
   VALUES (0, 'Anonimo', 'anonimo@chat', 'x')`,
  (err) => {
    if (err) {
      console.log("\n❌ Error al crear usuario 0:", err.message);
    } else {
      console.log("\n✅ Usuario anónimo (id=0) creado correctamente o ya existía.");
    }
    db.close();
  }
);
