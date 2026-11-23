function MemberService(MemberModel) {
  let service = {
    create,
    findAll,
    findMemberByTaxNumber,
    update,
    removeById,
    findById,
  };

  function create(member) {
    let newUser = MemberModel(member);
    return save(newUser);
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      // do a thing, possibly async, then…
      model.save(function (err) {
        console.log(err);
        if (err) reject("There is a problema with register");

        resolve({
          message: "Member Created",
          member: model,
        });
      });
    });
  }

  function findAll(pagination) {
    const { limit, skip } = pagination;

    return new Promise(function (resolve, reject) {
      MemberModel.find({}, {}, { skip, limit }, function (err, members) {
        if (err) reject(err);

        resolve(members);
      });
    }).then(async (members) => {
      const totalPlayers = await MemberModel.count();

      return Promise.resolve({
        members: members,
        pagination: {
          pageSize: limit,
          page: Math.floor(skip / limit),
          hasMore: skip + limit < totalPlayers,
          total: totalPlayers,
        },
      });
    });
  }

  function findMemberByTaxNumber(taxNumber) {
    return new Promise(function (resolve, reject) {
      MemberModel.findOne({ taxNumber: taxNumber }, function (err, member) {
        if (err) {
          return reject(err);
        }

        if (!member) {
          return reject("Member does not found");
        }

        // Procura o utilizador que tem este memberId
        const User = require("../users/users");

        User.findOne({ memberId: member._id }, function (err, user) {
          if (err) {
            return reject(err);
          }

          resolve({
            member: member,
            user: user
          });
        });
      });
    });
  }

  function update(id, member) {
    return new Promise(function (resolve, reject) {
      MemberModel.findByIdAndUpdate(id, member, function (err, memberUpdated) {
        if (err) console.log(err);
        resolve(memberUpdated);
      });
    });
  }
  function findById(id) {
    return new Promise(function (resolve, reject) {
      MemberModel.findOne({ _id: id }, function (err, member) {
        if (err) reject(err);

        if (!member) {
          reject('Member dont found');
        }
        resolve(member);
      });
    });
  }
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      MemberModel.findByIdAndRemove(id, function (err) {
        if (err)
          reject({
            message: "Does not possible remove",
          });

        resolve();
      });
    });
  }

  return service;
}

module.exports = MemberService;
