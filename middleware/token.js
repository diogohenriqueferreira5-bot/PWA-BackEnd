const Users = require('../data/users')

module.exports = (req, res, next) => {
  const token = req.cookies?.token

  console.log('Cookies recebidos:', req.cookies)
  console.log('Token recebido:', token ? 'Sim' : 'Não')

  if (!token) {
    return res.status(401).send({
      auth: false,
      message: 'No token provided.'
    })
  }

  Users.verifyToken(token)
    .then(decoded => {
      req.id = decoded.id
      req.roleUser = decoded.role
      next()
    })
    .catch(err => {
      console.log('Erro ao validar token:', err.message)

      return res.status(401).send({
        auth: false,
        message: 'Not authorized'
      })
    })
}
