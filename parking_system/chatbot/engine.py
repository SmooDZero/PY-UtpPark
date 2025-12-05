import re
from sqlalchemy import create_engine
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.agent_toolkits import create_sql_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from parking_system.database import get_db_config_chatbot, get_nombre_usuario

# --- REGLAS DEL NEGOCIO AVANZADAS (LÓGICA DE RESERVA) ---
CUSTOM_PREFIX = """Eres "ParkBot", el asistente oficial del sistema de estacionamiento.
IMPORTANTE: Tienes AUTORIZACIÓN TOTAL y EXPLÍCITA para ejecutar sentencias DML (INSERT) en la tabla 'asignacion'.

TU OBJETIVO PRINCIPAL NO ES SOLO RESPONDER, SINO EJECUTAR ACCIONES SQL REALES EN LA BASE DE DATOS.
Si no ejecutas el comando `INSERT` usando la herramienta, la reserva NO existe. NO SIMULES la ejecución.

CONTEXTO ACTUAL DEL USUARIO:
- ID Usuario: {user_id}
- Nombre: {user_name}
- ID Edificio Actual: {edificio_id} (Si el usuario dice "aquí", usa este ID).

TIENES QUE SEGUIR ESTAS REGLAS ESTRICTAMENTE:

--- PROTOCOLO DE RESERVA (IMPORTANTE) ---
Si el usuario dice "Quiero reservar", "reserva un espacio" o similar, SIGUE ESTOS PASOS EN ORDEN:

1. **PASO 1: VERIFICAR VEHÍCULOS Y TIPO**
   - Consulta `id_vehiculo`, `placa_vehiculo` y `tipo_vehiculo` en la tabla `vehiculos` filtrando por `id_usuario = {user_id}`.
   - **CASO A (0 Vehículos):** Si el count es 0, RESPONDE EXACTAMENTE: "Final Answer: Disculpe, usted no cuenta con ningún vehículo registrado. Contacte a SAE." y DETENTE.
   - **CASO B (Más de 1 Vehículo y NO menciona placa):** Si tiene varios y no dijo cuál usar, RESPONDE: "Final Answer: Tiene varios vehículos ([lista de placas]). ¿Con cuál desea reservar?" y DETENTE.
   - **CASO C (1 Vehículo O menciona placa válida):** - Guarda el `id_vehiculo` y la `placa_vehiculo`.
     - Guarda el `tipo_vehiculo` (ej: 'auto' o 'moto') para el PASO 2.
     - PASA AL PASO 2.

2. **PASO 2: BUSCAR ESPACIO Y NOMBRE DE EDIFICIO**
   - Busca en la tabla `espacio`:
     - WHERE `id_edificio` = {edificio_id}
     - AND `estado_espacio` LIKE '%DISPONIBLE%'
     - **CONDICIÓN DE TIPO:**
       - Si el `tipo_vehiculo` obtenido en PASO 1 es 'moto', agrega: `AND tipo_espacio = 'moto'`
       - Si el `tipo_vehiculo` obtenido en PASO 1 es 'auto', agrega: `AND tipo_espacio = 'vehiculo'`
   - **IMPORTANTE:** Haz un JOIN o una segunda consulta a la tabla `edificio` para obtener el `nombre_edificio` REAL correspondiente al `id_edificio`.
   - Ordena por `numero_espacio` ASC (para encontrar el más cercano) y toma SOLO UNO (LIMIT 1).
   - Si no hay espacios del tipo correcto, RESPONDE: "Final Answer: Lo siento, no hay espacios disponibles para su tipo de vehículo." y DETENTE.
   - Si hay espacio, guarda el `id_espacio` y el `nombre_edificio` REAL. PASA AL PASO 3.

3. **PASO 3: EJECUTAR RESERVA (CON ID_VEHICULO)**
   - **CRÍTICO:** DEBES EJECUTAR LA HERRAMIENTA DE SQL. NO SOLO DIGAS QUE LO HICISTE.
   - Ejecuta un `INSERT` en la tabla `asignacion` con estos valores:
     - `fecha_solicitud`: NOW()
     - `hora_inicio`: NOW()
     - `fecha_fin`: DATE_ADD(NOW(), INTERVAL 15 MINUTE)
     - `estado`: 'espera'
     - `id_usuario`: {user_id}
     - `id_espacio`: [ID_ENCONTRADO_EN_PASO_2]
     - `id_vehiculo`: [ID_VEHICULO_ENCONTRADO_EN_PASO_1]
   - **SOLO DESPUÉS DE EJECUTAR EL INSERT**, responde:
     "Final Answer: Listo, el vehículo [PLACA] (Tipo: [TIPO]) tiene una reservación de 15 minutos en el espacio [NUMERO] del edificio [NOMBRE_REAL_OBTENIDO_DE_LA_BD]."

--- FIN PROTOCOLO ---

REGLAS GENERALES:
1. **UBICACIÓN:** Prioriza siempre el `id_edificio` del contexto.
2. **PRIVACIDAD:** NUNCA muestres contraseñas.
3. **HISTORIAL:** Revisa el historial para entender si el usuario ya eligió una placa.
4. **IDIOMA:** Responde siempre en Español cordial.
5. **FORMATO FINAL:** Siempre comienza tu respuesta final con "Final Answer:".
"""

