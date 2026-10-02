import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createApp } from '../server/app.js'

async function withServer(run) {
  const storageDir = await mkdtemp(path.join(tmpdir(), 'aquachile-test-'))
  const server = createApp({ storageDir }).listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    await run({ baseUrl: `http://127.0.0.1:${port}`, storageDir })
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await rm(storageDir, { recursive: true, force: true })
  }
}

test('informa que la API está disponible', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/salud`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { servicio: 'AquaChile API', estado: 'ok' })
  })
})

test('guarda datos.json y el CV de una solicitud válida', async () => {
  await withServer(async ({ baseUrl, storageDir }) => {
    const form = new FormData()
    const fields = {
      nombre: 'Juan Pérez', identificador: '11.111.111-1', cargo: 'Operador',
      centroTrabajo: 'Planta de prueba', localidad: 'Los Lagos', analista: 'Ana Prueba',
      correoAnalista: 'ana@example.com', familiaCargo: 'Operativo', area: 'Planta de proceso',
      turno: '7x7', fechaInforme: '2026-10-15', observaciones: 'Prueba automatizada',
    }
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    form.append('cv', new Blob(['CV de prueba'], { type: 'application/pdf' }), 'cv-prueba.pdf')

    const response = await fetch(`${baseUrl}/api/evaluaciones`, { method: 'POST', body: form })
    assert.equal(response.status, 201)
    const result = await response.json()
    assert.equal(result.solicitud.estado, 'recibida')

    const folders = await readdir(storageDir)
    assert.equal(folders.length, 1)
    const files = await readdir(path.join(storageDir, folders[0]))
    assert.deepEqual(files.sort(), ['cv.pdf', 'datos.json'])
    const record = JSON.parse(await readFile(path.join(storageDir, folders[0], 'datos.json'), 'utf8'))
    assert.equal(record.nombre, fields.nombre)
    assert.equal(record.identificador, fields.identificador)
    assert.equal(record.cv, 'cv.pdf')
  })
})

test('rechaza una solicitud incompleta', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/evaluaciones`, { method: 'POST', body: new FormData() })
    assert.equal(response.status, 400)
    assert.match((await response.json()).error, /Faltan campos obligatorios/)
  })
})

test('recibe una postulación externa con consentimiento', async () => {
  await withServer(async ({ baseUrl, storageDir }) => {
    const form = new FormData()
    const fields = {
      nombre: 'Alexis Mansilla', identificador: '22.222.222-2', correo: 'alexis@example.com',
      telefono: '+56911111111', cargo: 'Técnico/a acuícola', centroTrabajo: 'Centro de cultivo',
      localidad: 'Los Lagos', consentimiento: 'true',
    }
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    form.append('cv', new Blob(['CV externo'], { type: 'application/pdf' }), 'cv.pdf')

    const response = await fetch(`${baseUrl}/api/postulaciones`, { method: 'POST', body: form })
    assert.equal(response.status, 201)
    const folders = await readdir(storageDir)
    const record = JSON.parse(await readFile(path.join(storageDir, folders[0], 'datos.json'), 'utf8'))
    assert.equal(record.tipo, 'postulacion_externa')
    assert.equal(record.consentimiento, true)
  })
})
