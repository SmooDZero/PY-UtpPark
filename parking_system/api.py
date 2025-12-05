import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from sqlalchemy import text, create_engine
from flask_bcrypt import Bcrypt
import logging
from sqlalchemy import text, create_engine

# Importamos la lógica del chatbot y la lógica de autenticación
# Busca la línea "from parking_system.database import ..." y cámbiala por esta:
from parking_system.database import (
    registrar_usuario, validar_credenciales, 
    obtener_espacios, obtener_mi_vehiculo,registrar_interaccion, get_db_config_chatbot,
    obtener_stats_admin, listar_todos_usuarios,obtener_alertas_mal_uso,
    obtener_notificaciones_usuario,marcar_notificaciones_leidas,
    cambiar_estado_espacio,crear_usuario_simple, eliminar_usuario_completo,buscar_usuario_scan, encontrar_mejor_espacio, procesar_movimiento_gestor,
    get_db_connection_auth
)
from parking_system.chatbot.engine import ask_chatbot

app = Flask(__name__)

# --- CONFIGURACIÓN DE SEGURIDAD ---
app.secret_key = 'tu_clave_secreta_super_segura' # ¡Cámbiala en producción!
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # 'Lax' permite cookies en CORS con credenciales
app.config['PERMANENT_SESSION_LIFETIME'] = 1800 # La sesión expira en 30 min inactiva
app.config['SESSION_COOKIE_HTTPONLY'] = True # JavaScript no puede leer la cookie (Seguridad)
app.config['SESSION_COOKIE_SECURE'] = False # Ponlo en True si usas HTTPS, False para localhost



# CORS: Importante definir los orígenes exactos para que funcionen las cookies/sesiones
allowed_origins = [ "http://127.0.0.1:5500", "http://localhost:5500","http://localhost:5173", "http://localhost:3000"]
CORS(app, supports_credentials=True, origins=allowed_origins)

bcrypt = Bcrypt(app)
logging.basicConfig(level=logging.INFO)

# ================= RUTAS DE AUTENTICACIÓN =================
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    # --- CORRECCIÓN AQUÍ ---
    # El frontend manda 'usuario' o 'codigo'. Antony esperaba 'email'.
    # Le decimos a Python: "Busca en cualquiera de estos campos"
    identificador = data.get('usuario') or data.get('codigo') or data.get('email')
    password = data.get('password')

    # Pasamos 'identificador' en lugar de 'email' a la base de datos
    usuario_validado = validar_credenciales(identificador, password, bcrypt)

    if usuario_validado:
        session.permanent = True
        session['user_id'] = usuario_validado['id']
        session['user_nombre'] = usuario_validado['nombre']
        session['user_rol'] = usuario_validado['rol']
        session['user_edificio'] = usuario_validado.get('edificio') # Guardamos edificio si es relevante
        
        logging.info(f"Login exitoso: {usuario_validado['email']}")
        
        return jsonify({
            "mensaje": "Bienvenido al sistema",
            "user": usuario_validado
        }), 200
    else:
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"mensaje": "Sesión cerrada correctamente"}), 200

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    # Delegamos la lógica al engine, pasando la instancia de bcrypt
    exito, mensaje = registrar_usuario(data, bcrypt)
    
    if exito:
        return jsonify({"mensaje": mensaje}), 201
    else:
        return jsonify({"error": mensaje}), 400

@app.route('/me', methods=['GET'])
def check_session():
    """Ruta útil para que el Frontend sepa si el usuario sigue logueado al recargar"""
    user_id = session.get('user_id')
    if user_id:
        return jsonify({
            "authenticated": True,
            "user": {
                "id": user_id,
                "nombre": session.get('user_nombre'),
                "rol": session.get('user_rol')
            }
        }), 200
    return jsonify({"authenticated": False}), 401


# ================= RUTAS FUNCIONALES (DASHBOARD) =================

# Busca esta ruta en api.py y actualízala

# En parking_system/api.py

@app.route('/espacios/disponibilidad', methods=['GET'])
@cross_origin(supports_credentials=True)
def disponibilidad():
    # 1. Obtener ID del usuario para filtrar por su edificio
    user_id = session.get('user_id')
    
    # 2. Consultar BD (Ahora trae nombre, placa, id_asignacion...)
    espacios = obtener_espacios(user_id) 

    total = len(espacios)
    disponibles = len([e for e in espacios if e['estado_espacio'] == 'disponible'])
    ocupados = total - disponibles
    
    stats = {
        "total": total,
        "disponibles": disponibles,
        "ocupados": ocupados
    }
    
    # 3. Formatear para el frontend (Mapeo Completo)
    lista = []
    nombre_edificio = "Campus"
    
    if total > 0:
        nombre_edificio = espacios[0]['nombre_edificio']

    for e in espacios:
        lista.append({
            # Datos básicos
            "id": e['id_espacio'],
            "numero": e['numero_espacio'],
            "tipo": e['tipo_espacio'],
            "estado": e['estado_espacio'],
            "ubicacion": e['nombre_edificio'],
            
            # DATOS NUEVOS (Cruciales para el Gestor)
            "ocupante_nombre": e.get('ocupante_nombre'),
            "ocupante_placa": e.get('ocupante_placa'),
            "id_asignacion": e.get('id_asignacion'), # ID de la reserva/asignación activa
            "estado_reserva": e.get('estado_reserva') # 'espera' o 'activo'
        })
        
    return jsonify({
        "espacios": lista, 
        "estadisticas": stats,
        "ubicacion_actual": nombre_edificio
    })

