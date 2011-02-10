
var http = require('http')
var lightnode = require('code.ngspinners.com/lightnode/lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the root directory
var website = new lightnode.FileServer('/home/web/www.ngspinners.com')

// before any requests come in

website.delegateRequest = function(req, resp) {

	// 3 - requests starting with path '/api' are sent to the api server
	
	if (req.url.indexOf('/api') == 0)
		return apiHandler
		
	// 4 - serve all other requests with this file server object
	
	else
		// note: accidentally calling receiveRequest when delegating to self will cause an infinite loop
		// perhaps delegate should just return the object to emit the request,
		// if you want to delegate to a non lightnode server (no receiveRequest) then do the redirecting before sending to the server.
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