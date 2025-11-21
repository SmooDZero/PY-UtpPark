const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Inicializar Google Gemini (si está configurado)
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Google Gemini inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error al inicializar Google Gemini:', error.message);
    console.warn('⚠️ El chatbot usará respuestas estáticas');
  }
} else {
  console.log('ℹ️ Google Gemini no configurado. El chatbot usará respuestas estáticas.');
  console.log('ℹ️ Para habilitar IA, agrega GEMINI_API_KEY en el archivo .env');
}
console.log("Modelo creado:", model);

// Base de conocimiento sobre estacionamiento y tránsito
const conocimiento = {
  reglas: [
    {
      pregunta: ['horario', 'horarios', 'cuando', 'hora'],
      respuesta: 'El estacionamiento está disponible de lunes a viernes de 6:00 AM a 10:00 PM. Los fines de semana el acceso es limitado.'
    },
    {
      pregunta: ['reserva', 'reservar', 'reservación'],
      respuesta: 'Los espacios no se pueden reservar con anticipación. Se asignan por orden de llegada y disponibilidad.'
    },
    {
      pregunta: ['tiempo', 'duración', 'cuanto tiempo'],
      respuesta: 'El tiempo máximo de estacionamiento es de 8 horas continuas. Después de este tiempo, el vehículo puede ser retirado.'
    },
    {
      pregunta: ['multa', 'sanción', 'infracción'],
      respuesta: 'El estacionamiento en lugares no autorizados o fuera del espacio asignado puede resultar en multas según el reglamento de tránsito nacional.'
    },
    {
      pregunta: ['discapacitado', 'discapacidad', 'minusvalía'],
      respuesta: 'Los espacios para personas con discapacidad están marcados y requieren credencial especial. Su uso indebido está prohibido por ley.'
    },
    {
      pregunta: ['moto', 'motocicleta'],
      respuesta: 'Las motocicletas deben estacionarse únicamente en los espacios designados para motos. No está permitido estacionar en espacios para autos.'
    },
    {
      pregunta: ['placa', 'documentos', 'requisitos'],
      respuesta: 'Para usar el estacionamiento necesitas: código UTP válido, vehículo registrado con placa vigente y asignación de espacio por parte del gestor.'
    }
  ],
  reglamento: [
    {
      pregunta: ['velocidad', 'límite'],
      respuesta: 'Dentro del estacionamiento el límite de velocidad es de 10 km/h según el reglamento nacional de tránsito.'
    },
    {
      pregunta: ['cinturón', 'seguridad'],
      respuesta: 'El uso de cinturón de seguridad es obligatorio para todos los ocupantes del vehículo, según artículo 178 del reglamento nacional de tránsito.'
    },
    {
      pregunta: ['alcohol', 'bebidas'],
      respuesta: 'Está prohibido conducir bajo los efectos del alcohol. El límite permitido es 0.5 gramos por litro de sangre.'
    },
    {
      pregunta: ['celular', 'teléfono'],
      respuesta: 'Está prohibido usar el celular mientras se conduce. Se debe estacionar para realizar llamadas o enviar mensajes.'
    }
  ]
};

// Función para buscar respuesta estática (fallback)
function buscarRespuestaEstatica(pregunta) {
  const preguntaLower = pregunta.toLowerCase();
  
  // Buscar en reglas de estacionamiento
  for (const regla of conocimiento.reglas) {
    if (regla.pregunta.some(palabra => preguntaLower.includes(palabra))) {
      return regla.respuesta;
    }
  }
  
  // Buscar en reglamento de tránsito
  for (const regla of conocimiento.reglamento) {
    if (regla.pregunta.some(palabra => preguntaLower.includes(palabra))) {
      return regla.respuesta;
    }
  }
  
  // Respuesta por defecto
  return 'Lo siento, solo puedo responder preguntas relacionadas con las reglas del estacionamiento y el reglamento nacional de tránsito. Por favor, reformula tu pregunta o consulta con el gestor del estacionamiento.';
}

// Función para obtener respuesta de Google Gemini
async function obtenerRespuestaGemini(pregunta) {
  if (!model) {
    console.log("Modelo Gemini no inicializado.")
    return null; // Si no hay modelo configurado, retornar null
  }

  // Log para ver la pregunta enviada
  console.log("Pregunta enviada a Gemini:", pregunta);

  try {
    const prompt = `Eres un asistente virtual especializado en estacionamiento y reglamento de tránsito para la Universidad Tecnológica del Perú (UTP).

INSTRUCCIONES:
- Responde SOLO preguntas relacionadas con:
  * Reglas del estacionamiento de la UTP
  * Reglamento nacional de tránsito
  * Normas de seguridad vial
  * Requisitos para usar el estacionamiento

- Si la pregunta NO está relacionada con estos temas, responde amablemente que solo puedes ayudar con temas de estacionamiento y tránsito.

- Sé conciso, claro y profesional.
- Responde en español.
- Si no estás seguro de algo, di que consulten con el gestor del estacionamiento.

INFORMACIÓN DEL ESTACIONAMIENTO:
- Horarios: Lunes a viernes de 6:00 AM a 10:00 PM. Fines de semana acceso limitado.
- Tiempo máximo: 8 horas continuas
- Velocidad máxima: 10 km/h dentro del estacionamiento
- No se pueden reservar espacios con anticipación
- Se requiere código UTP válido y vehículo registrado

PREGUNTA DEL USUARIO: ${pregunta}

RESPUESTA:`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text();

        
    return texto.trim();
  } catch (error) {
    console.error('Error al obtener respuesta de Gemini:', error.message);
    return null; // Retornar null para usar fallback
  }
}

// Función principal para buscar respuesta (híbrida: IA primero, estática como fallback)
async function buscarRespuesta(pregunta) {
  // Intentar con Gemini primero si está configurado
  if (model) {
    const respuestaIA = await obtenerRespuestaGemini(pregunta);
    if (respuestaIA) {
      return respuestaIA;
    }
    // Si falla, continuar con respuesta estática
  }
  
  // Fallback a respuesta estática
  return buscarRespuestaEstatica(pregunta);
}

// Endpoint del chatbot
router.post('/pregunta', authenticateToken, async (req, res) => {
  const { pregunta } = req.body;

  if (!pregunta || pregunta.trim().length === 0) {
    return res.status(400).json({ error: 'La pregunta es requerida' });
  }

  try {
    // Obtener respuesta (IA o estática)
    const respuesta = await buscarRespuesta(pregunta);

    // Guardar en historial
    db.run(
      'INSERT INTO chatbot_history (usuario_id, pregunta, respuesta) VALUES (?, ?, ?)',
      [req.user.id, pregunta, respuesta],
      (err) => {
        if (err) {
          console.error('Error al guardar historial:', err);
        }
      }
    );

    res.json({ respuesta });
  } catch (error) {
    console.error('Error en el chatbot:', error);
    // En caso de error, usar respuesta estática
    const respuestaFallback = buscarRespuestaEstatica(pregunta);
    res.json({ respuesta: respuestaFallback });
  }
});

// Obtener historial del chatbot
router.get('/historial', authenticateToken, (req, res) => {
  db.all(
    `SELECT pregunta, respuesta, created_at 
     FROM chatbot_history 
     WHERE usuario_id = ? 
     ORDER BY created_at DESC 
     LIMIT 20`,
    [req.user.id],
    (err, historial) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener historial' });
      }
      res.json(historial);
    }
  );
});

module.exports = router;

