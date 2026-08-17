import { ProductsRepository } from '../repositories/products.repository.js'

export class ProductsService {
  static list(query)         { return ProductsRepository.findAll(query) }
  static getById(id)         { return ProductsRepository.findById(id) }
  static create(payload)     { return ProductsRepository.create(payload) }
  static update(id, payload) { return ProductsRepository.update(id, payload) }
  static remove(id)          { return ProductsRepository.delete(id) }
  static dropdown()          { return ProductsRepository.findAllActive() }
}
