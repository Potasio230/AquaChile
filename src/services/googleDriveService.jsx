import { request, api } from './api'

// La subida ocurre con createApplication: no existe un endpoint público para
// subir archivos arbitrarios ni un token de Google dentro del navegador.
export const consultarIntegracionGoogle = () => request('/integraciones/google')
export const descargarCurriculum = (id) => api.downloadCv(id)
