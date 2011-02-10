
var http = require('http')
var lightnode = require('code.ngspinners.com/lightnode/lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the root directory
var website = new lightnode.FileServer('/home/web/www.ngspinners.com')

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// 3 - serve all requests with the directory server
	
	website.receiveRequest(req, resp)

})
