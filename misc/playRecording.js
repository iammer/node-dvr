#!/usr/bin/env node

var net=require('net');
var fs=require('fs');


var recordingName=process.argv[2];

var out=fs.createWriteStream('out.h264');

var dvr=net.createConnection({host: '10.0.0.21', port: '9000'});

dvr.on('connect',function() {	
	var bytesLeft=0;
	var chunkLeft=0;
	var foundChunk=false;
	var chunkAt=0;
	var stage=0;
	var chunkType='';
	var remainder=false;
	
	dvr.on('data',function(d) {
		stage++;
		if (stage==2) {
			console.log(d.toString('hex'));
			bytesLeft=d.readUInt32LE(0);
		} else if (stage>2) {
			console.log('packetsize: ' + d.length);
			bytesLeft-=d.length;
			if (remainder) {
				console.log('Found remainder');
				var buf=new Buffer(remainder.length + d.length);
				remainder.copy(buf);
				d.copy(buf,remainder.length);
				d=buf;
				remainder=false;
			}
			
			if (!foundChunk) {
				chunkAt=findStart(chunkAt,d);
				console.log('chunkAt: ' + chunkAt + ', chunkLeft: ' + chunkLeft + ', foundChunk: ' + foundChunk);
				if (chunkAt>=0) {
					if (chunkAt+48>d.length) {
						remainder=d.slice(chunkAt);
						chunkAt=0;
					} else {
						chunkType=d.toString('ascii',chunkAt+2,chunkAt+4);
						chunkLeft=d.readUInt32LE(chunkAt+8);
						chunkAt+=d.readUInt32LE(chunkAt+12) + 0x18;
						foundChunk=true;
					}
				} else {
					chunkAt=0;
				}

			}
			
			if (foundChunk) {
				console.log('chunkAt: ' + chunkAt + ', chunkLeft: ' + chunkLeft + ', foundChunk: ' + foundChunk);
							
				while (foundChunk && chunkAt+chunkLeft < d.length) {
					out.write(d.slice(chunkAt,chunkAt+chunkLeft));
					chunkAt+=chunkLeft;
					
					if (chunkAt+48>d.length) {
						remainder=d.slice(chunkAt);
						foundChunk=false;
						chunkAt=0;
					} else {
						chunkAt=findStart(chunkAt,d);
						if (chunkAt>=0) {
							if (chunkAt+48>d.length) {
								remainder=d.slice(chunkAt);
								foundChunk=false;
								chunkAt=0;
							} else {
								chunkType=d.toString('ascii',chunkAt+2,chunkAt+4);
								console.log(chunkType);
								chunkLeft=d.readUInt32LE(chunkAt+8);
								chunkAt+=d.readUInt32LE(chunkAt+12) + 0x18;
							}
						} else {
							foundChunk=false;
							chunkAt=0;
						}
					}
					console.log('chunkAt: ' + chunkAt + ', chunkLeft: ' + chunkLeft + ', foundChunk: ' + foundChunk);
				}
					
				if (foundChunk) {
					out.write(d.slice(chunkAt,d.length));
					chunkLeft-=(d.length-chunkAt);
					chunkAt=0;
				}
				
				console.log('chunkAt: ' + chunkAt + ', chunkLeft: ' + chunkLeft + ', foundChunk: ' + foundChunk);
			}
					
			console.log(bytesLeft);
			if (bytesLeft<=0) {
				dvr.end();
				out.end();
			}
		}
			
	});
	
	var getStream=new Buffer(
	'00000000000000000000010000000705' + 
	'00000000000000000000ac0000000100' +
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
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'00000000000000000000000000000000' +
	'0000000000000000000000','hex');
	
	new Buffer(recordingName,'ascii').copy(getStream,51);
	
	dvr.write(getStream);
});

function findStart(chunkAt,d) {
	for(var i=chunkAt;i<d.length-8;i++) {
		if (d[i+2]==0x64 && d[i+3]==0x63 && d[i+4]==0x48 && d[i+5]==0x32 && d[i+6]==0x36 && d[i+7]==0x34) {
			console.log('Found start: ' + d.toString('ascii',i,i+8));
			return i;
		}
	}
	
	return -1;
}
	
	
	
	