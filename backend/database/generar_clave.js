const bcrypt = require('bcryptjs');

const usuarios = [
    { codigo: 'G001', pass: 'admin123', rol: 'Gestor' },
    { codigo: 'C123456', pass: 'docente123', rol: 'Docente' },
    { codigo: 'U22238381', pass: 'alumno123', rol: 'Alumno' }
];

async function generarSQL() {
    console.log("\n--- COPIA DESDE AQUÍ ---");
    console.log("USE bd_estacionamiento;\n");
    
    for (const u of usuarios) {
        // Encriptamos la contraseña real
        const hash = await bcrypt.hash(u.pass, 10);
        
        console.log(`-- ${u.rol} (${u.codigo}) -> Clave: ${u.pass}`);
        console.log(`UPDATE users SET password = '${hash}' WHERE codigo = '${u.codigo}';`);
        console.log("");
    }
    console.log("------------------------\n");
}

generarSQL();