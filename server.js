const WebSocket = require('ws');
var net = require('net');
const PORT = 5000;

const cmd = require("node-cmd");
const express = require('express');
const app = express();
app.listen(PORT, () => console.log('SSE app listening on port 80!'));
app.post('/git', (req, res) => {
  // If event is "push"
  if (req.headers['x-github-event'] == "push") {
  cmd.runSync('chmod 777 git.sh'); /* :/ Fix no perms after updating */
  cmd.runSync('./git.sh', (err, data) => {  // Run our script
    if (data) console.log(data);
    if (err) console.log(err);
  });
  cmd.run('refresh');  // Refresh project

  console.log("> [GIT] Updated with origin/master");
}

  return res.sendStatus(200); // Send back OK status
});

const wsServer = new WebSocket.Server({
    port: process.env.PORT
});

wsServer.on('connection', function (socket,req) {
    
    var client = new net.Socket();
      client.connect(10801, "0.0.0.0", function() {
    });

    socket.client = client;
    client.socket = socket;
  
    client.on('data', function(data) { // 'data' is an event handler for the client socket, what the server sent
        try {
			client.socket.send(data);
				}
			catch(err) {
  
			}
    });
	client.on("error", function(error) {
  
    console.log("client.error");
    });
	client.on("end", function(error) {
    
    console.log("client.end");
    });
	client.on("close", function(error) {
    
	client.socket.close();
    console.log("client.close");
    });

    socket.on('message', function (msg) {
        //console.log("Received message from client: "  + msg);
         try {
            socket.client.write(msg);
          }
          catch(err) {
  
          }
        
    });

    socket.on("error", function(error) {
    
    console.log("socket.error");
    });
	socket.on("close", function(error) {
    
    console.log("socket.close");
    });
	socket.on("end", function(error) {
   
   console.log("socket.end");
    });
  


});





console.log( (new Date()) + " Server is listening on port " + PORT);

//--------------------------------
function formatIPv4(buffer) {
  // buffer.length == 4
  return buffer[0] + '.' + buffer[1] + '.' + buffer[2] + '.' + buffer[3];
}

function formatIPv6(buffer) {
  // buffer.length == 16
  var parts = [];
  for (var i = 0; i < 16; i += 2) {
    parts.push(buffer.readUInt16BE(i).toString(16));
  }
  return parts.join(':');
}

/**
Returns an object with three properties designed to look like the address
returned from socket.address(), e.g.:

    { family: 'IPv4', address: '127.0.0.1', port: 12346 }
    { family: 'IPv6', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }
    { family: 'domain', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }

The given `type` should be either 1, 3, or 4, and the `buffer` should be
formatted according to the SOCKS5 specification.
*/
function readAddress(type, buffer) {
  if (type == 1) {
    // IPv4 address
    return {
      family: 'IPv4',
      address: formatIPv4(buffer),
      port: buffer.readUInt16BE(4),
    };
  }
  else if (type == 3) {
    // Domain name
    var length = buffer[0];
    return {
      family: 'domain',
      address: buffer.slice(1, length + 1).toString(),
      port: buffer.readUInt16BE(length + 1),
    };
  }
  else if (type == 4) {
    // IPv6 address
    return {
      family: 'IPv6',
      address: formatIPv6(buffer),
      port: buffer.readUInt16BE(16),
    };
  }
}

var server = net.createServer(function(socket) {
  socket.once('data', function(greeting) {
    var socks_version = greeting[0];
    if (socks_version === 4) {
      var address = {
        port: greeting.slice(2, 4).readUInt16BE(0),
        address: formatIPv4(greeting.slice(4)),
      };
      // var user = greeting.slice(8, -1).toString();
      net.connect(address.port, address.address, function() {
        // the socks response must be made after the remote connection has been
        // established
        socket.pipe(this).pipe(socket);
        socket.write(Buffer.from([0, 0x5a, 0,0, 0,0,0,0]));
      });
    }
    else if (socks_version === 5) {
      // greeting = [socks_version, supported_authentication_methods,
      //             ...supported_authentication_method_ids]
      socket.write(Buffer.from([5, 0]));
      socket.once('data', function(connection) {

            var address_type = connection[3];
        var address = readAddress(address_type, connection.slice(4));
        var temp = net.connect(address.port, address.address, function() {
          socket.pipe(this).pipe(socket);
          var response = Buffer.from(connection);
         response[1] = 0;
          socket.write(response);
        });
          temp.on('error', function (err) {
              socket.end();
          });
		  
        
      });
    }
  })
  .on('error', function(err) {
    console.error('socket error: %s', err.message);
  })
  .on('end', function() {
    socket.end(); // is this unnecessary?
  });
})
.on('listening', function() {
  var address = this.address();
  console.log('server listening on tcp://%s:%d', address.address, address.port);
})
.on('error', function(err) {
  console.error('server error: %j', err);
});

var port = parseInt(10801, 10);
var host = process.env.HOST || '0.0.0.0';
server.listen(port, host);
