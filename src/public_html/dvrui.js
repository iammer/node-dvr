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
		
		var channelSelection=$('#channelSelection');
		for(var i=1;i<=6;i++) {
			var button=$('<input type="button"/>');
			button.val(i);
			button.on('click',function() {
				$(self).trigger('channel',[$(this).val()]);
			});
			channelSelection.append(button);
		}
			
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
		$('#loginForm').hide();
		$('#afterLogin').show();

		console.log('onLogin');
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
	}
});