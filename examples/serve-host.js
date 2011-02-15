
// the nodeJS http library
var http = require('http')

// the lightnode library, usually required just as 'lightnode'
var lightnode = require('../lightnode')


// 1 - create and start the nodeJS ip server object
var server = new http.Server(); server.listen(8081)
		
// 2 - create the lightnode file server for the root directory
var website = new lightnode.FileServer('/home/web/www.ngspinners.com')

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// 3 - serve all requests with the directory server
	
	website.receiveRequest(req, resp)

})
