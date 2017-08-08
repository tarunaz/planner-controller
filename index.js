var stompit = require('stompit');
var http = require('http') ;
var port = 3000;

var connectOptions = {
  'host': 'amq-dev',
  'port': 61613,
  'connectHeaders':{
    'host': '/',
    'login': 'admin',
    'passcode': 'admin',
    'heart-beat': '5000,5000'
  }
};


stompit.connect(connectOptions, function(error, client) {

  if (error) {
    console.log('connect error ' + error.message);
    return;
  }

  var sendHeaders = {
    'destination': 'optaplanner-dev-queue',
    'content-type': 'text/plain',
      'branchNumber': 105700,
      'routeNumber': 'P*114',
      'batchNumber': 'B-123'
  };



  var frame = client.send(sendHeaders);
  frame.write('hello world');
  frame.end();



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
});




const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
});
