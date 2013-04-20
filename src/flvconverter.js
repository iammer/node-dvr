var cp=require('child_process');

module.exports.convertToFLV=function(h264Stream) {
	var ffmpeg=cp.spawn('ffmpeg',['-r','7','-i','-','-f','flv','-vcodec','copy','-'],{stdio: ['pipe','pipe','ignore']});
	
	h264Stream.on('end',function() {
		ffmpeg.kill();
	});
	
	h264Stream.on('close',function() {
		ffmpeg.kill();
	});
	
	ffmpeg.stdout.on('end',function() {
		if (h264Stream.close) h264Stream.close();
	});
	
	ffmpeg.on('exit',function() {
		if (h264Stream.close) h264Stream.close();
	});
	
	h264Stream.pipe(ffmpeg.stdin);
	
	ffmpeg.stdout.close=function() {
		if (h264Stream.close) h264Stream.close();
		ffmpeg.kill();
	};
	
	return ffmpeg.stdout;
};