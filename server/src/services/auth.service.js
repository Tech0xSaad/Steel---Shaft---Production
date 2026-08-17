import { AuthRepository } from '../repositories/auth.repository.js'
import { logger }         from '../config/logger.js'

/**
 * Business logic layer for authentication.
 * Keeps controllers thin and repositories focused on data access.
 */
export class AuthService {
  static async login(email, password) {
    const { session, user } = await AuthRepository.signInWithPassword(email, password)
    logger.info(`User logged in: ${user.email}`)
    return { session, user }
  }

  static async logout(token) {
    await AuthRepository.signOut(token)
    logger.info('User signed out')
  }

  static async refresh(refreshToken) {
    const { session, user } = await AuthRepository.refreshSession(refreshToken)
    logger.info(`Session refreshed for: ${user.email}`)
    return { session, user }
  }

  static async getProfile(userId) {
    const user = await AuthRepository.getUserById(userId)
    return user
  }
}
