import mysql.connector
from mysql.connector import Error
from sqlalchemy import text, create_engine
import configparser
import os

# FUNCIÓN PARA ENCONTRAR EL CONFIG.INI (RUTAS ABSOLUTAS) ---
def get_config_path():
    """
    Busca el archivo config.ini subiendo un nivel desde la carpeta actual.
    """
    # Obtenemos la ruta de ESTE archivo (database.py)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Subimos un nivel (..) para buscar config.ini en la raíz del proyecto
    ruta_config = os.path.join(base_dir, '..', 'config.ini')
    return os.path.abspath(ruta_config)

#LECTURA DE CONFIGURACIÓN PARA SQLALCHEMY (Chatbot & Auth) ---
def get_db_config_chatbot():
    config = configparser.ConfigParser()
    # Búsqueda inteligente del config.ini
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, 'config.ini')
    config.read(config_path)
    
    db = config['database']
    db_uri = f"mysql+mysqlconnector://{db['USUARIO']}:{db['PASSWORD']}@{db['HOST']}:{db['PORT']}/{db['NOMBRE_DB']}"
    return config['database'], config['google'], db_uri

def registrar_interaccion(id_usuario, pregunta, respuesta):

    if not id_usuario:
        return 

    try:
        _, _, db_uri = get_db_config_chatbot()
        
        engine = create_engine(db_uri)
        
        query = text("""
            INSERT INTO chatbot_historial (pregunta_histo, respuesta_histo, id_usuario)
            VALUES (:preg, :resp, :uid)
        """)
        
        with engine.connect() as conn:
            conn.execute(query, {"preg": pregunta, "resp": respuesta, "uid": id_usuario})
            conn.commit()
            print(f"Historial guardado para usuario ID {id_usuario}")
            
    except Exception as e:
        print(f"Error guardando historial: {e}")

def get_nombre_usuario(id_usuario):
    if not id_usuario: return "Usuario"
    try:
        _, _, db_uri = get_db_config_chatbot()
        engine = create_engine(db_uri)
        with engine.connect() as conn:
            query = text("SELECT nombre_usuario FROM usuario WHERE id_usuario = :uid")
            result = conn.execute(query, {"uid": id_usuario}).fetchone()
            if result:
                return result[0] 
    except Exception as e:
        print(f"⚠️ Error buscando nombre de usuario: {e}")
    return "Usuario"

def consultar_roles(conexion):
    if conexion is None or not conexion.is_connected():
        print("No hay conexión a la base de datos.")
        return

    try:
        cursor = conexion.cursor()
        cursor.execute("SELECT * FROM rol;")
        resultados = cursor.fetchall()

        print(f"Se encontraron {cursor.rowcount} roles de usuario:")
        for fila in resultados:
            print(f"  ID: {fila[0]}, Rol: {fila[1]}")

    except Error as e:
        print(f"Error al ejecutar la consulta: {e}")

    finally:
        if conexion.is_connected():
            cursor.close()
            # No cerrar la conexión aquí sino en el script principal que la llamo

def get_db_connection_auth():
    try:
        _, _, db_uri = get_db_config_chatbot()
        engine = create_engine(db_uri)
        return engine.connect()
    except Exception as e:
        print(f"Error conexión BD: {e}")
        return None

def registrar_usuario(data, bcrypt_instance):
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    dni = data.get('dni')
    id_rol = data.get('id_rol', 2)
    id_edificio = data.get('id_edificio')
   

    if not all([nombre, email, password, dni]):
        return False, "Faltan datos obligatorios"

    conn = get_db_connection_auth()
    if not conn:
        return False, "Error de conexión a la base de datos"

    try:
        check_query = text("SELECT count(*) FROM Usuario WHERE email_usuario = :email")
        exists = conn.execute(check_query, {"email": email}).scalar() or 0

        if exists > 0:
            return False, "El correo electrónico ya está registrado."

        hashed_password = bcrypt_instance.generate_password_hash(password).decode('utf-8')

        if id_rol != 4:
            id_edificio = None


        insert_query = text("""
            INSERT INTO Usuario (nombre_usuario, email_usuario, contra_usuario, dni_usuario, id_rol, id_edificio)
            VALUES (:nombre, :email, :contra, :dni, :id_rol, :id_edificio)
        """)
        
        conn.execute(insert_query, {
            "nombre": nombre,
            "email": email,
            "contra": hashed_password,
            "dni": dni,
            "id_rol": id_rol,
            "id_edificio": id_edificio
        })
        conn.commit()
        return True, "Usuario registrado exitosamente."

    except Exception as e:
        print(f"Error en registro: {e}")
        return False, "Error interno al intentar registrar el usuario."
    finally:
        conn.close()