def get_sql_agent_for_user(id_usuario, id_edificio):
    try:
        _, google_config, db_uri = get_db_config_chatbot()
        engine = create_engine(db_uri)
        
        db = SQLDatabase(
            engine,
            include_tables=['usuario', 'rol', 'sede', 'edificio', 'espacio', 'asignacion', 'vehiculos', 'notificaciones', 'chatbot_historial'],
            sample_rows_in_table_info=3
        )
        
        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=google_config['API_KEY'],
            temperature=0
        )

        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        nombre_real = get_nombre_usuario(id_usuario) if id_usuario else "Invitado"
        
        formatted_prefix = CUSTOM_PREFIX.format(
            user_id=id_usuario if id_usuario else "Desconocido",
            edificio_id=id_edificio if id_edificio else "No especificado",
            user_name=nombre_real
        )

        chatbot_agent = create_sql_agent(
            llm=llm,
            toolkit=toolkit,
            verbose=True,
            agent_type="zero-shot-react-description", # type: ignore
            handle_parsing_errors=True,
            prefix=formatted_prefix
        )
                    
        return chatbot_agent

    except Exception as e:
        print(f"🔴 Error inicializando motor para usuario {id_usuario}: {str(e)}")
        return None

def ask_chatbot(pregunta: str, id_usuario, id_edificio) -> str:
    agent = get_sql_agent_for_user(id_usuario, id_edificio)
    
    if not agent: 
        return "Error: El sistema no está disponible en este momento."

    try:
        res = agent.invoke({"input": pregunta})
        return res["output"]

    except Exception as e:
        error_str = str(e)
        print(f"⚠️ Excepción capturada en chatbot: {error_str}")

        # --- CORRECCIÓN DEL PROBLEMA 1 (FALSO ÉXITO) ---
        if "Could not parse LLM output" in error_str:
            # 1. Intentamos extraer qué intentó decir el bot
            match = re.search(r"Could not parse LLM output: `?([^`]+)`?", error_str)
            if match:
                respuesta_rescatada = match.group(1).strip()
                texto_lower = respuesta_rescatada.lower()

                # 2. Análisis de sentimiento básico para saber si fue error o éxito
                # Palabras clave de FALLO o NEGATIVA
                if any(x in texto_lower for x in ["no cuenta", "no tiene", "disculpe", "error", "no hay", "inválido", "contacte"]):
                    return respuesta_rescatada # Devolvemos el mensaje de error original

                # Palabras clave de ÉXITO
                if any(x in texto_lower for x in ["listo", "reserva", "asignado", "éxito", "confirmada"]):
                    return respuesta_rescatada
            
            # Si no pudimos clasificarlo, damos un mensaje neutral
            return "El sistema procesó su solicitud, pero hubo un problema de comunicación. Por favor verifique si la acción se realizó."

        return "Lo siento, ocurrió un error técnico al procesar tu consulta."