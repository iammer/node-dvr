var _=require('underscore');
var stream=require('stream');
var binary=require('binary');

var SCAN_SIZE=1024;
var SCAN_REMAINDER=6;
var STAGE1_HEAD=16;

var H264Stripper=function(inStream,options) {
	this.inStream=inStream;
	var self=this;
    
	inStream.on('end',_.bind(function() {
		console.log('InStream end');
		this.emit('end');
	},this));
	
	inStream.on('readable',_.bind(this.readIn,this));
	
	this.on('end',function() {
		self.ender();
        if (inStream.end) {
			inStream.end();
		}
	});
    
    instream.pipe(binary()
        .loop(function(end,vars) {
            self.ender=end;
            this
                .scan('junk','dcH264')
                .buffer('junk',6)
                .word32lu('chunkSize')
                .word32lu('headerSize')
                .tap(function(vars) {
                    vars['headerSize']+-6;
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

H264Stripper.prototype = Object.create(stream.Readable.prototype, { constructor: { value: H264Stripper }});

H264Stripper.prototype.readIn=function() {
	var buf;
	
	
    
    //console.log('Will read ' + this.readSize + ' bytes');
	while((this.stage!=3 || this.pushable) && (buf=this.inStream.read(this.readSize))) {
		//console.log('Read ' + buf.length + ' bytes for stage: ' + this.stage);
		//console.dir(buf);
		//if (buf.length>10) console.dir(buf.slice(buf.length-10));
		switch(this.stage) {
		case 0:
			var i;
			for(i=0;this.stage==0 && i<=buf.length-SCAN_REMAINDER;i++) {
				if (buf[i]==0x64 && buf[i+1]==0x63 && buf[i+2]==0x48 && buf[i+3]==0x32 && buf[i+4]==0x36 && buf[i+5]==0x34) {
					this.stage=1;
					this.readSize=STAGE1_HEAD;
					i--;
				}
			}
			

			this.inStream.unshift(buf.slice(i));			
			break;
		case 1:
			this.stage=2;
			this.nextChunk=buf.readUInt32LE(6);
			this.readSize=buf.readUInt32LE(10) + 6;
			break;
		case 2:
			this.stage=3;
			this.readSize=this.nextChunk;
			break;
		case 3:
			this.stage=0;
			this.readSize=SCAN_SIZE;
			this.pushable=this.push(buf);
			break;
		}
	}
};
	
H264Stripper.prototype._read=function() {
	if(!this.pushable) {
		this.pushable=true;
		this.readIn();
	}
};

H264Stripper.prototype.close=function() {
	this.push(null);
	if (this.inStream.end) {
		this.inStream.end();
	}
}
	
	
module.exports=H264Stripper;
