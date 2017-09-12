const express = require('express');
const router = express.Router();
const log = require('tke-logger').getLogger(__filename);
const Promise = require('bluebird');
const env = require('env-var');
const stompit = require('stompit');
const moment = require('moment');
const hbs = require('handlebars');
const AMQ_LOGIN = env('AMQ_LOGIN', 'admin').asString();
const AMQ_PASSCODE = env('AMQ_PASSCODE', 'admin').asString();
const PLANNER_CONTROLLER_AMQ = env('PLANNER_CONTROLLER_AMQ', 'planner-controller-amq-dev').asString();
router.use(require('body-parser').json());

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectOptions = {
  'host': env('AMQ_SERVER', 'amq').asString(),
  'port': 61612,
  'ssl': true,
  'connectHeaders': {
    'host': '/',
    'login': AMQ_LOGIN,
    'passcode': AMQ_PASSCODE,
    'heart-beat': '5000,5000'
  }
};
const plannerJobJson = hbs.compile(JSON.stringify(require('fixtures/planner-job')));
const DEFAULTS = {
  json: true,
  method: 'POST',
  timeout: 20000
};
const request = Promise.promisify(
  require('request').defaults(DEFAULTS)
);

router.post('/', function (req, res) {
  const batchNumber = 'planner-queue-' + moment().utc().format('YYYYMMDDHHmmssms').toString();
  var optaPlannerConfig;
  log.info('publish body', req.body);
  if (req.query && req.query.optaPlannerConfig) {
    optaPlannerConfig = req.query.optaPlannerConfig;
  }
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
      })
      .catch((e) => log.error('Error connnecting to amq', e));
    })
      .then(postToStartKubernatesJob(batchNumber, optaPlannerConfig))
      .then(function () {
        res.json(
          {
            batchNumber: batchNumber,
            data: req.body
          });
      })
    .catch((e) => log.error('Error posting the message', e));
});

module.exports = router;

function postToStartKubernatesJob(queueName, optaPlannerConfig) {
  const data = {
    'planner-queue' : queueName,
    'planner-controller-amq': PLANNER_CONTROLLER_AMQ,
    'amq-login': AMQ_LOGIN,
    'amq-passcode': AMQ_PASSCODE,
    'optaPlannerConfig': optaPlannerConfig
  };

  return request({
    url: env('OPENSHIFT_JOBS_URL', 'https://api.tke.openshift.com:443/apis/batch/v1/namespaces/planner-controller-amq-dev/jobs').asString(),
    headers: {
      'Authorization': env('OPENSHIFT_AUTH_TOKEN', 'Bearer yxvsqqVa3cwM2_StoMetq4HRLukiBDMMZhdqWGgog-U').asString(),
      'Content-Type': 'application/json'
    },
    body: JSON.parse(plannerJobJson(data))
  })
  .catch((e) => log.error('Error creating job in openshift', e));
}

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


