import { RawMaterialsRepository } from '../repositories/rawMaterials.repository.js'

export class RawMaterialsService {
  static list(query)         { return RawMaterialsRepository.findAll(query) }
  static getById(id)         { return RawMaterialsRepository.findById(id) }
  static create(payload)     { return RawMaterialsRepository.create(payload) }
  static update(id, payload) { return RawMaterialsRepository.update(id, payload) }
  static remove(id)          { return RawMaterialsRepository.delete(id) }
  static dropdown()          { return RawMaterialsRepository.findAllActive() }
}
