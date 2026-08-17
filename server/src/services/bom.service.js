import { BomRepository } from '../repositories/bom.repository.js'

export class BomService {
  static list(query)         { return BomRepository.findAll(query) }
  static getById(id)         { return BomRepository.findById(id) }
  static create(payload)     { return BomRepository.create(payload) }
  static update(id, payload) { return BomRepository.update(id, payload) }
  static remove(id)          { return BomRepository.delete(id) }
}
