#!/usr/bin/env node

var net=require('net');

var nextId=0;
var server=net.createServer(function(sockIn) {
	var connectionId=nextId++;
	console.log('==============' + connectionId);
	
	
	var sockOut=net.createConnection({port: 9000, host: '10.0.0.21'});

	sockIn.on('end',function() {
		console.log('>++++++++++++++' + connectionId);
		sockOut.end();
	});
	
	sockOut.on('end',function() {
		console.log('<++++++++++++++' + connectionId);
		sockIn.end();
	});
	
	sockIn.on('error',function() {
		console.log('>++++++++++++++' + connectionId);
		sockOut.end();
	});
	
	sockOut.on('error',function() {
		console.log('<++++++++++++++' + connectionId);
		sockIn.end();
	});
	
	
	sockIn.on('data',function(d) {
		console.log('>>>>>>>>>>>>>>' + connectionId);
		console.log(formatForDisplay(d));
		sockOut.write(d);
	});
	
	sockOut.on('data',function(d) {
		console.log('<<<<<<<<<<<<<<' + connectionId);
		console.log(formatForDisplay(d));
		sockIn.write(d);
	});
});

server.listen(9000);

function formatForDisplay(buf) {
	var result='';
	var hexString = '';
	var plainString = '';
	for(var i=0;i<buf.length;i++) {
		var b=buf[i];
		hexString+=(b<16?'0':'') + b.toString(16) + ' ';
		plainString+=(b>=32 & b<128)?String.fromCharCode(b):'.';
		
		if (((i+1) & 0xf)==0) {
			result+=hexString + '    ' + plainString + '\n';
			hexString='';
			plainString='';
		}
	}
	
	if (hexString.length>0) {
		while (hexString.length<48) {
			hexString+='   ';
		}
		
		result+=hexString + '    ' + plainString + '\n';
	}
	
	
	return result;
}
	
	