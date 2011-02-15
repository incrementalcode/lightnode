
var http = require('http')
var lightnode = require('../lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the root directory
var websites = new lightnode.FileServer('/home/web/')


// before any requests come in, setup the delegation

websites.getChildName = function(req) {
	// delegate based on hostname, remove the port from the host string
	return req.headers.host.split(':')[0]
}

websites.delegateRequest = function(req, resp) {
	// delegate all requests, creating the child server if it doesn't already exist
	return this.getChild(this.getChildName(req))
}

// before any requests come in, customize the server object for one of the virtual domains
var spinnerSite = websites.getChild('www.ngspinners.com')

// override the delegation on this virtual server the same way we do when only serving one host
spinnerSite.delegateRequest = function(req, resp) {

	// 3 - requests starting with path '/api' are sent to the api server
	
	if (req.url.indexOf('/api') == 0)
		return apiHandler
		
	// 4 - serve all other requests with this file server object
	
	else
		// note: accidentally calling receiveRequest when delegating to self will cause an infinite loop
		// perhaps delegate should just return the object to emit the request,
		// if you want to delegate to a non lightnode server (no receiveRequest) then do the redirecting before sending to the server.
		return spinnerSite

}

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// pass all requests to the file server
	websites.receiveRequest(req, resp)
	
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