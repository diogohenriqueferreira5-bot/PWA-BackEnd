const bodyParser = require('body-parser')
const express = require('express')
const Members = require('../data/member')
const Users = require('../data/users')
const scopes = require('../data/users/scopes')
const VerifyToken = require('../middleware/token')
const cookieParser = require('cookie-parser')
const User = require('../data/users/users')
const Upload = require('../middleware/uploads')

const UsersRouter = io => {
  let router = express()

  router.use(bodyParser.json({ limit: '100mb' }))
  router.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))

  router.use(cookieParser())
  router.use(VerifyToken)

  router
    .route('/')
    .post(Users.autorize([scopes.Admin]), function (req, res) {
      console.log('Create user')

      const body = req.body
      const { role } = body

      if (
        !role ||
        !Array.isArray(role.scope) ||
        !role.scope.includes(scopes.NonMember)
      ) {
        return res.status(401).send({
          auth: false,
          message: 'Only create NonMembers'
        })
      }

      Users.create(body)
        .then(user => {
          io.sockets.emit('admin_notifications', {
            message: 'Add user',
            key: 'User'
          })

          return res.status(201).send(user)
        })
        .catch(err => {
          console.error('Erro ao criar utilizador:', err)

          if (err.code === 11000) {
            return res.status(409).send({
              message: 'Já existe um utilizador com esse nome ou email.'
            })
          }

          if (err.name === 'ValidationError') {
            return res.status(400).send({
              message: 'Dados inválidos.',
              errors: err.errors
            })
          }

          return res.status(500).send({
            message: 'Erro ao criar utilizador.'
          })
        })
    })
    .get(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log('get all users')

      const pageLimit = req.query.limit ? parseInt(req.query.limit) : 5
      const pageSkip = req.query.skip ? pageLimit * parseInt(req.query.skip) : 0

      req.pagination = {
        limit: pageLimit,
        skip: pageSkip
      }

      Users.findAll(req.pagination)
        .then(result => {
          const response = {
            auth: true,
            data: result.data,
            pagination: result.pagination
          }
          res.send(response)
        })
        .catch(err => {
          console.log(err.message)
          next()
        })
    })
  router
    .route('/:userId')
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log('update a member by id')
      let userId = req.params.userId
      let body = req.body

      Users.update(userId, body)
        .then(user => {
          res.status(200)
          res.send(user)
          next()
        })
        .catch(err => {
          res.status(404)
          next()
        })
    })

  router
    .route('/member')
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log('get all tickets')

        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 5
        const pageSkip = req.query.skip
          ? pageLimit * parseInt(req.query.skip)
          : 0

        req.pagination = {
          limit: pageLimit,
          skip: pageSkip
        }

        Members.findAll(req.pagination)
          .then(members => {
            const response = {
              auth: true,
              members: members
            }
            res.send(response)
            next()
          })
          .catch(err => {
            console.log(err.message)
            next()
          })
      }
    )
  router
    .route('/member/:memberId')
    .get(
      Users.autorize([scopes.Admin, scopes.Member]),
      function (req, res, next) {
        let userId = req.params.memberId

        Users.findUserById(userId)
          .then(user => {
            Members.findById(user.memberId).then(member => {
              res.status(200)
              res.send(member)
              next()
            })
          })
          .catch(err => {
            res.status(404)
            next()
          })
      }
    )
  router
    .route('/:userId/member')
    .post(
      Users.autorize([scopes.Admin, scopes.NonMember]),
      function (req, res, next) {
        let body = req.body
        let userId = req.params.userId

        // member update user.
        Upload(req, next)
          .then(path =>
            Members.create({
              ...body,
              photo: path
            })
          )
          .then(result => {
            return Users.update(userId, {
              memberId: result.member._id,
              role: {
                name: 'Member',
                scope: 'member'
              }
            })
          })
          .then(user => {
            res.status(200)
            res.send(user)
            next()
          })
          .catch(err => {
            console.log('Member already exists!')
            console.log(err)
            err.status = err.status || 500
            res.status(401)
            next()
          })
      }
    )

  router
    .route('/member/tax/:taxNumber')
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log('get the member by tax')

        let taxNumber = req.params.taxNumber

        Members.findMemberByTaxNumber(taxNumber)
          .then(member => {
            res.send(member)
            next()
          })
          .catch(err => {
            console.log(err.message)
            next()
          })
      }
    )

  router
    .route('/perfil')
    .get(
      Users.autorize([scopes.NonMember, scopes.Member]),
      function (req, res, next) {
        console.log('get the perfil of user')
        // the id is get when the token has decoded
        let userId = req.id
        Users.findUserById(userId)
          .then(user => {
            res.status(200)
            res.send({
              data: user
            })
            next()
          })
          .catch(err => {
            console.log('Perfil', err)
            res.status(404)
            next()
          })
      }
    )

  return router
}

module.exports = UsersRouter
