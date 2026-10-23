import { describe, expect, it } from 'vitest'
import { validateCv, validatePhone, validateRut } from '../utils/validation'

describe('validaciones del formulario', () => {
  it('acepta un RUT válido y rechaza uno incorrecto', () => {
    expect(validateRut('18.456.789-K')).toBe(true)
    expect(validateRut('18.456.789-0')).toBe(false)
  })

  it('valida que el teléfono contenga al menos nueve dígitos', () => {
    expect(validatePhone('+56 9 8765 4321')).toBe(true)
    expect(validatePhone('12345')).toBe(false)
  })

  it('valida el formato y tamaño del currículum', () => {
    const validFile = new File(['contenido'], 'curriculum.pdf', { type: 'application/pdf' })
    const invalidFile = new File(['contenido'], 'curriculum.exe')
    expect(validateCv(validFile)).toBe('')
    expect(validateCv(invalidFile)).toContain('PDF o Word')
    expect(validateCv(null)).toContain('adjuntar')
  })
})

