# cluster-connection-hive
A clustered server built on socket.io and express to deliver free form connections and routing between endpoint servers and applications

The concept is not meant for beginners and requires you to know Socket.io.

This server manages and balances socket.io client connections spread across multiple clustered socket.io servers and shares any data that gets emitted over the `'evt'` event. 

Procedure:
Once connected via socket.io client, you must register to a room. Any data being emitted on this room by other connected clients will arrive at the client. The room name is completely up to you. 
#### How to Register to a room:

    socket.emit('reg','testRoom');

#### How to Emit data to a room:

    socket.emit('evt',{room:'testRoom',data:{id:'1',msg:'hello!'}});
    //if you were to emit on any other event, the data will never leave the cluster child and not be shared.

#### What makes this so great?
Quick server deployment! Using room names to route data to connected clients allows you then to port messages from multiple apps to their listening endpoints even though the applications using the server does not necessarily have anything to do with each-other. 

#### HOW TO GET GOING

Use `npm install`  in the root directory to install the dependencies required.

Run server using `node server.js` or `npm start`
