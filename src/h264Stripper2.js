var _=require('underscore');
var stream=require('stream');
var binary=require('binary');

var SCAN_SIZE=1024;
var SCAN_REMAINDER=6;
var STAGE1_HEAD=16;

var H264Stripper=function(inStream,options) {
	stream.Stream.call(this,options);
	this.readable=true;
	this.writable=false;
	
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
				.buffer('junk','headerSize')
				.buffer('data','chunkSize')
				.tap(function(vars) {
					self.emit('data',vars['data']);
				});
			});
		})
	);
    
};

H264Stripper.prototype = Object.create(stream.Stream.prototype, { constructor: { value: H264Stripper }});


H264Stripper.prototype.close=function() {
	if (this.ender) this.ender();
	this.inStream.destroy();
}
	
	
module.exports=H264Stripper;
