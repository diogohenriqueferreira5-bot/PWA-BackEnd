const config = {
  db: process.env.MONGO_URI,
  secret: process.env.JWT_SECRET,
  expiresPassword: Number(process.env.JWT_EXPIRES_IN || 86400),
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10)
}

module.exports = config
