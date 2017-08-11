var stompit = require('stompit');

var express = require('express');
var router = express.Router();
const log = require('tke-logger').getLogger(__filename);
router.use(require('body-parser').json());

var connectOptions = {
  'host': 'amq',
  'port': 61613,
  'connectHeaders': {
    'host': '/',
    'login': 'admin',
    'passcode': 'admin',
    'heart-beat': '5000,5000'
  }
};

router.post('/:branchNumber/:routeNumber/:batchNumber', function (req, res) {

  log.info('Publish function  Branch number', req.params.branchNumber);
  log.info('Publish function  routeNumber ', req.params.routeNumber);
  log.info('Publish function  batchNumber ', req.params.batchNumber);
  log.info('publish body', req.body);

  var sendHeaders = {
    'destination': 'planner-queue',
    'content-type': 'text/plain',
    'branchNumber': req.params.branchNumber,
    'routeNumber': req.params.routeNumber,
    'batchNumber': req.params.batchNumber
  };
  log.info('header', sendHeaders);
  stompit.connect(connectOptions, function (error, client) {

    if (error) {
      console.log('connect error ' + error.message);
      res.status(500).json(error);
      return;
    }
    var frame = client.send(sendHeaders);
    frame.write(req.body);
    frame.end();

    log.info('message sent');
    client.disconnect();

    res.json({
      message: 'Message posted'
    });

  });
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

