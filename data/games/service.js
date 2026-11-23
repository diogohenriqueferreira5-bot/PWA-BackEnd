function GameService(GameModel) {
  let service = {
    create,
    findAll,
    find,
    findTicketsByDate,
    update,
    removeById,
  };

  function create(game) {
    let newGame = GameModel(game);
    return save(newGame);
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      // do a thing, possibly async, then…
      model.save(function (err) {
        if (err) {
          reject("There is a problema with register");
        } else {
          resolve({
            message: "Game Created",
            game: model,
          });
        }
      });
    });
  }


  function findAll(pagination) {
    const { limit, skip } = pagination;

    return new Promise(function (resolve, reject) {
      GameModel.find({}, {}, { skip, limit }, function (err, games) {
        if (err) reject(err);

        resolve(games);
      });
    }).then(async (games) => {
      const totalGames = await GameModel.count();

      return Promise.resolve({
        games: games,
        pagination: {
          pageSize: limit,
          page: Math.floor(skip / limit),
          hasMore: skip + limit < totalGames,
          total: totalGames,
        },
      });
    });
  }

  function find(id) {
    return new Promise(function (resolve, reject) {
      GameModel.findById(id, function (err, game) {
        if (err) return reject(err);
        if (!game) return reject("Game does not exist");
        resolve(game);
      });
    });
  }

  function findTicketsByDate(date) {
    return new Promise(function (resolve, reject) {
      GameModel.find({ date }, function (err, games) {
        if (err) return reject(err);
        resolve(games);
      });
    });
  }

  function update(id, ticket) {
    return new Promise(function (resolve, reject) {
      GameModel.findByIdAndUpdate(id, ticket, function (err, gameUpdated) {
        if (err) reject('Dont updated Game');
        resolve(gameUpdated);
      });
    });
  }

  function removeById(id) {
    return new Promise(function (resolve, reject) {
      GameModel.findByIdAndRemove(id, function (err) {
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

module.exports = GameService;
