from parking_system.database import get_db_connection_auth
from sqlalchemy import text

print("\n--- 🕵️ PRUEBA AVANZADA DE DATOS (MYSQL) ---")

try:
    conn = get_db_connection_auth()
    
    if conn:
        print("✅ Conexión establecida.\n")
        
        # 1. CONSULTA DE USUARIOS Y VEHÍCULOS
        print("📋 LISTA DE USUARIOS Y SUS AUTOS:")
        print("-" * 60)
        print(f"{'NOMBRE':<25} | {'ROL':<10} | {'AUTO/PLACA':<20}")
        print("-" * 60)
        
        query = text("""
            SELECT u.nombre_usuario, u.id_rol, v.placa_vehiculo, v.modelo_vehiculo
            FROM usuario u
            LEFT JOIN vehiculos v ON u.id_usuario = v.id_usuario
            ORDER BY u.id_rol ASC
        """)
        
        result = conn.execute(query).mappings().fetchall()
        
        rol_map = {1: 'Admin', 2: 'Alumno', 3: 'Docente', 4: 'Gestor'}
        
        for row in result:
            rol = rol_map.get(row['id_rol'], 'Otro')
            auto = f"{row['modelo_vehiculo']} ({row['placa_vehiculo']})" if row['placa_vehiculo'] else "Sin auto"
            print(f"{row['nombre_usuario'][:25]:<25} | {rol:<10} | {auto:<20}")
            
        print("-" * 60)
        print(f"Total registros encontrados: {len(result)}")

        conn.close()
    else:
        print("❌ Error: No se pudo conectar.")

except Exception as e:
    print(f"\n❌ ERROR EN LA CONSULTA:\n{e}")