def validar_credenciales(identificador, password, bcrypt_instance):

    if not identificador or not password:
        return None

    conn = get_db_connection_auth()
    if not conn: return None
    
    try:
        # CONSULTA INTELIGENTE:
        # 1. ¿Es su DNI exacto?
        # 2. ¿Es su Email exacto?
        # 3. ¿Es su Código? (Buscamos si el email COMIENZA con ese texto + @)
        query = text("""
            SELECT id_usuario, nombre_usuario, contra_usuario, id_rol, dni_usuario, email_usuario, id_edificio
            FROM usuario
            WHERE dni_usuario = :dato
               OR email_usuario = :dato
               OR email_usuario LIKE CONCAT(:dato, '@%')
        """)

        # Ejecutamos la búsqueda
        usuario = conn.execute(query, {"dato": identificador}).mappings().fetchone()

        if usuario:
            # Validar Contraseña
            if bcrypt_instance.check_password_hash(usuario['contra_usuario'], password):
                return {
                    "id": usuario['id_usuario'],
                    "nombre": usuario['nombre_usuario'],
                    "email": usuario['email_usuario'],
                    "rol": usuario['id_rol'],
                    "dni": usuario['dni_usuario'],
                    "edificio": usuario['id_edificio']
                }
        return None

    except Exception as e:
        print(f"Error en login: {e}")
        return None
    finally:
        # AQUÍ ESTABA EL ERROR
        conn.close()

# --- Funciones que permiten leer espacios y vehículos ---

# Reemplaza la función obtener_espacios en database.py

# Reemplaza la función obtener_espacios existente en database.py

# Reemplaza la función obtener_espacios en database.py

def obtener_espacios(user_id=None):
    print(f"--- DEBUG: Solicitando espacios para User ID: {user_id} ---")
    conn = get_db_connection_auth()
    if not conn: 
        print("--- DEBUG ERROR: No hay conexión a BD ---")
        return []
    
    try:
        filtro_edificio = ""
        params = {}

        # 1. Verificar edificio del gestor
        if user_id:
            query_check = text("SELECT id_edificio, nombre_usuario, id_rol FROM usuario WHERE id_usuario = :uid")
            user_data = conn.execute(query_check, {"uid": user_id}).mappings().fetchone()
            
            print(f"--- DEBUG: Usuario encontrado: {user_data} ---")
            
            # Si es Gestor (Rol 4) y tiene edificio, filtramos
            if user_data and user_data['id_rol'] == 4 and user_data['id_edificio']:
                filtro_edificio = "WHERE e.id_edificio = :edificio_id"
                params['edificio_id'] = user_data['id_edificio']
                print(f"--- DEBUG: Filtrando por Edificio ID: {user_data['id_edificio']} ---")
            else:
                print("--- DEBUG: Usuario es Admin o no tiene edificio. Mostrando TODO. ---")

        # 2. CONSULTA (Con nombres correctos de la BD nueva)
        query = text(f"""
            SELECT 
                e.id_espacio, 
                e.numero_espacio, 
                e.tipo_espacio, 
                e.estado_espacio,
                ed.nombre_edificio,
                a.id as id_asignacion,
                u.nombre_usuario as ocupante_nombre,
                v.placa_vehiculo as ocupante_placa,
                a.estado as estado_reserva
            FROM espacio e
            JOIN edificio ed ON e.id_edificio = ed.id_edificio
            LEFT JOIN asignacion a ON e.id_espacio = a.id_espacio AND a.estado IN ('ocupado', 'activo', 'espera')
            LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
            LEFT JOIN vehiculos v ON u.id_usuario = v.id_usuario
            {filtro_edificio}
            ORDER BY e.numero_espacio ASC
        """)
        
        result = conn.execute(query, params).mappings().fetchall()
        print(f"--- DEBUG: Se encontraron {len(result)} espacios. ---")
        return [dict(row) for row in result]

    except Exception as e:
        print(f"!!! DEBUG ERROR CRÍTICO en obtener_espacios: {e}")
        return []
    finally:
        conn.close()

