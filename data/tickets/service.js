function TicketService(TicketModel) {
    let service = {
      create,
      find,
      findAll,
      findTicketsByGame,
      update,
      removeById,
    };
  
    function create(ticket) {
      let newTicket = TicketModel(ticket);
      return save(newTicket);
    }
  
    function save(model) {
      return new Promise(function (resolve, reject) {
        // do a thing, possibly async, then…
        model.save(function (err) {
          if (err) reject("There is a problema with register");
  
          resolve({
            message: "Ticket Created",
            ticket: model,
          });
        });
      });
    }

    function find(id) {
      return new Promise(function (resolve, reject) {
        TicketModel.findById(id, function (err, ticket) {
          if (err) return reject(err);
          if (!ticket) return reject("Ticket not found");
          resolve(ticket);
        });
      });
    }

    function findAll(pagination = { limit: 10, skip: 0 }) {
      const { limit, skip } = pagination;

      return new Promise(function (resolve, reject) {
        TicketModel.find({}, {}, { skip, limit }, function (err, tickets) {
          if (err) reject(err);
          resolve(tickets);
        });
      }).then(async (tickets) => {
        const total = await TicketModel.countDocuments();
        return {
          tickets,
          pagination: {
            pageSize: limit,
            page: Math.floor(skip / limit),
            hasMore: skip + limit < total,
            total,
          },
        };
      });
    }
  
    function findTicketsByGame(gameId) {
      return new Promise(function (resolve, reject) {
        TicketModel.find({ gameId }, function (err, member) {
          if (err) reject(err);
          //object of all users
  
          if (!member) {
            reject("Tickets dont found");
          }
          resolve(member);
        });
      });
    }
  
    function update(id, ticket) {
      return new Promise(function (resolve, reject) {
        TicketModel.findByIdAndUpdate(id, ticket, function (err, ticketUpdated) {
          if (err) reject('Dont updated Ticket');
          resolve(ticketUpdated);
        });
      });
    }
  
    function removeById(id) {
      return new Promise(function (resolve, reject) {
        TicketModel.findByIdAndRemove(id, function (err) {
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
  
  module.exports = TicketService;
  