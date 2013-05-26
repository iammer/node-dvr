var cp=require('child_process');

module.exports.convert=function(h264Stream,format,file,cb) {
	var ret;
	if (file) {
		var ffmpeg=cp.spawn('ffmpeg',['-y','-r','7','-i','-','-f',format,'-vcodec','copy',file],{stdio: ['pipe','ignore','ignore']});
		
		ret=ffmpeg;
	} else {
		var ffmpeg=cp.spawn('ffmpeg',['-analyzeduration','0','-r','7','-i','-','-f',format,'-vcodec','copy','-'],{stdio: ['pipe','pipe','ignore']});
				
		h264Stream.on('end',function() {
			ffmpeg.kill();
		});
		
		h264Stream.on('close',function() {
			ffmpeg.kill();
		});
		
		ffmpeg.stdout.on('end',function() {
			if (h264Stream.close) h264Stream.close();
		});
		
		ffmpeg.stdout.close=function() {
			if (h264Stream.close) h264Stream.close();
			ffmpeg.kill();
		};

		ret=ffmpeg.stdout;
	}
			
	h264Stream.on('error',function() {
		ffmpeg.kill();
	});
	
	ffmpeg.on('exit',function() {
		if (h264Stream.close) h264Stream.close();
		if (cb) cb();
	});
	
	h264Stream.pipe(ffmpeg.stdin);
	
	return ret;
};

module.exports.convertToFLV=function(h264Stream) {
	return convert(h264Stream,'flv');
};