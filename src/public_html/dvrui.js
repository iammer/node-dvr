var DVRUI=function() {
	this.init();
};

$.extend(DVRUI.prototype,{
	elements: ['loginUser','loginPass','loginButton','loginForm','loading','afterLogin'],
	init: function() {
		var self=this;
		this.isLoggedIn(function(loggedIn) {
			$('#loading').hide();
			if (loggedIn) {
				$(self).trigger('login');
			} else {
				$('#loginForm').show();
			}
		});
		
		$('#loginButton').on('click',function() {
			$('#loginFailedMessage').hide();
			
			self.loginUser($('#loginUser').val(),$('#loginPass').val(),function(success) {
				if (!success) {
					$('#loginFailedMessage').show();
				}
			});
		});
		
		$('#logoutButton').on('click',function() {
			$.ajax('/logout',{
				complete:  function() {
					$('#loginForm').show();
					$('#afterLogin').hide();
					$(self).trigger('logout');
				}
			});
		});
		
		$('#playbackDate').on('change',function() {
			self.getRecordingList($(this).val(),function(list) {
				var playbackList=$('#playbackList');
				playbackList.empty();
				if (list) {
					$.each(list,function(i,v) {
						$('<div>')
						.text(v.channel+':'+v.startTime+'-'+v.endTime)
						.addClass('playbackItem')
						.appendTo(playbackList);
					});
				}
					
			});
		});
	},
	loginUser: function(user,pass,cb) {
		var self=this;
		$.ajax('/login', {
			type: 'POST',
			dataType: 'json',
			data: { user: user, password: pass },
			error: function() {
				if (cb) cb(false);
			},
			success: function(data) {
				if (data.success) $(self).trigger('login');
				
				if (cb) cb(data.success);
			}
		});
	},
	login: function() {
		var self=this;
		$('#loginForm').hide();
		$('#afterLogin').show();
		
		var channelSelection=$('#channelSelection');
		this.getChannelLabels(function(labels) {
			if (labels) {
				$.each(labels,function(k,v) {
					var button=$('<input type="button"/>');
					button.val(k);
					button.on('click',function() {
						$(self).trigger('channel',[v]);
					});
					channelSelection.append(button);
				});
			}
		});

	},
	isLoggedIn: function(cb) {
		$.ajax('/loginCheck',{
			dataType: 'json',
			error: function() {
				cb(false);
			},
			success: function(data) {
				cb(data.loggedIn);
			}
		});
	},
	getChannelLabels: function(cb) {
		var self=this;
		$.ajax('/video/labels', {
			error: function() {
				if (cb) cb(false);
			},
			success: function(data) {
				self.dvrLabels=data;
				if (cb) cb(data);
			}
		});
	},
	dateRE: /(\d{4})-(\d\d)-(\d\d)/,
	getRecordingList: function(date,cb) {
		console.log('getting recording list for ' + date);
		var res=this.dateRE.exec(date);
		$.ajax('/video/recordingList', {
			data: {
				year: res[1],
				month: res[2],
				day: res[3]
			},
			error: function() {
				if (cb) cb(false);
			},
			success: function(data) {
				if (cb) cb(data);
			}
		});
	}
});