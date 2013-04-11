#!/usr/bin/env node

var net=require('net');
var fs=require('fs');
var cp=require('child_process');

var channel=process.argv[2];
channel=1<<(channel-1);
channel=(channel<16?'0':'') + channel.toString(16);

//var hStream=process.stdout;
//''
//
var child=cp.spawn('mplayer',['-fps','30.1','-demuxer','h264es','-'],{stdio: ['pipe',process.stdout,process.stderr], encoding: 'binary'});

var hStream=child.stdin;

var dvr=net.createConnection({host: '10.0.0.21', port: '9000'});

dvr.on('connect',function() {
	child.on('exit',function() {
		dvr.end();
		process.exit();
	});
	
	var bytesLeft=0;
	hStream.on('error',function() {
		dvr.end();
	});
	
	dvr.on('data',function(d) {
		if (bytesLeft<=0) {
			if (d.slice(2,4).toString('utf8')=='dc') {
				bytesLeft=d.readUInt32LE(8);
				var headerSize=d.readUInt32LE(12) + 0x18;
				if (d.length<bytesLeft+headerSize) {
					hStream.write(d.slice(headerSize));
					bytesLeft-=(d.length-headerSize);
				} else {
					hStream.write(d.slice(headerSize,bytesLeft+headerSize));
					bytesLeft=0;
				}
			}
		} else {
			if (d.length<bytesLeft) {
				hStream.write(d);
				bytesLeft-=d.length;
			}  else {
				hStream.write(d.slice(0,bytesLeft));
				bytesLeft=0;
			}
			
		}
		//console.log('Writing...');
	});
	
	var getStream=new Buffer(
	'00000000000000000000010000000304' + 
	'00000000000000000000680000000100' +
	'000010000000' + channel + '000000010000000061' +
	'646d696e000000094060200000000022' +
	'0100000000000000cf112000000e0100' +
	'02917c0400000048070e0100000e0190' +
	'113501e4f012000000000028f3120000' + 
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'0000000000000000000000','hex');
	
	dvr.write(getStream);
});
