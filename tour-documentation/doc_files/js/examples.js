$(window).load(function(){
	
	function getRandomColor(ranges) {
		if (!ranges) {
			ranges = [
				[150,256],
				[0, 190],
				[0, 30]
			];
		}
		var g = function() {
			//select random range and remove
			var range = ranges.splice(Math.floor(Math.random()*ranges.length), 1)[0];
			//pick a random number from within the range
			return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
		}
		return "rgba(" + g() + "," + g() + "," + g() + "," + 1 +")";
	};
	
	function randomNumber(m,n){
		m = parseInt(m);
		n = parseInt(n);
		return Math.floor( Math.random() * (n - m + 1) ) + m;
	}
	
	$('.para').each(function(){
		var cone = randomNumber(-15,15);	
		$(this).find('.paraItem').css({transform:'skew('+cone+'deg)'});
	})
	

	$('.rbg').each(function(){
		$(this).css({backgroundColor:getRandomColor([[150,224],[150,224],[150,224]])});	
	})
	
	
	var oldClass;
	var newClass;
	var logoAnim = function(){
		oldClass = newClass;
		var randomClassNum = randomNumber(1,6);
		switch (randomClassNum) {
			case 1:
				newClass = 'front';
				break;
			case 2:
				newClass = 'back';
				break;
			case 3:
				newClass = 'right';
				break;
			case 4:
				newClass = 'left';
				break;
			case 5:
				newClass = 'top';
				break;
			case 6:
				newClass = 'bottom';
				break;
			default:
			newClass = 'front'
		}
		
		$('.logo').removeClass('show-'+oldClass).addClass('show-'+newClass);
	}
	
	setInterval(function(){
		logoAnim();	
	},2000);
	
	$('.exBtn').on('click',function(){
		$('html,body').animate({scrollTop:$($(this).attr('href')).offset().top},500);
		return false;	
	})
	
	$('.itour-pos_switch').on('click',function(){
		$('body').itour({
			tourTitle:'Position',
			create:function(){
				if($('.posLine.cur').length){
					$('.posLine.cur').trigger('click');
				}else{
					$('[data-code="tcc"]').trigger('click');
				}
			},
			steps:[{
				title:'Variants of Position',
				content:'<p>Each white line represents a specific position.</p><p>Click on any line to see the available variants of positions for tour\'s message</p>',
				contentPosition:'tcc',
				name:'posName',
				event:'next',
				nextLabel:'End tour'
			}]
		});
		return false;	
	});
	
	$('.itour-pos_auto').on('click',function(){
		$('body').itour({
			tourTitle:'Auto Position',
			steps:[{
				title:'Element in corner 1',
				content:'<p>For this tour\'s message, plugin chose the right-bottom side position.</p> <p>Click "Next" to continue.</p>',
				name:'autoPosName-logo',
				event:'next'
			},
			{
				title:'Element in corner 2',
				content:'<p>For this tour\'s message, plugin chose the left-top side position.</p> <p>Click "Next" to continue.</p>',
				name:'autoPosName-share',
				event:'next'
			},
			{
				title:'Element in center ',
				content:'<p>Tour\'s message position can change when scrolling page.</p> <p>Try to scroll the page.</p>',
				name:'autoPosName-title',
				event:'next',
				nextLabel:'End tour'
			}]
		});
		return false;	
	});
	
	$('.itour-detect_event').on('click',function(){
		$('body').itour({
			tourTitle:'Detect Events',
			steps:[{
				title:'Detect Click',
				content:'<p>Click the button to continue</p>',
				name:'detectEventName-click',
				event:'click'
			},{
				title:'Detect Change',
				content:'<p>Change the value of select element to end</p>',
				name:'detectEventName-change',
				event:'change'
			}]
		});
		return false;	
	});
	
	$('.itour-trigger_event').on('click',function(){
		$('body').itour({
			tourTitle:'Trigger Events',
			steps:[{
				title:'Trigger Click First',
				content:'<p>Click "Next" to continue.</p>',
				name:'triggerEventName-1-click',
				trigger:'click',
				event:'next'
			},{
				title:'Trigger Click Second',
				content:'<p>Click "Next" to continue.</p>',
				name:'triggerEventName-2-click',
				trigger:'click',
				event:'next'
			},{
				title:'Trigger Click Third ',
				content:'<p>Click "Next" to end.</p>',
				name:'triggerEventName-3-click',
				trigger:'click',
				event:'next'
			}]
		});
		return false;	
	});
	
	
	var callbackEl = $('.callbackEl');
	var numIndex = 0;
	var callbackView = function(mess){
		numIndex++;
		callbackEl.html(callbackEl.html() +'<div class="strItem">'+numIndex+'. '+mess+'</div>');	
		if($('.strItem').length > 7){
			$('.strItem:first').remove()
		}
		$(window).trigger('scroll');
	}
	
	
	$('.itour-callback').on('click',function(){
		$('body').itour({
			tourTitle:'Callback Functions',
			create: function(){
				callbackView('"create" function is called');
			},
			end: function(){
				callbackView('"end" function is called');
			},
			steps:[{
				title:'Callback Functions',
				content:'<p>Click "Next" to end.</p>',
				name:'callbackName',
				trigger:'click',
				event:'next',
				before:function(){
					callbackView('step title: '+this.title);
					callbackView('"before" function is called');
				},
				during:function(){
					callbackView('"during" function is called');
				},
				after:function(){
					callbackView('"after" function is called');
				}
			}]
		});
		return false;	
	});
	
	
	$('.itour-tour_map').on('click',function(){
		$('body').itour({
			tourTitle:'Map of Tour',
			steps:[{
				title:'Tour Map Button',
				content:'<p>Click on the icon in the upper right corner of this window to open the map of tour.</p><p>Click "Next" to continue.</p>',
				name:'tourMapName_1',
				event:'next'
			},{
				title:'Tour Map Position',
				content:'<p>You can change the place of emergence the map of tour via the parameter "tourMapPos".</p><p>By default, the map of tour appears to the right side.</p><p>Click "Next" to continue.</p>',
				name:'tourMapName_2',
				event:'next'
			},{
				title:'Tour Map Steps',
				content:'<p>The map of tour contains a list of all steps of tour.</p><p>You can switch between the different steps by clicking on the name of the step.</p><p>When the specified event in this step  is done, this step is highlighted in green.</p><p>Click "Next" to end tour.</p>',
				name:'tourMapName_3',
				event:'next'
			}]
		});
		return false;	
	});
	
	$('.itour-button_label').on('click',function(){
		$('body').itour({
			tourTitle:'Button Label',
			steps:[{
				title:'Default Buttons Label',
				content:'<p>By default, the buttons have the labels: "Next" and "Prev".</p><p>Click "Next" to continue.</p>',
				name:'buttonLabelName_1',
				event:'next'
			},{
				title:'Custom Buttons Label',
				content:'<p>Using the parameters "nextLabel" and "prevLabel", you can change the labels of these buttons.</p><p>Click "Custom Next" to continue.</p>',
				name:'buttonLabelName_2',
				event:'next',
				nextLabel:'Custom Next',
				prevLabel:'Custom Prev'
			},{
				title:'Icon Buttons Label',
				content:'<p>Thanks to  this, you will have the ability to specify the names of the buttons in other languages or names that are longer will conform to your message or add icons and other html tags.</p><p>Click "End Tour" to End.</p>',
				name:'buttonLabelName_3',
				event:'next',
				nextLabel:'<span class="glyphicon glyphicon-remove"></span> End Tour',
				prevLabel:'<span class="glyphicon glyphicon-arrow-left"></span> Back'
			}]
		});
		return false;	
	});
	

	$('[data-name="posName"] .posLine').on('click',function(){
		$('.posLine.cur').removeClass('cur');
		var code = $(this).addClass('cur').attr('data-code');
		if($('body').data().steps){
			$('body').data().steps[0].contentPosition = code;
			$(window).trigger('scroll');
		}
		return false;	
	})
	
	$('.scrollTop').on('click',function(){
		$('html,body').animate({scrollTop:0},500);
		return false;		
	})
	
	$('.nextExample').on('click',function(){
		$('html,body').animate({scrollTop:$(this).closest('.para').next('.para').offset().top},500);
		return false;	
	})
	
})