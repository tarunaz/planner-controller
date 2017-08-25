const express = require('express');
const router = express.Router();
const log = require('tke-logger').getLogger(__filename);
const Promise = require('bluebird');
const env = require('env-var');
const stompit = require('stompit');
const moment = require('moment');

router.use(require('body-parser').json());

const connectOptions = {
  'host': env('AMQ_SERVER', 'amq').asString(),
  'port': 61613,
  'connectHeaders': {
    'host': '/',
    'login': env('AMQ_LOGIN', 'admin').asString(),
    'passcode': env('AMQ_PASSCODE', 'admin').asString(),
    'heart-beat': '5000,5000'
  }
};

router.post('/', function (req, res) {
  const batchNumber = 'planner-queue-' + moment().utc().format('YYYYMMDDHHmmssmmm').toString();
  log.info('publish body', req.body);

  return Promise.each(req.body, (obj) => {
    const sendHeaders = {
        'destination': batchNumber,
        'content-type': 'text/plain',
        'branchNumber': obj.branchNumber,
        'routeNumber': obj.routeNumber,
        'batchNumber': batchNumber
      };
      log.info('header', sendHeaders);
      return new Promise(function(resolve, reject) {
        stompit.connect(connectOptions, function (error, client) {
          if (error) {
            res.status(500).json(error);
            reject(new Error(error));
          } else {
            var frame = client.send(sendHeaders);
            frame.write(JSON.stringify({}));
            frame.end();

            log.info('message sent');
            client.disconnect();
            resolve();
          }
        });
      });
    })
    .then(function () {
      res.json({
        queueName: batchNumber
      });
    })
    .catch((e) => log.error('Error connnecting to amq', e));
});

module.exports = router;

// var subscribeHeaders = {
//   'destination': 'optaplanne r-dev-queue',
//   'ack': 'client-individual'
// };

// client.subscribe(subscribeHeaders, function(error, message) {
//
//   if (error) {
//     console.log('subscribe error ' + error.message);
//     return;
//   }
//
//   message.readString('utf-8', function(error, body) {
//
//     if (error) {
//       console.log('read message error ' + error.message);
//       return;
//     }
//
//     console.log('received message: ' + body);
//
//     client.ack(message);
//
//     client.disconnect();
//   });
// });
//});