def obtener_mi_vehiculo(user_id):
    conn = get_db_connection_auth()
    if not conn: return None
    try:
        query = text("SELECT * FROM vehiculos WHERE id_usuario = :uid LIMIT 1")
        result = conn.execute(query, {"uid": user_id}).mappings().fetchone()
        return dict(result) if result else None
    finally:
        conn.close()

def registrar_vehiculo_db(data):
    conn = get_db_connection_auth()
    if not conn: return False, "Error conexión"
    try:
        query = text("""
            INSERT INTO vehiculos (placa_vehiculo, marca_vehiculo, modelo_vehiculo, tipo_vehiculo, id_usuario)
            VALUES (:placa, :marca, :modelo, :tipo, :uid)
        """)
        conn.execute(query, {
            "placa": data['placa'], "marca": data['marca'], 
            "modelo": data['modelo'], "tipo": data['tipo'], 
            "uid": data['usuario_id']
        })
        conn.commit()
        return True, "Vehículo registrado"
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

# --- FUNCIONES PARA EL ADMINISTRADOR ---

# En parking_system/database.py

def obtener_stats_admin():
    conn = get_db_connection_auth()
    if not conn: return None
    try:
        # 1. Totales Generales
        total_users = conn.execute(text("SELECT COUNT(*) FROM usuario")).scalar()
        total_espacios = conn.execute(text("SELECT COUNT(*) FROM espacio")).scalar()

        # 2. Desglose por Estado Físico del Espacio
        libres = conn.execute(text("SELECT COUNT(*) FROM espacio WHERE estado_espacio='disponible'")).scalar()
        ocupados = conn.execute(text("SELECT COUNT(*) FROM espacio WHERE estado_espacio='ocupado'")).scalar()
        reservados = conn.execute(text("SELECT COUNT(*) FROM espacio WHERE estado_espacio='espera'")).scalar()

        # 3. Autos Atendidos Hoy (KPI Operativo)
        query_hoy = text("""
            SELECT COUNT(*) FROM asignacion 
            WHERE DATE(fecha_solicitud) = CURDATE() 
            AND estado != 'vencida' 
            AND estado != 'espera'
        """)
        atendidos_hoy = conn.execute(query_hoy).scalar() or 0

        return {
            "usuarios_registrados": total_users,
            "capacidad_total": total_espacios,
            "espacios_libres": libres,
            "espacios_ocupados": ocupados,   # <--- Nuevo dato
            "espacios_reservados": reservados, # <--- Nuevo dato
            "autos_atendidos_hoy": atendidos_hoy
        }
    except Exception as e:
        print(f"Error stats admin: {e}")
        return None
    finally:
        conn.close()

def obtener_alertas_mal_uso():
    """Obtiene la lista de usuarios con reservas vencidas recientes"""
    conn = get_db_connection_auth()
    if not conn: return []
    
    try:
        # CORRECCIÓN: Usamos los nombres reales de TU base de datos (asignacion, usuario, espacio)
        # Y filtramos específicamente por estado = 'vencida'
        query = text("""
            SELECT 
                a.id, 
                u.nombre_usuario as nombre, 
                u.dni_usuario as dni, 
                u.email_usuario as email, 
                CONCAT('P', e.piso_espacio, '-', e.numero_espacio) as codigo_visual, 
                a.fecha_solicitud, 
                a.fecha_fin
            FROM asignacion a
            JOIN usuario u ON a.id_usuario = u.id_usuario
            JOIN espacio e ON a.id_espacio = e.id_espacio
            WHERE a.estado = 'vencida'
            ORDER BY a.fecha_solicitud DESC
            LIMIT 20
        """)
        
        result = conn.execute(query).mappings().fetchall()
        
        # Convertimos a lista de diccionarios
        lista_alertas = [dict(row) for row in result]
        
        print(f"--- DEBUG: Alertas encontradas: {len(lista_alertas)} ---") # Para ver en consola si funciona
        return lista_alertas

    except Exception as e:
        print(f"Error alertas: {e}")
        return []
    finally:
        conn.close()