@app.route('/users/profile', methods=['GET'])
def profile():
    user_id = session.get('user_id')
    if not user_id: return jsonify({"error": "No autorizado"}), 401
    
    vehiculo = obtener_mi_vehiculo(user_id)
    
    return jsonify({
        "id": user_id,
        "nombre": session.get('user_nombre'),
        "vehiculo_id": vehiculo['id_vehiculo'] if vehiculo else None,
        "placa": vehiculo['placa_vehiculo'] if vehiculo else None,
        "marca": vehiculo['marca_vehiculo'] if vehiculo else None,
        "modelo": vehiculo['modelo_vehiculo'] if vehiculo else None,
        "tipo": vehiculo['tipo_vehiculo'] if vehiculo else None
    })

# ================= RUTA CHATBOT =================

@app.route("/chatbot/pregunta", methods=["POST"])
def chat_endpoint():
    data = request.get_json() or {}
    
    #RECIBIR DATOS DEL FRONTEND
    pregunta = data.get("pregunta", "").strip()
    id_usuario = data.get("id_usuario")   
    id_edificio = data.get("id_edificio") 

    if not pregunta:
        return jsonify({"respuesta": "Por favor escribe una pregunta."}), 400

    print(f"💬 Pregunta User {id_usuario}: {pregunta}")
    
    try:
        respuesta_bot = ask_chatbot(pregunta, id_usuario, id_edificio)
        
        if id_usuario:registrar_interaccion(id_usuario, pregunta, respuesta_bot)

        return jsonify({
            "respuesta": respuesta_bot,
            "status": "success"
        })

    except Exception as e:
        logging.error(f"Error API Chatbot: {e}")
        return jsonify({"respuesta": "Error interno del servidor."}), 500

@app.route("/chatbot/historial/<int:id_usuario>", methods=["GET"])
def get_historial(id_usuario):
    try:
        _, _, db_uri = get_db_config_chatbot()
        engine = create_engine(db_uri)
        
        # Traemos las últimas 20 conversaciones
        query = text("SELECT pregunta_histo, respuesta_histo FROM chatbot_historial WHERE id_usuario = :uid ORDER BY id_histo DESC LIMIT 20")
        
        history = []
        with engine.connect() as conn:
            result = conn.execute(query, {"uid": id_usuario})
            for row in result:
                history.append({
                    "pregunta": row[0],
                    "respuesta": row[1]
                })
        
        # Invertimos la lista para mostrar cronológicamente
        return jsonify(history[::-1])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= RUTAS DE ADMINISTRADOR =================

@app.route('/admin/dashboard-stats', methods=['GET'])
@cross_origin(supports_credentials=True)  # <--- AGREGAR ESTO
def admin_stats():
    # Verificamos si es admin/gestor (roles 1 y 4)
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    stats = obtener_stats_admin()
    if stats:
        return jsonify(stats)
    return jsonify({"error": "Error al obtener estadísticas"}), 500

@app.route('/admin/users', methods=['GET'])
@cross_origin(supports_credentials=True)  # <--- AGREGAR ESTO
def list_users_route():
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    users = listar_todos_usuarios()
    return jsonify(users)

@app.route('/admin/alertas', methods=['GET'])
@cross_origin(supports_credentials=True)  # <--- AGREGAR ESTO
def get_alertas():
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    alertas = obtener_alertas_mal_uso()
    return jsonify(alertas)

