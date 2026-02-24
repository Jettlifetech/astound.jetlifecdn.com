$(function(){
	var updateResult = function(){
		var rowsCount = 0;
		var parMass = [];
		var langMass = [];
		var stepsList = [];
		var tab = '        ';
		$('.builderMain .builderPar').each(function(){
			var parRow = $(this);
			var parTitle = $.trim($('.paramLabel',parRow).text());
			var parVal = $.trim($('.paramControl',parRow).val());	
			if(parVal != '' && parVal != $('.paramControl',parRow).attr('data-default') || parRow.is('.builderPar-required')){	
				parMass.push('\n'+tab+tab+tab+'"'+parTitle+'": "'+parVal+'"');
				rowsCount++;
			}
			
		});
		$('.builderLang .builderPar').each(function(){
			var parRow = $(this);
			var parTitle = $.trim($('.paramLabel',parRow).text());
			var parVal = $.trim($('.paramControl',parRow).val());	
			if(parVal != '' && parVal != $('.paramControl',parRow).attr('data-default') || parRow.is('.builderPar-required')){	
				langMass.push('\n'+tab+tab+tab+tab+'"'+parTitle+'": "'+parVal+'"');
				rowsCount++;
			}
			
		});
		$('.builderStep:not(.builderStep--tpl)').each(function(){
			var stepItem;
			var stepMass = [];
			var builderStep = $(this);
			$('.builderPar',builderStep).each(function(){
				var parRow = $(this);
				var parTitle = $.trim($('.paramLabel',parRow).text());
				var parVal = $.trim($('.paramControl',parRow).val());
				if(parVal != '' && parVal != $('.paramControl',parRow).attr('data-default') || parRow.is('.builderPar-required')){
					stepMass.push('\n'+tab+tab+tab+tab+'"'+parTitle+'": "'+parVal+'"');
					rowsCount++;
				}
				
			});
			
			if(stepMass.length){
				stepItem = '{'+
					stepMass+
				'\n'+tab+tab+tab+'}';
				stepsList.push(stepItem);
				rowsCount++;
			}
			
		});
		
		var langString = '';
		if(langMass.length && langMass.length !== 0){
			coma2 = ',';
			langString = '\n'+tab+tab+tab+'"lang":{'+
			langMass.join(',')+
			'\n'+tab+tab+tab+'}';
		}
		
		var stepString = '';
		var coma2 = '';
		if(langMass.length && langMass.length !== 0 || parMass.length && parMass.length !== 0){
			coma2 = ',';
		}
		if(stepsList.length && stepsList.length !== 0){
			stepString = coma2+'\n'+tab+tab+tab+'"steps": ['+
				stepsList+']';
		}
		
		
		var coma = '';
		
		if(parMass.length && parMass.length !== 0 && langMass.length && langMass.length !== 0){
			coma = ','	
		}
		
		var parObj = '';
		if(parMass.length && parMass.length !== 0 || langMass.length && langMass.length !== 0 || stepsList.length && stepsList.length !== 0){
			parObj = '{'+
			parMass.join(',')+coma+
			langString+
			stepString+
			'\n'+tab+tab+'}';
		}
			
		
		var connectResult = 
			'\n<script src="http://code.jquery.com/jquery-latest.js"></script>'+
			'\n<link rel="stylesheet" href="css/itour.css">'+
			'\n<script src="js/jquery.itour.js"></script>';
		var iniResult = 
			'\n<script>'+
			'\n$(window).load(function(){'+
				'\n'+tab+'$(".anyClassBtn").on("click",function(){'+
				'\n'+tab+tab+'$("body").itour('+
				parObj+
				');'+
			'\n'+tab+tab+'return false;'+
				'\n'+tab+'});'+
			'\n})'+
			'\n</script>';
		var buttonResult = 
			'\n<a class="anyClassBtn" href="#">Start Tour</a>';
			
			
		$('.resultField').val(connectResult + iniResult.replace(/\'\"/gi,'\"').replace(/\"\'/gi,'\"').replace(/\"\"/gi,'\"').replace(/\'\'/gi,'\'').replace(/"false"/gi,'false').replace(/"true"/gi,'true').replace(/"\[/gi,'\[').replace(/\]"/gi,'\]').replace(/\="/gi,'\=\'').replace(/\"]/gi,'\']').replace(/\"name\"\: \[/gi,'"name": "[').replace(/\']/gi,'\']"') + buttonResult).attr('rows',rowsCount + 18);
		
		if (typeof(Storage) !== "undefined"){
			localStorage.setItem("itour_options", parObj);
		}
	};
	
	
	var deleteBtn = function(){
		if($('.builderStep').length < 3){
			$('.builderStep').find('.deleteStep').addClass('disable');	
		}else{
			$('.builderStep').find('.deleteStep').removeClass('disable');		
		}
	};
	
	var buildForm = function(json){
		var obj = $.parseJSON( json )	
		$.each(obj, function(i, val) {
			var builderPar = $('.paramLabel:contains("'+i+'")').closest('.builderPar');
			$('.paramControl',builderPar).val(val);

			if(i == "steps"){
				$.each(val,function(){
					addStep();
					var stepObj = this;
					$.each(stepObj, function(i2, val2) {
						var builderStepNew = $('.addWrap').prev('.builderStep');
						
						var builderPar = $('.paramLabel:contains("'+i2+'")',builderStepNew).closest('.builderPar');
						$('.paramControl',builderPar).val(val2);
						
					});
					
					
				})
			}
			
		});
	};
	
	var addStep = function(){
		var addWrap = $('.addWrap');
		var stepLast = $('.builderStep--tpl');
		var stepClone = stepLast.clone().removeClass('builderStep--tpl');
		stepClone.find('input').val('').attr('value','');
		var stepNew = '<div class="builder builderStep form-horizontal">'+stepClone.html()+'</div>';
		addWrap.before(stepNew);
	};
	
	
	
	$(document).on('keyup','.builderPar .paramControl',function(){
		setPsevdoNumber($(this));
		setPsevdoBoolean($(this));
		setPsevdoSelect($(this));
		updateResult();
	});
	$(document).on('click','.setDef',function(){
		var builder = $(this).closest('.builder');
		$('.paramControl',builder).each(function(){
			var formControl = $(this);
			formControl.val(formControl.attr('data-default'));
		});
		updateResult();
		setPsevdo();
		return false;
	});
	$(document).on('click','.clearVal',function(){
		var builder = $(this).closest('.builder');
		$('.paramControl',builder).each(function(){
			var formControl = $(this);
			formControl.val('').attr('value','');
		});
		updateResult();
		return false;
	});
	$(document).on('click','.addStep',function(){
		addStep();
		updateResult();
		deleteBtn();
		return false;
	});
	$(document).on('click','.deleteStep:not(.disable)',function(){
		var builder = $(this).closest('.builder').remove();
		updateResult();
		deleteBtn();
		return false;
	});

	/*for number*/
	$(document).on('input','[data-number_mid]',function(){
		var number_mid = $(this);
		var builderStep = number_mid.closest('.builder');
		var number_pid = $('[data-number_pid="'+number_mid.attr('data-number_mid')+'"]',builderStep);
		number_pid.val(number_mid.val());
	});
	$(document).on('change','[data-number_mid]',function(){
		updateResult();
	});
	
	/*for boolean*/
	$(document).on('change','[data-boolean_mid]',function(){
		var boolean_mid = $(this);
		var builderStep = boolean_mid.closest('.builder');
		var boolean_pid = $('[data-boolean_pid="'+boolean_mid.attr('data-boolean_mid')+'"]',builderStep);
		var checkedVal = 'false';
		if(boolean_mid.prop('checked')){
			checkedVal = 'true';	
		}
		boolean_pid.val(checkedVal);
		updateResult();
	});
	
	/*for select*/
	$(document).on('change','[data-select_mid]',function(){
		var select_mid = $(this);
		var builderStep = select_mid.closest('.builder');
		var select_pid = $('[data-select_pid="'+select_mid.attr('data-select_mid')+'"]',builderStep);
		select_pid.val(select_mid.val());
		updateResult();
	});
	$('.builderPar .paramControl').each(function(){
		$(this).attr('placeholder',$(this).attr('data-default'));
	});
	
	/*cange builder field*/
	
	$('.builder [data-type="number"]').each(function(i){
		var numberFiled = $(this).attr('data-number_pid',i).attr('readonly','readonly');
		var numberChange = $('<input data-number_mid="'+i+'" type="range" value="'+numberFiled.attr('data-default')+'" max="'+numberFiled.attr('data-max')+'" min="'+numberFiled.attr('data-min')+'" step="'+numberFiled.attr('data-step')+'">');
		numberFiled.after(numberChange);
	});

	$('.builder [data-type="boolean"]').each(function(i){
		var booleanFiled = $(this).attr('data-boolean_pid',i).attr('type','hidden');
		var booleanChange = $('<label class="switch"><input data-boolean_mid="'+i+'" type="checkbox"><div class="slider round"></div></label>');
		booleanFiled.after(booleanChange);
	});
	
	$('.builder [data-type="select"]').each(function(i){
		var selectFiled = $(this).attr('data-select_pid',i).attr('type','hidden');
		var selectChange = $('<select placeholder="'+selectFiled.attr('placeholder')+'" class="" data-select_mid="'+i+'"></select>');
		var selectArray = selectFiled.attr('data-options').split(',');
		for(var i = 0; i < selectArray.length ;i++){
			$('<option>').html(selectArray[i]).appendTo(selectChange);
		}
		selectFiled.after(selectChange);
	});
	
	var setPsevdoNumber = function(el){
		if(el.is('[data-number_pid]')){
			var number_pid = el;
			var builderStep = number_pid.closest('.builder');
			var number_mid = $('[data-number_mid="'+number_pid.attr('data-number_pid')+'"]',builderStep);
			number_mid.val(number_pid.val());
		}
	};
	var setPsevdoBoolean = function(el){
		if(el.is('[data-boolean_pid]')){
			var boolean_pid = el;
			var builderStep = boolean_pid.closest('.builder');
			var boolean_mid = $('[data-boolean_mid="'+boolean_pid.attr('data-boolean_pid')+'"]',builderStep);
			var checkedVal = false;
			if(boolean_pid.val() == 'true'){
				checkedVal = true;	
			}
			boolean_mid.prop('checked',checkedVal);
		}	
	};
	var setPsevdoSelect = function(el){
		if(el.is('[data-select_pid]')){
			var select_pid = el;
			var builderStep = select_pid.closest('.builder');
			var select_mid = $('[data-select_mid="'+select_pid.attr('data-select_pid')+'"]',builderStep);
			select_mid.val(select_pid.val());
		}
	};
	
	var setPsevdo = function(){
		$('.builderPar .paramControl').each(function(){
			setPsevdoNumber($(this));
			setPsevdoBoolean($(this));
			setPsevdoSelect($(this));
		});
	};
	
	
	
	
	var searchStep = function(){
		if(!$('.builderStep--tpl').next('.builderStep').length){
			addStep();	
		}	
	};
	
	
	if (typeof(Storage) !== "undefined"){
		var saveOpt = localStorage.getItem("itour_options");
		if(saveOpt){
			buildForm(saveOpt);	
			searchStep();
			updateResult();
			deleteBtn();	
		}else{
			searchStep();
			$('.setDef').each(function(){
				$(this).trigger('click');	
			})
			updateResult();
			deleteBtn();	
		}
	}else{
		updateResult();
		deleteBtn();	
	}
	
	setPsevdo();
	
	
	$('.builderTab').each(function(){
		var builderTab = $(this);
		var startOpen = 0;
		
		
		var builderTabItem = $('.builderTabItem',builderTab);
		var builderTabMenu = $('.builderTabMenu a',builderTab);
		
		builderTabItem.eq(startOpen).addClass('builderTabItem-active');
		builderTabMenu.eq(startOpen).addClass('active');
		
		builderTabMenu.on('click',function(){
			var tabMenuItem = $(this);
			builderTabMenu.removeClass('active').filter(tabMenuItem).addClass('active');
			builderTabItem.removeClass('builderTabItem-active').filter('#'+tabMenuItem.attr('data-href')).addClass('builderTabItem-active');
			return false;
		});
		
	});
	
	var testinput = function(re, str){
		if (str.search(re) != -1){
			return true	
		}
		else{
			return false	
		}
	}
	$('.paramLabel').each(function(){
		var paramLabel = $(this);
		var paramLabelVal = $.trim(paramLabel.text());
		var tdOpt = $('.optionsTable [data-opt]:contains("'+paramLabelVal+'")');
		var tdDescr = tdOpt.closest('tr').find('td:last-child');
		tdOpt.each(function(i){
			var tdOptVal = $.trim($(this).attr('data-opt'));
			if(tdOptVal == paramLabelVal){
				var tdDescr = tdOpt.eq(i).closest('tr').find('td:last-child');
				var dataHelp = tdDescr.text();
				paramLabel.attr('data-help',dataHelp);		
			}
		});

	})

});