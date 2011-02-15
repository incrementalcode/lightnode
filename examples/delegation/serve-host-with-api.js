
var http = require('http')
var lightnode = require('../lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the root directory
var website = new lightnode.FileServer('/home/web/www.ngspinners.com')

// before any requests come in

// the delegateRequest function should just return the lightnode.HttpServer object that must emit (handle) the request, or a function to execute as the request listener.
website.delegateRequest = function(req, resp) {

	// 3 - requests starting with path '/api' are sent to the api server
	
	if (req.url.indexOf('/api') == 0)
		return apiHandler
		
	// 4 - serve all other requests with this file server object
	
	else
		return website

}

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// pass all requests to the file server
	website.receiveRequest(req, resp)
	
})


// this is run when the given request must be handled by the API
function apiHandler(req, resp) {
	// I'm a hello world API
	var message = 'hello, world.'
	resp.writeHead(200, {
		'content-type': 'text/plain',
		'content-length': message.length
	})
	resp.write(message)
	resp.end()
}