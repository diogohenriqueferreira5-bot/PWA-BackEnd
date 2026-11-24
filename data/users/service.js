const config = require('../../config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

function UserService (UserModel) {
  let service = {
    create,
    createToken,
    createQrLoginToken,
    findUserByQrLoginToken,
    verifyToken,
    findUser,
    findUserById,
    autorize,
    update,
    findAll
  }

  function create (user) {
    return createPassword(user).then(hashPassword => {
      const newUserWithPassword = {
        ...user,
        password: hashPassword
      }

      const newUser = UserModel(newUserWithPassword)
      return save(newUser)
    })
  }

  function createToken (user) {
    const rawScopes = user.role && user.role.scope

    const roleScopes = Array.isArray(rawScopes)
      ? rawScopes
      : rawScopes
      ? [rawScopes]
      : []

    const token = jwt.sign(
      { id: user._id, name: user.name, role: roleScopes },
      config.secret,
      { expiresIn: config.expiresPassword }
    )

    return { auth: true, token }
  }

  function createQrLoginToken (userId) {
    return jwt.sign({ id: userId, purpose: 'qr-login' }, config.secret, {
      expiresIn: '2m'
    })
  }

  function findUserByQrLoginToken (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.secret, (error, decoded) => {
        if (error || decoded.purpose !== 'qr-login') {
          return reject(new Error('Invalid or expired QR login token'))
        }

        UserModel.findById(decoded.id)
          .then(user => {
            if (!user) {
              return reject(new Error('User not found'))
            }

            resolve(user)
          })
          .catch(reject)
      })
    })
  }

  function verifyToken (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          return reject(err)
        }

        resolve(decoded)
      })
    })
  }

  function save (model) {
    return model
      .save()
      .then(() => {
        return {
          message: 'User saved',
          user: model
        }
      })
      .catch(err => {
        console.error('ERRO AO GUARDAR UTILIZADOR:')
        console.error(err)
        throw err
      })
  }

  function update (id, user) {
    return UserModel.findByIdAndUpdate(id, user, {
      new: true,
      runValidators: true
    })
  }

  function findUser ({ name, password, isQrCode }) {
    return UserModel.findOne({ name }).then(user => {
      if (!user) {
        throw new Error('This data is wrong')
      }

      if (isQrCode) {
        if (user.password !== password) {
          throw new Error('User not valid')
        }

        return user
      }

      return comparePassword(password, user.password).then(match => {
        if (!match) {
          throw new Error('User not valid')
        }

        return user
      })
    })
  }

  function createPassword (user) {
    return bcrypt.hash(user.password, config.saltRounds)
  }

  function comparePassword (password, hash) {
    return bcrypt.compare(password, hash)
  }

  function autorize (scopes) {
    return (request, response, next) => {
      const { roleUser } = request

      if (!roleUser || !Array.isArray(roleUser)) {
        return response.status(403).json({
          message: 'Forbidden - invalid or missing role'
        })
      }

      const hasAutorization = scopes.some(scope => roleUser.includes(scope))

      if (hasAutorization) {
        return next()
      }

      return response.status(403).json({
        message: 'Forbidden'
      })
    }
  }

  function findUserById (id) {
    return UserModel.findById(id, { password: 0 }).then(user => {
      if (!user) {
        throw new Error('User not found')
      }

      return user
    })
  }

  function findAll (pagination = { limit: 10, skip: 0 }) {
    const { limit, skip } = pagination

    return UserModel.find({}, { password: 0 }, { skip, limit }).then(
      async users => {
        const totalUsers = await UserModel.countDocuments()

        return {
          data: users,
          pagination: {
            pageSize: limit,
            page: Math.floor(skip / limit) || 0,
            hasMore: skip + limit < totalUsers,
            total: totalUsers
          }
        }
      }
    )
  }

  return service
}

module.exports = UserService