@app.route('/notifications', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_notifications():
    user_id = session.get('user_id')
    if not user_id: return jsonify([]), 200 # Si no hay sesión, devolvemos lista vacía
    
    notis = obtener_notificaciones_usuario(user_id)
    # Contamos cuántas no leídas hay para el puntito rojo
    no_leidas = len([n for n in notis if n['leido'] == 0])
    
    return jsonify({"lista": notis, "pendientes": no_leidas})

@app.route('/notifications/read', methods=['POST'])
@cross_origin(supports_credentials=True)
def mark_read():
    user_id = session.get('user_id')
    if not user_id: return jsonify({"error": "No login"}), 401
    
    marcar_notificaciones_leidas(user_id)
    return jsonify({"success": True})


@app.route('/gestor/cambiar-estado', methods=['POST'])
@cross_origin(supports_credentials=True)
def toggle_espacio():
    # Seguridad: Solo Gestores (Rol 4) o Admin (Rol 1)
    # (Opcional: puedes comentar este if si quieres probar rápido sin login)
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    data = request.get_json()
    id_espacio = data.get('id_espacio')
    nuevo_estado = data.get('nuevo_estado') # 'ocupado' o 'disponible'
    
    if not id_espacio or not nuevo_estado:
        return jsonify({"error": "Faltan datos"}), 400
        
    exito = cambiar_estado_espacio(id_espacio, nuevo_estado)
    
    if exito:
        return jsonify({"mensaje": "Estado actualizado"})
    else:
        return jsonify({"error": "Error al actualizar en BD"}), 500
    



# --- RUTAS GESTOR (SCANNER) ---
from parking_system.database import (
    buscar_usuario_scan, encontrar_mejor_espacio, procesar_movimiento_gestor
)

@app.route('/gestor/scan', methods=['POST'])
@cross_origin(supports_credentials=True)
def scan_usuario():
    if 'user_id' not in session: return jsonify({"error": "No login"}), 401
    
    # Recuperamos el edificio del gestor (Por defecto 2 - Arequipa si no hay sesión)
    id_edificio_gestor = session.get('user_edificio', 2) 

    data = request.get_json()
    codigo = data.get('codigo')
    
    # Buscamos al usuario y sus reservas GLOBALES (en cualquier sede)
    resultado = buscar_usuario_scan(codigo, id_edificio_gestor)
    
    if not resultado:
        return jsonify({"encontrado": False, "mensaje": "Usuario/Placa no existe"}), 404
        
    usuario = resultado['usuario']
    asignacion = resultado['asignacion']
    
    respuesta = {
        "encontrado": True,
        "usuario": {
            "id": usuario['id_usuario'],
            "nombre": usuario['nombre_usuario'],
            "rol": usuario['id_rol'],
            "placa": usuario['placa_vehiculo'] or "Sin Auto",
            "modelo": usuario['modelo_vehiculo']
        },
        "accion_sugerida": "ninguna",
        "datos_accion": {}
    }
    
    # --- LÓGICA DE MÁQUINA DE ESTADOS ---
    if asignacion:
        # CASO B (Tiene Reserva) o CASO C (Ya está dentro)
        estado = asignacion['estado']
        
        # AQUÍ ESTÁ EL CAMBIO CLAVE: Enviamos datos de ubicación
        respuesta['datos_accion'] = {
            "id_asignacion": asignacion['id_asignacion'],
            "espacio_nro": asignacion['numero_espacio'],
            "espacio_id": asignacion['id_espacio'],
            "nombre_edificio": asignacion.get('nombre_edificio'), # <--- NUEVO
            "id_edificio": asignacion.get('id_edificio')          # <--- NUEVO
        }
        
        if estado == 'espera':
            respuesta['accion_sugerida'] = 'confirmar_ingreso'
        elif estado in ['activo', 'ocupado']:
            respuesta['accion_sugerida'] = 'registrar_salida'
            
    else:
        # CASO A (Ingreso Nuevo) -> Buscamos espacio automático EN MI EDIFICIO
        mejor_espacio = encontrar_mejor_espacio(id_edificio_gestor, usuario['tipo_vehiculo'])
        
        if mejor_espacio:
            respuesta['accion_sugerida'] = 'ingreso_nuevo'
            respuesta['datos_accion'] = {
                "espacio_id": mejor_espacio['id_espacio'],
                "espacio_nro": mejor_espacio['numero_espacio']
            }
        else:
            respuesta['accion_sugerida'] = 'lleno' 
            
    return jsonify(respuesta)


@app.route('/gestor/ejecutar-accion', methods=['POST'])
@cross_origin(supports_credentials=True)
def ejecutar_accion():
    data = request.get_json()
    exito, msg = procesar_movimiento_gestor(data.get('tipo'), data.get('id_usuario'), data.get('id_espacio'), data.get('id_asignacion'))
    if exito: return jsonify({"mensaje": msg})
    return jsonify({"error": msg}), 500
    


# ================= RUTAS CRUD USUARIOS =================

@app.route('/admin/users/create', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_user_route():
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    data = request.get_json()
    # Usamos la misma instancia bcrypt que ya tienes creada arriba en api.py
    exito, msg = crear_usuario_simple(data, bcrypt)
    
    if exito: return jsonify({"mensaje": msg})
    return jsonify({"error": msg}), 400

@app.route('/admin/users/delete/<int:uid>', methods=['DELETE'])
@cross_origin(supports_credentials=True)
def delete_user_route(uid):
    if 'user_id' not in session: return jsonify({"error": "No autorizado"}), 401
    
    # Evitar que el admin se borre a sí mismo
    if uid == session['user_id']:
        return jsonify({"error": "No puedes eliminar tu propia cuenta"}), 400

    exito, msg = eliminar_usuario_completo(uid)
    
    if exito: return jsonify({"mensaje": msg})
    return jsonify({"error": msg}), 500






if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)