const config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

function UserService(UserModel) {
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
    findAll,
  };

  function create(user) {
    return createPassword(user).then((hashPassword, err) => {
      if (err) {
        return Promise.reject("Not saved the user");
      }

      let newUserWithPassword = {
        ...user,
        password: hashPassword,
      };

      let newUser = UserModel(newUserWithPassword);
      return save(newUser);
    });
  }

  function createToken(user) {
    // role.scope é o array de permissões
    const rawScopes = user.role && user.role.scope;
    const roleScopes = Array.isArray(rawScopes)
      ? rawScopes
      : rawScopes
        ? [rawScopes]
        : [];

    let token = jwt.sign(
      { id: user._id, name: user.name, role: roleScopes },
      config.secret,
      { expiresIn: config.expiresPassword }
    );

    return { auth: true, token };
  }

  function createQrLoginToken(userId) {
    return jwt.sign(
      { id: userId, purpose: "qr-login" },
      config.secret,
      { expiresIn: "2m" }
    );
  }

  function findUserByQrLoginToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.secret, (error, decoded) => {
        if (error || decoded.purpose !== "qr-login") {
          return reject(new Error("Invalid or expired QR login token"));
        }

        UserModel.findById(decoded.id, (findError, user) => {
          if (findError) return reject(findError);
          if (!user) return reject(new Error("User not found"));
          resolve(user);
        });
      });
    });
  }


  function verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          reject();
        }
        return resolve(decoded);
      });
    });
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      // do a thing, possibly async, then…
      model.save(function (err) {
        if (err) reject("There is a problema with register");

        resolve({
          message: 'User saved',
          user: model,
        });
      });
    });
  }

  function update(id, user) {
    console.log('user', user);
    return new Promise(function (resolve, reject) {
      console.log('user', user);
      UserModel.findByIdAndUpdate(id, user, function (err, userUpdated) {
        if (err) reject('Dont updated User');
        resolve(userUpdated);
      });
    });
  }

  function findUser({ name, password, isQrCode }) {
    return new Promise(function (resolve, reject) {
      UserModel.findOne({ name }, function (err, user) {
        if (err) reject(err);
        //object of all users
        if (!user) {
          reject("This data is wrong");
        }
        resolve(user);
      });
    }).then((user) => {
      if (isQrCode) {
        return user.password === password ? Promise.resolve(user) :
          Promise.reject("User not valid");
      }
      return comparePassword(password, user.password).then((match) => {
        if (!match) return Promise.reject("User not valid");
        return Promise.resolve(user);
      });
    });
  }

  //devolver a password encryptada
  function createPassword(user) {
    return bcrypt.hash(user.password, config.saltRounds);
  }

  //devolver se a password é ou não a mesma
  function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  function autorize(scopes) {
    return (request, response, next) => {
      const { roleUser } = request;

      if (!roleUser || !Array.isArray(roleUser)) {
        return response.status(403).json({ message: "Forbidden - invalid or missing role" });
      }

      const hasAutorization = scopes.some((scope) => roleUser.includes(scope));

      if (hasAutorization) {
        next();
      } else {
        response.status(403).json({ message: "Forbidden" });
      }
    };
  }

  function findUserById(id) {
    return new Promise(function (resolve, reject) {
      UserModel.findById(id, { password: 0 }, function (err, user) {
        if (err) reject(err);
        if (!user) reject('User not found');
        resolve(user);
      });
    });
  }

  function findAll(pagination = { limit: 10, skip: 0 }) {
    const { limit, skip } = pagination;

    return new Promise(function (resolve, reject) {
      UserModel.find({}, { password: 0 }, { skip, limit }, function (err, users) {
        if (err) reject(err);
        resolve(users);
      });
    }).then(async (users) => {
      const totalUsers = await UserModel.countDocuments();

      return {
        data: users,
        pagination: {
          pageSize: limit,
          page: Math.floor(skip / limit) || 0,
          hasMore: skip + limit < totalUsers,
          total: totalUsers,
        },
      };
    });
  }

  return service;
}

module.exports = UserService;