def listar_todos_usuarios():
    print("\n--- [DEBUG] INICIO: listar_todos_usuarios ---")
    conn = get_db_connection_auth()
    if not conn:
        print("!!! [ERROR] No hay conexión a la base de datos.")
        return []

    try:
        # CONSULTA DIAGNÓSTICO: Usamos los nombres EXACTOS de tu archivo .sql
        # Tabla: usuario (singular), Tabla: vehiculos (plural)
        # Claves: id_usuario (en ambas)
        query_sql = """
            SELECT 
                u.id_usuario, 
                u.nombre_usuario, 
                u.email_usuario, 
                u.dni_usuario, 
                u.id_rol,
                v.placa_vehiculo, 
                v.marca_vehiculo, 
                v.modelo_vehiculo, 
                v.tipo_vehiculo
            FROM usuario u
            LEFT JOIN vehiculos v ON u.id_usuario = v.id_usuario
            ORDER BY u.id_rol ASC, u.nombre_usuario ASC
        """
        
        print(f"[DEBUG] Ejecutando Query SQL...")
        # Ejecutamos y convertimos a lista de diccionarios inmediatamente para ver qué trae
        result = conn.execute(text(query_sql)).mappings().fetchall()
        
        print(f"[DEBUG] Filas encontradas en BD: {len(result)}")
        
        if len(result) > 0:
            # Imprimimos las llaves de la primera fila para ver si coinciden
            print(f"[DEBUG] Columnas obtenidas en la primera fila: {result[0].keys()}")

        users_list = []
        roles_map = {1: 'Administrador', 2: 'Estudiante', 3: 'Profesor', 4: 'Gestor'}

        print("[DEBUG] Procesando filas...")
        for row in result:
            # Convertimos cada fila a diccionario para evitar errores de acceso
            row_dict = dict(row)
            
            # Construimos el objeto usuario
            user_obj = {
                "id": row_dict['id_usuario'],
                "nombre": row_dict['nombre_usuario'],
                "email": row_dict['email_usuario'],
                "dni": row_dict['dni_usuario'],
                "rol_texto": roles_map.get(row_dict['id_rol'], 'Usuario'),
                "rol_id": row_dict['id_rol'],
                "vehiculo": None
            }

            # Verificamos si tiene vehículo (si la placa no es None)
            if row_dict.get('placa_vehiculo'):
                user_obj["vehiculo"] = {
                    "placa": row_dict['placa_vehiculo'],
                    "descripcion": f"{row_dict['marca_vehiculo']} {row_dict['modelo_vehiculo']}",
                    "tipo": row_dict['tipo_vehiculo']
                }
            
            users_list.append(user_obj)

        print(f"[DEBUG] Lista final procesada con {len(users_list)} usuarios.")
        # Imprimimos el primer usuario para verificar el formato JSON
        if len(users_list) > 0:
            print(f"[DEBUG] Ejemplo de usuario final: {users_list[0]}")
            
        return users_list

    except Exception as e:
        print(f"\n!!! [ERROR CRÍTICO] en listar_todos_usuarios: {type(e).__name__}")
        print(f"Mensaje de error: {str(e)}")
        # Importante: Si falla, devolvemos lista vacía para que no explote el frontend
        return []
    finally:
        conn.close()
        print("--- [DEBUG] FIN: listar_todos_usuarios ---\n")

# --- GESTIÓN DE NOTIFICACIONES ---

def obtener_notificaciones_usuario(user_id):
    conn = get_db_connection_auth()
    if not conn: return []
    try:
        # Traemos primero las NO leídas, luego las leídas recientes
        query = text("""
            SELECT id_noti, titulo_noti, mensaje_noti, tipo_noti, leido 
            FROM notificaciones 
            WHERE id_usuario = :uid 
            ORDER BY leido ASC, id_noti DESC 
            LIMIT 10
        """)
        result = conn.execute(query, {"uid": user_id}).mappings().fetchall()
        return [dict(row) for row in result]
    except Exception as e:
        print(f"Error notificaciones: {e}")
        return []
    finally:
        conn.close()

def marcar_notificaciones_leidas(user_id):
    conn = get_db_connection_auth()
    if not conn: return False
    try:
        query = text("UPDATE notificaciones SET leido = 1 WHERE id_usuario = :uid")
        conn.execute(query, {"uid": user_id})
        conn.commit()
        return True
    except Exception as e:
        print(f"Error marcando leídas: {e}")
        return False
    finally:
        conn.close()

