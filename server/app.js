import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_STORAGE = path.join(__dirname, 'solicitudes')
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
])

const requiredFields = [
  'nombre', 'identificador', 'cargo', 'centroTrabajo', 'localidad', 'analista',
  'correoAnalista', 'familiaCargo', 'area', 'turno', 'fechaInforme',
]
const requiredApplicationFields = [
  'nombre', 'identificador', 'correo', 'telefono', 'cargo', 'centroTrabajo', 'localidad',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(ALLOWED_MIME_TYPES.has(file.mimetype) ? null : new Error('El CV debe ser PDF o Word.'), ALLOWED_MIME_TYPES.has(file.mimetype))
  },
})

function cleanText(value, maxLength = 300) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function safeSegment(value) {
  return cleanText(value, 80)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'sin-dato'
}

function validate(body, file) {
  const missing = requiredFields.filter((field) => !cleanText(body[field]))
  if (missing.length) return `Faltan campos obligatorios: ${missing.join(', ')}.`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(body.correoAnalista))) return 'El correo del analista no es válido.'
  if (!file) return 'Debe adjuntar el currículum del candidato.'
  return null
}

function buildRecord(body, file, id) {
  return {
    id,
    nombre: cleanText(body.nombre),
    identificador: cleanText(body.identificador),
    cargo: cleanText(body.cargo),
    centroTrabajo: cleanText(body.centroTrabajo),
    localidad: cleanText(body.localidad),
    analista: cleanText(body.analista),
    correoAnalista: cleanText(body.correoAnalista),
    familiaCargo: cleanText(body.familiaCargo),
    area: cleanText(body.area),
    turno: cleanText(body.turno),
    fechaInforme: cleanText(body.fechaInforme),
    observaciones: cleanText(body.observaciones, 3000),
    cv: `cv${ALLOWED_MIME_TYPES.get(file.mimetype)}`,
    fechaRegistro: new Date().toISOString(),
    estado: 'recibida',
  }
}

function validateApplication(body, file) {
  const missing = requiredApplicationFields.filter((field) => !cleanText(body[field]))
  if (missing.length) return `Faltan campos obligatorios: ${missing.join(', ')}.`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(body.correo))) return 'El correo del candidato no es válido.'
  if (body.consentimiento !== 'true') return 'Debe aceptar el tratamiento de datos personales.'
  if (!file) return 'Debe adjuntar el currículum del candidato.'
  return null
}

function buildApplicationRecord(body, file, id) {
  return {
    id,
    tipo: 'postulacion_externa',
    nombre: cleanText(body.nombre),
    identificador: cleanText(body.identificador),
    correo: cleanText(body.correo),
    telefono: cleanText(body.telefono, 30),
    cargo: cleanText(body.cargo),
    centroTrabajo: cleanText(body.centroTrabajo),
    localidad: cleanText(body.localidad),
    consentimiento: true,
    cv: `cv${ALLOWED_MIME_TYPES.get(file.mimetype)}`,
    fechaRegistro: new Date().toISOString(),
    estado: 'postulacion_recibida',
  }
}

export function createApp({ storageDir = process.env.STORAGE_DIR || DEFAULT_STORAGE } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/salud', (_request, response) => {
    response.json({ servicio: 'AquaChile API', estado: 'ok' })
  })

  app.post('/api/evaluaciones', upload.single('cv'), async (request, response, next) => {
    try {
      const validationError = validate(request.body, request.file)
      if (validationError) return response.status(400).json({ error: validationError })

      const id = randomUUID()
      const folderName = `${safeSegment(request.body.nombre)}-${safeSegment(request.body.identificador)}-${id.slice(0, 8)}`
      const candidateDir = path.join(storageDir, folderName)
      const record = buildRecord(request.body, request.file, id)

      await mkdir(candidateDir, { recursive: false })
      await Promise.all([
        writeFile(path.join(candidateDir, 'datos.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8'),
        writeFile(path.join(candidateDir, record.cv), request.file.buffer),
      ])

      return response.status(201).json({
        mensaje: 'Solicitud recibida correctamente.',
        solicitud: { id, carpeta: folderName, estado: record.estado },
      })
    } catch (error) {
      return next(error)
    }
  })

  app.post('/api/postulaciones', upload.single('cv'), async (request, response, next) => {
    try {
      const validationError = validateApplication(request.body, request.file)
      if (validationError) return response.status(400).json({ error: validationError })

      const id = randomUUID()
      const folderName = `postulacion-${safeSegment(request.body.nombre)}-${safeSegment(request.body.identificador)}-${id.slice(0, 8)}`
      const candidateDir = path.join(storageDir, folderName)
      const record = buildApplicationRecord(request.body, request.file, id)

      await mkdir(candidateDir, { recursive: false })
      await Promise.all([
        writeFile(path.join(candidateDir, 'datos.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8'),
        writeFile(path.join(candidateDir, record.cv), request.file.buffer),
      ])

      return response.status(201).json({
        mensaje: 'Postulación recibida correctamente.',
        solicitud: { id, carpeta: folderName, estado: record.estado },
      })
    } catch (error) {
      return next(error)
    }
  })

  app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({ error: 'El CV supera el máximo de 10 MB.' })
    }
    if (error.message === 'El CV debe ser PDF o Word.') {
      return response.status(415).json({ error: error.message })
    }
    console.error(error)
    return response.status(500).json({ error: 'Ocurrió un error interno al guardar la solicitud.' })
  })

  return app
}
