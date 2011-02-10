
var http = require('http')
var url = require('url')
var lightnode = require('code.ngspinners.com/lightnode/lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the directory containing all the host root directories (named by their full host name www.mydomain.com)
var websites = new lightnode.FileServer('/home/web/')

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// delegate based on hostname, remove the port from the host string
	var hostName = req.headers.host.split(':')[0]
	
	// 3 - get or create a file server that will have this host name as the last element on it's root directory path
	var hostFileServer = websites.getChild(hostName)
	
	// 4 - send the request to that host's file server
	hostFileServer.receiveRequest(req, resp)
	
})