# --- GESTIÓN MANUAL DE ESPACIOS (GESTOR) ---

def cambiar_estado_espacio(id_espacio, nuevo_estado):
    conn = get_db_connection_auth()
    if not conn: return False
    try:
        # Actualizamos el estado directamente
        query = text("UPDATE espacio SET estado_espacio = :estado WHERE id_espacio = :id")
        conn.execute(query, {"estado": nuevo_estado, "id": id_espacio})
        conn.commit()
        return True
    except Exception as e:
        print(f"Error cambiando estado: {e}")
        return False
    finally:
        conn.close()
        # --- AGREGAR AL FINAL DE DATABASE.PY ---

def buscar_usuario_scan(dato, id_edificio_gestor):
    """
    Busca un usuario por DNI, Código o Placa.
    Retorna su info y si tiene alguna asignación activa/espera HOY.
    """
    conn = get_db_connection_auth()
    if not conn: return None
    try:
        # Buscamos coincidencias en Usuario o Vehículos
        query_user = text("""
            SELECT u.id_usuario, u.nombre_usuario, u.dni_usuario, u.id_rol,
                   v.placa_vehiculo, v.modelo_vehiculo, v.tipo_vehiculo
            FROM usuario u
            LEFT JOIN vehiculos v ON u.id_usuario = v.id_usuario
            WHERE u.dni_usuario = :dato 
               OR v.placa_vehiculo = :dato
               OR u.email_usuario LIKE CONCAT(:dato, '%')
            LIMIT 1
        """)
        usuario = conn.execute(query_user, {"dato": dato}).mappings().fetchone()
        
        if not usuario: return None
        
        # Si existe, buscamos si tiene asignaciones activas (espera/activo)
        # OJO: Filtramos por el edificio del gestor para no mezclar sedes
        query_asignacion = text("""
            SELECT a.id as id_asignacion, a.estado, a.id_espacio,
                   e.numero_espacio, e.piso_espacio
            FROM asignacion a
            JOIN espacio e ON a.id_espacio = e.id_espacio
            WHERE a.id_usuario = :uid
              AND a.estado IN ('espera', 'activo', 'ocupado')
              AND e.id_edificio = :edificio
            LIMIT 1
        """)
        
        asignacion = conn.execute(query_asignacion, {
            "uid": usuario['id_usuario'], 
            "edificio": id_edificio_gestor
        }).mappings().fetchone()

        return {
            "usuario": dict(usuario),
            "asignacion": dict(asignacion) if asignacion else None
        }
    except Exception as e:
        print(f"Error scan: {e}")
        return None
    finally:
        conn.close()

def encontrar_mejor_espacio(id_edificio, tipo_vehiculo):
    """
    Encuentra el primer espacio disponible para el tipo de vehículo.
    Prioriza piso 1.
    """
    conn = get_db_connection_auth()
    if not conn: return None
    try:
        # Mapeo simple: si es camioneta, usa espacio de auto
        tipo_busqueda = 'vehiculo' if tipo_vehiculo == 'camioneta' else tipo_vehiculo
        
        query = text("""
            SELECT id_espacio, numero_espacio, piso_espacio
            FROM espacio
            WHERE id_edificio = :edificio
              AND estado_espacio = 'disponible'
              AND (tipo_espacio = :tipo OR tipo_espacio = 'vehiculo') -- Flexibilidad
            ORDER BY piso_espacio ASC, numero_espacio ASC
            LIMIT 1
        """)
        espacio = conn.execute(query, {"edificio": id_edificio, "tipo": tipo_busqueda}).mappings().fetchone()
        return dict(espacio) if espacio else None
    finally:
        conn.close()

# En parking_system/database.py

