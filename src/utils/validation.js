const allowedCvExtensions = ['pdf', 'doc', 'docx']
const maxCvSize = 10 * 1024 * 1024

export function validateRut(rut) {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (cleaned.length < 8) return false
  const body = cleaned.slice(0, -1)
  const suppliedDigit = cleaned.slice(-1)
  let multiplier = 2
  let sum = 0
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const result = 11 - (sum % 11)
  const expectedDigit = result === 11 ? '0' : result === 10 ? 'K' : String(result)
  return suppliedDigit === expectedDigit
}

export function validatePhone(phone) {
  return phone.replace(/\D/g, '').length >= 9
}

export function validateCv(file) {
  if (!file) return 'Debes adjuntar el currículum.'
  const extension = file.name?.split('.').pop()?.toLowerCase()
  if (!allowedCvExtensions.includes(extension)) return 'El currículum debe estar en formato PDF o Word.'
  if (file.size > maxCvSize) return 'El currículum debe pesar como máximo 10 MB.'
  return ''
}

export function validateApplication(form) {
  if (!validateRut(form.identificador)) return 'Ingresa un RUT chileno válido.'
  if (!validatePhone(form.telefono)) return 'Ingresa un teléfono válido de al menos 9 dígitos.'
  return validateCv(form.cv)
}

