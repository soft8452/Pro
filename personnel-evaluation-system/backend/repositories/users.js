exports.findByEmail = async (email) => {
  const db = require('../db/knex')
  return db('users')
    .select('id', 'name_th', 'email', 'role', 'password_hash')
    .where({ email })
    .first()
}
