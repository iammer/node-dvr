var _=require('underscore');
var stream=require('stream');
var binary=require('binary');

var H264Stripper=function(inStream) {
	this.inStream=inStream;
	var self=this;
    
	inStream.on('end',_.bind(function() {
		console.log('InStream end');
		this.emit('end');
	},this));
	
	this.on('end',function() {
		self.ender();
		inStream.destroy();
	});
    
	inStream.pipe(binary()
		.loop(function(end,vars) {
			self.ender=end;
			this
			.scan('junk','dcH264')
			.word32lu('chunkSize')
			.word32lu('headerSize')
			.tap(function(vars) {
				vars['headerSize']+=8;
				this
				.buffer('header','headerSize')
				.buffer('data','chunkSize')
				.tap(function(vars) {
					var junk=vars['junk'];
					self.emit('chunk',junk.string('ascii',junk.length-1),vars['data']);
				});
			});
		})
	);
    
};

H264Stripper.prototype.close=function() {
	if (this.ender) this.ender();
	this.inStream.destroy();
}

var H264RawStream=function(inStream) {
	stream.Stream.call(this);
	this.readable=true;
	this.writable=false;
	
	this.h264Stripper=new H264Stripper(inStream);

	this.on('end',_.bind(function() {
		this.h264Stripper.close();
	},this));
	
	this.h264Stripper.on('end',_.bind(function() {
		this.emit('end');
	},this));
	
	this.h264Stripper.on('chunk',_.bind(function(chunkType,data) {
		this.emit('data',data);
	},this));
	
};
	
H264RawStream.prototype = Object.create(stream.Stream.prototype, { constructor: { value: H264RawStream }});


var H264FLVStream=function(inStream) {
	stream.Stream.call(this);
	this.readable=true;
	this.writable=false;
	
	this.h264Stripper=new H264Stripper(inStream);

	this.on('end',_.bind(function() {
		this.h264Stripper.close();
	},this));
	
	this.h264Stripper.on('end',_.bind(function() {
		this.emit('end');
	},this));
	
	this.h264Stripper.on('chunk',_.bind(function(chunkType,data) {
		this.emit('data',data);
	},this));
	
};

	
H264FLVStream.prototype = Object.create(stream.Stream.prototype, { constructor: { value: H264FLVStream }});

/*_.extend(H264FLVStream.prototype,{
	header: new Buffer([0x46,0x4c,0x56,0x01,0x01,0,0,0,0x09]),
	writeString: function(s) {
		var buf=new Buffer(s.length);
		buf.write(s,2);
		buf.writeUInt16BE(s.length,0);
		this.emit('data',buf);
	},
	
});*/

module.exports={
	H264Stripper: H264Stripper,
	H264RawStream: H264RawStream,
	H264FLVStream: H264FLVStream
};