def procesar_movimiento_gestor(accion, id_usuario, id_espacio, id_asignacion=None):
    conn = get_db_connection_auth()
    if not conn: return False, "Error de conexión a BD"
    try:
        if accion == 'entrada_nueva':
            # 1. Buscar el ID del vehículo del usuario (El primero que tenga)
            query_veh = text("SELECT id_vehiculo FROM vehiculos WHERE id_usuario = :uid LIMIT 1")
            vehiculo = conn.execute(query_veh, {"uid": id_usuario}).mappings().fetchone()
            id_vehiculo = vehiculo['id_vehiculo'] if vehiculo else None

            # 2. Insertar asignación CON el vehículo
            query = text("""
                INSERT INTO asignacion (fecha_solicitud, hora_inicio, estado, id_usuario, id_espacio, id_vehiculo)
                VALUES (NOW(), NOW(), 'activo', :uid, :espacio, :veh)
            """)
            conn.execute(query, {"uid": id_usuario, "espacio": id_espacio, "veh": id_vehiculo})
            
            # 3. Ocupar el espacio
            conn.execute(text("UPDATE espacio SET estado_espacio='ocupado' WHERE id_espacio=:id"), {"id": id_espacio})

        elif accion == 'entrada_reserva':
            # Actualizar reserva existente (Espera -> Activo)
            query = text("UPDATE asignacion SET estado='activo', hora_inicio=NOW() WHERE id=:id")
            conn.execute(query, {"id": id_asignacion})
            conn.execute(text("UPDATE espacio SET estado_espacio='ocupado' WHERE id_espacio=:id"), {"id": id_espacio})

        elif accion == 'salida':
            # Finalizar
            query = text("UPDATE asignacion SET estado='finalizado', fecha_fin=NOW() WHERE id=:id")
            conn.execute(query, {"id": id_asignacion})
            conn.execute(text("UPDATE espacio SET estado_espacio='disponible' WHERE id_espacio=:id"), {"id": id_espacio})

        conn.commit()
        return True, "Movimiento registrado correctamente"

    except Exception as e:
            error_msg = str(e)
            
            # LIMPIEZA DE MENSAJES SQL (Para que se vea bonito en el alert)
            if "Reserva duplicada" in error_msg:
                return False, "Error: El usuario ya tiene una reserva o vehículo dentro."
            
            if "El espacio no está disponible" in error_msg:
                return False, "Error: El espacio fue ocupado por otro usuario."

            print(f"Error procesar movimiento: {e}")
            return False, "Error interno de base de datos."
    finally:
            conn.close()

# --- AGREGAR AL FINAL DE DATABASE.PY PARA EL CRUD ---

def crear_usuario_simple(data, bcrypt_instance):
    """Crea un usuario desde el panel de admin (sin vehículo por defecto)"""
    conn = get_db_connection_auth()
    if not conn: return False, "Sin conexión a BD"
    try:
        # Encriptar password
        hashed = bcrypt_instance.generate_password_hash(data['password']).decode('utf-8')
        
        query = text("""
            INSERT INTO usuario (dni_usuario, nombre_usuario, email_usuario, contra_usuario, id_rol)
            VALUES (:dni, :nom, :mail, :pass, :rol)
        """)
        conn.execute(query, {
            "dni": data['dni'], "nom": data['nombre'], 
            "mail": data['email'], "pass": hashed, "rol": data['id_rol']
        })
        conn.commit()
        return True, "Creado"
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def eliminar_usuario_completo(id_usuario):
    """Elimina usuario en cascada (primero dependencias)"""
    conn = get_db_connection_auth()
    if not conn: return False, "Sin conexión"
    try:
        # 1. Borrar notificaciones
        conn.execute(text("DELETE FROM notificaciones WHERE id_usuario = :uid"), {"uid": id_usuario})
        # 2. Borrar historial chatbot
        conn.execute(text("DELETE FROM chatbot_historial WHERE id_usuario = :uid"), {"uid": id_usuario})
        # 3. Borrar asignaciones (historial de parking)
        conn.execute(text("DELETE FROM asignacion WHERE id_usuario = :uid"), {"uid": id_usuario})
        # 4. Borrar vehículos
        conn.execute(text("DELETE FROM vehiculos WHERE id_usuario = :uid"), {"uid": id_usuario})
        # 5. Finalmente borrar usuario
        conn.execute(text("DELETE FROM usuario WHERE id_usuario = :uid"), {"uid": id_usuario})
        
        conn.commit()
        return True, "Eliminado"
    except Exception as e:
        print(f"Error delete: {e}")
        return False, "Error al eliminar (puede tener datos vinculados)"
    finally:
        conn.close()