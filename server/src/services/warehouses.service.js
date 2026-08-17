import { WarehousesRepository } from '../repositories/warehouses.repository.js'

export class WarehousesService {
  static list(query)         { return WarehousesRepository.findAll(query) }
  static getById(id)         { return WarehousesRepository.findById(id) }
  static create(payload)     { return WarehousesRepository.create(payload) }
  static update(id, payload) { return WarehousesRepository.update(id, payload) }
  static remove(id)          { return WarehousesRepository.delete(id) }
  static dropdown()          { return WarehousesRepository.findAllActive() }
}
