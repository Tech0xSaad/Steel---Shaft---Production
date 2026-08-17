import { MachinesRepository } from '../repositories/machines.repository.js'

export class MachinesService {
  static list(query)         { return MachinesRepository.findAll(query) }
  static getById(id)         { return MachinesRepository.findById(id) }
  static create(payload)     { return MachinesRepository.create(payload) }
  static update(id, payload) { return MachinesRepository.update(id, payload) }
  static remove(id)          { return MachinesRepository.delete(id) }
  static dropdown()          { return MachinesRepository.findAllActive() }
}
