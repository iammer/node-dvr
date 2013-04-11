#!/usr/bin/env node

var net=require('net');
var fs=require('fs');

var hStream=process.stdout;//fs.createWriteStream('sample.264');
//var debugStream=fs.createWriteStream('debug.out',{encoding: 'ascii'});

var dvr=net.createConnection({host: '10.0.0.21', port: '9000'});

dvr.on('connect',function() {
	var bytesLeft=0;
	hStream.on('error',function() {
		dvr.end();
	});
	
	dvr.on('data',function(d) {
		//debugStream.write("------------------------\n")
		//debugStream.write(formatForDisplay(d));
		//debugStream.write("------------------------\n")
		//debugStream.write('d.length: ' + (d.length) + "\n");
		if (bytesLeft<=0) {
			if (d.slice(2,4).toString('utf8')=='dc') {
				bytesLeft=d.readUInt32LE(8);
				var headerSize=d.readUInt32LE(12) + 0x18;
				//debugStream.write('bytesLeft: ' + bytesLeft + '\n');
				if (d.length<bytesLeft+headerSize) {
					hStream.write(d.slice(headerSize));
					//debugStream.write('write1: ' + (d.length-headerSize) + '\n');
					bytesLeft-=(d.length-headerSize);
				} else {
					hStream.write(d.slice(headerSize,bytesLeft+headerSize));
					//debugStream.write('write2: ' + (bytesLeft) + '\n');
					bytesLeft=0;
				}
				//debugStream.write('bytesLeft2: ' + bytesLeft + '\n');
			}
		} else {
			if (d.length<bytesLeft) {
				hStream.write(d);
				//debugStream.write('write3: ' + (d.length) + '\n');
				bytesLeft-=d.length;
			}  else {
				hStream.write(d.slice(0,bytesLeft));
				//debugStream.write('write4: ' + (bytesLeft) + '\n');
				bytesLeft=0;
			}
			
			//debugStream.write('bytesLeft4: ' + bytesLeft + '\n');
		}
	});
	
	var getStream=new Buffer(
	'00000000000000000000010000000303' + 
	'00000000000000000000680000000100' +
	'00001000000002000000010000000061' +
	'646d696e000000094060210000000022' +
	'01000000000000094f512100000e0100' +
	'02917c0400000048070e0100000e0188' +
	'1135016cf5120000000000b0f7120000' + 
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



