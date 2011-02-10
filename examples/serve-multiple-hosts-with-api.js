
var http = require('http')
var lightnode = require('code.ngspinners.com/lightnode/lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the root directory
var websites = new lightnode.FileServer('/home/web/')

// intercept all requests as usual
server.addListener('request', function(req, resp) {
	
	var hostName = req.headers.host.split(':')[0]
	
	// 3 - we only want to insert special handling if the request is for a certain host
	if (hostName == 'www.ngspinners.com') {
	
		// 4 - requests to path '/api' on this host are sent to the api server
		if (req.url.indexOf('/api') == 0) {
		
			// 5 - a return statement prevents the rest of this function's handling from taking place
			return apiHandler(req, resp)
			
		}
	
	}
	
	// for all requests not completed above do the virtual host processing as usual
	
	// 6 - get or create a file server that will have this host name as the last element on it's root directory path
	var hostFileServer = websites.getChild(hostName)
	
	// 7 - send the request to that host's file server
	hostFileServer.receiveRequest(req, resp)

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