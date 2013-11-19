  exports.action = function(data, callback, config, SARAH){


    // Retrieve config
  config = config.modules.zipabox;

  //Paramètre zipabox
  logoutURL = "user/logout";
  loginURL = "user/login";
  baseURL = config.api_web_adr;
  username = config.api_user;
  urlLight = "lights/";
  urlScenes = "scenes/";
  urlValues = "values/";
  initURL = "user/init";  
    
    console.log("User : " + username);
  
    //var request = require('request'),
    //crypto = require('crypto');
    var sessionid;
    
    var jar;
  

  
  
  if (!config.api_user || !config.api_secret){
    console.log("Missing Zipabox config");
	  callback({'tts' : 'Paramètre utilisiteur invalide'});
    return;
  }
  
    console.log('##### ZIPABOX #####');
//init1(baseURL+initURL, callback, config);
//console.log(sessionid);




//Commande recue du XML
switch (data.request)
	{
	case 'update': {
		console.log('##### UPDATE #####');
    init1(data, callback, config, jar);
      }
  break;
  
  case 'set': {
  console.log('##### SET #####');
   init1(data, callback, config, jar);
   
  }
  break;
  
    case 'get': {
  console.log('##### GET #####');
   init1(data, callback, config, jar);
   
  }
  break;

	default:
	output(callback, "Une erreur s'est produite: ",jar);
	}

}



//fonction courante
var sendURL = function(url, jar, callback, cb){

  console.log("--------------------------------------------------------------------");
  console.log('session id : ' +sessionid);
  console.log("sendURL :");
  console.log(url);  
  
  
  var request = require('request');
  if (!jar)
  {
    jar = request.jar();
  }
  
  console.log("--------------------------------------------------------------------");
  
   //console.log(request);
   
  var req = { 
                  'url': url, 
                  'jar': jar, 
                  'Content-type' : 'application/json'
      }; 
   
  request(req, function (err, response, body){
    
    if (err || response.statusCode != 200) {
      callback({'tts': "L'action a échoué"});
      return;
    }

    cb(body);
  });
}

//Mise à jour fichier XML
var update = function(jsonmodule, jsonscene, jsonmeter, jsonsensor, callback, config){
 
  console.log("***** UPDATE  *****");

  var fs   = require('fs');
  var file = config.rep_inst_sarah+'/plugins/zipabox/zipabox.xml';
  var xml  = fs.readFileSync(file,'utf8');
  
  var replace  = '§ -->\n';
  replace += '  <one-of>\n';
  
  console.log("écriture des modules");
  console.log(jsonmodule);
  //écriture des modules        
    for (var id in jsonmodule) {
      var module = id;
      
      if (jsonmodule[id]["attributes"]["11"])
      {
        replace += '    <item>'+jsonmodule[id]["name"]+'<tag>out.action.typ="modules";out.action.uuid="'+id+'";out.action.attribute="'+jsonmodule[id]["attributes"]["11"]["id"]+'"</tag></item>\n';
        console.log('Module ajout de : ' + jsonmodule[id]["name"]);
      }
      //dimmable & volet assimilé à dimmable sur attribute id 8
	  if (jsonmodule[id]["attributes"]["8"])
      {
        replace += '    <item>'+jsonmodule[id]["name"]+'<tag>out.action.typ="modules";out.action.uuid="'+id+'";out.action.attribute="'+jsonmodule[id]["attributes"]["8"]["id"]+'"</tag></item>\n';
        console.log('Module ajout de : ' + jsonmodule[id]["name"]);
      }      
    }

    console.log("écriture des scènes");
    console.log(jsonscene);
  //écriture des scènes
    replace += '<!--SCENES-->\n';

    for (var id in jsonscene) {
      var scenes = id;
      replace += '    <item>'+jsonscene[id]["name"]+'<tag>out.action.typ="scenes";out.action.uuid="'+id+'"</tag></item>\n';
      console.log('Scene ajout de : ' + jsonscene[id]["name"]);    
    }
  //écriture des METERS
     replace += '<!--METERS-->\n';
	 
	 for (var id in jsonmeter) {
      var meter = id;
      replace += '    <item>'+jsonmeter[id]["name"]+'<tag>out.action.typ="'+jsonmeter[id]["uiType"]+'";out.action.uuid="'+id+'"</tag></item>\n';
      console.log('Mesure ajout de : ' + jsonmeter[id]["name"]);    
    }
  //écriture des SENSORS
     replace += '<!--SENSORS-->\n';
	 
	 for (var id in jsonsensor) {
      var sensor = id;
      replace += '    <item>'+jsonsensor[id]["name"]+'<tag>out.action.typ="'+jsonsensor[id]["uiType"]+'";out.action.uuid="'+id+'"</tag></item>\n';
      console.log('Capteur ajout de : ' + jsonsensor[id]["name"]);    
    }
	console.log('ajout terminé');
  replace += '  </one-of>\n';
  replace += '<!-- §';
            
  var regexp = new RegExp('§[^§]+§','gm');
  var xml    = xml.replace(regexp,replace);
  fs.writeFileSync(file, xml, 'utf8');
  fs.writeFileSync(file, xml, 'utf8');
  
  callback({ 'tts' : 'mise a jour de la base terminée'});

}


//set pour Modules et Scenes
var setok = function (data, callback, config, jar) {

  var requestset = require('request');
  if (!jar)
  {
    jar = requestset.jar();
  }
  console.log('session id' +sessionid);

  switch (data.typ)
              {
                case 'modules': {
                  var options1 = {
                  url: baseURL+'lights/'+data.uuid+'/attributes/'+data.attribute+'/value?JSESSIONID='+sessionid,
                  method: 'POST',
                  body : data.p_body,
                  'Content-type' : 'application/json',
                  'jar': jar
                   };
                }
                break;
                case 'scenes':{
                  var options1 = {
                  url: baseURL+'scenes/'+data.uuid+'/run?JSESSIONID='+sessionid,
                  'Content-type' : 'application/json',
                  method: 'POST',
                  'jar': jar
                   };
                }
                break;
                default:
                output(callback, "Type non reconnu ",jar);
              }
  
  	console.log("--------------------------------------------------------------------");
  	console.log("URL ACTION :");
  	console.log(options1.url);
  	console.log("--------------------------------------------------------------------");
                
    requestset(options1, function (errorset, responseset, body) {
      if (!errorset && responseset.statusCode == 200) {
        	var json = JSON.parse(body);
        	if (json.success)
          {
          	output(callback, "fait",options1.jar);
          }
        	else
          {
            console.log("--------------------------------------------------------------------");
            console.log("Une erreur s'est produite dans le set : ");
            console.log(json);
            console.log("--------------------------------------------------------------------");
            output(callback, "Une erreur s'est produite dans le set (voir les logs de SARAH)<br>" + json.error,options1.jar); 
          }
      }
	  else 
    {
      var json = JSON.parse(body);
      console.log("--------------------------------------------------------------------");
      console.log("Une erreur s'est produite dans le set : ");
      console.log(json);
      console.log("--------------------------------------------------------------------");
      output(callback, "Une erreur s'est produite dans le set (" + responseset.statusCode + ")<br>" + json.error,options1.jar);
    }
    });
}
// recuperation info METER/SENSOR - partie batterie uniquement pour l'instant
var get = function (data, callback, config, jar) {

  var requestset = require('request');
  if (!jar)
  {
    jar = requestset.jar();
  }
  if (data.typ=="SENSOR") {url =baseURL+'sensors/'+data.uuid;}
  if (data.typ=="METER") {url =baseURL+'meters/'+data.uuid;}
  sendURL(url, jar, callback, function(body5) {
                    try {
                    	var resultmeter = JSON.parse(body5);
                    }
                    catch(err)
                    {
                      output(callback, "Une erreur s'est produite: " + err,jar);
                      return;
                    }
					for (var id in resultmeter) {
      					var niveau = id;
      
      					if (resultmeter["battery"]){
							repon_meter ="La batterie est à "+resultmeter["battery"]+" %";}
							else 
							repon_meter ="Erreur. Le capteur ne dispose pas de niveau de batterie.";
					}
					console.log(output);
					output(callback, repon_meter, jar);
  });
}



var init1 = function function_name (data, callback, config, jar) {
  var request = require('request');
  if (!jar)
  {
    jar = request.jar();
  }
  var crypto = require('crypto');
    
  if(typeof sessionid === 'undefined' || sessionid == null) { //on vérifie qu'on est authentifié à la zipabox. Ligne à supprimer pour une identification à chaque commande.
  // sinon initialisation pour recuperation du nonce
      
      var req = { 
                  'url': baseURL+initURL, 
                  'jar': jar, 
                  'Content-type' : 'application/json'
      };
      
      request(req, function ( err, response, body){
    
      if (err || response.statusCode != 200) {
        callback({'tts': "L'initialisation a échouée"});
        return;
      }
    
      var json= JSON.parse(body);
        api_nonce = json.nonce;
        sessionid = json.jsessionid;
        console.log("nonce obtenu : " +api_nonce);
        console.log("Session :"+sessionid);
       
       //Génération du token de connection suivant l'algorythme : token = SHA1(nonce + SHA1(password))
        sh_login = api_nonce + crypto.createHash('sha1').update(config.api_secret).digest('hex');
        api_token =  crypto.createHash('sha1').update(sh_login).digest('hex');
        console.log("Api_token :"+api_token);

       var req = { 
                    'url': baseURL+loginURL+'?username='+config.api_user+'&token='+api_token, 
                    'jar': jar, 
                    'Content-type' : 'application/json' 
        };

       request(req, function ( err, response, body2){
          if (err || response.statusCode != 200) {
          output(callback, "L'action a échouée",req.jar);
          return;
          }
          //connection à la ZIPABOX
            var donnees = JSON.parse(body2);  
            sessionid = donnees.jsessionid;
            api_nonce = donnees.nonce;
            console.log("Connection à la zipabox réussie sessionid : "+sessionid);
         
            switch (data.request)
              {
                case 'set': {
                  return setok(data,callback,config,jar); 
                }
                break;
				case 'get': {
                  return get(data,callback,config,jar); 
                }
                break;
                case 'update': {
                  sendURL(baseURL+urlLight, jar, callback, function(body3) {
                    try {
                    	var modules = JSON.parse(body3);
                    }
                    catch(err)
                    {
                      output(callback, "Une erreur s'est produite: " + err,jar);
                      return;
                    }
                    sendURL(baseURL+urlScenes, jar, callback, function(body4){
                      try {
                        var scenes = JSON.parse(body4);
                      }
                      catch(err)
                      {
                        output(callback, "Une erreur s'est produite: " + err,jar);
                        return;
                      }
					                      sendURL(baseURL+'meters/', jar, callback, function(body5){
                      	try {
                        	var meters = JSON.parse(body5);
                      	}
                      	catch(err)
                      	{
                        	output(callback, "Une erreur s'est produite: " + err,jar);
                        	return;
                      	}
					  sendURL(baseURL+'sensors/', jar, callback, function(body6){
                      	try {
                        	var sensors = JSON.parse(body6);
                      	}
                      	catch(err)
                      	{
                        	output(callback, "Une erreur s'est produite: " + err,jar);
                        	return;
                      	}
                      //console.log(scenes);
                    
                    try{
                      update(modules, scenes, meters, sensors, callback, config);
                    }
                    catch(err)
                    {
                        output(callback, "Une erreur s'est produite: " + err,jar);
                        return;
                    }
                    
                    sendURL(baseURL+logoutURL,jar,callback,function(body){
                      var resp = JSON.parse(body);
                      if (resp.success)
                      {
                        sessionid = null;
                        jar = null;
                        console.log("Déconnexion OK");
                      }
                    });
						});
                     });
                    });
                  });
                }
                break;
                default:
                output(callback, "Une erreur s'est produite: ",jar);
              }
        });      
  }); 
  
 } else //Début de partie à supprimer pour identification à chaque commande
 switch (data.request)
              {
                case 'set': {
                  return setok(data,callback,config,jar); 
                }
                break;
				case 'get': {
                  return get(data,callback,config,jar); 
                }
                break;
                case 'update': {                  
                  sendURL(baseURL+urlLight, jar, callback, function(body3) {  
                    try {
                      var modules = JSON.parse(body3);
                    }
                    catch(err)
                    {
                      output(callback, "Une erreur s'est produite: " + err,jar);
                      return;
                    }
                    sendURL(baseURL+urlScenes, jar, callback, function(body4){
                      try {
                      	var scenes = JSON.parse(body4);
                      }
                      catch(err)
                      {
                        output(callback, "Une erreur s'est produite: " + err,jar);
                        return;
                      }
                      //console.log(scenes);
                      
                      update(modules, scenes, meters, sensors, callback, config);
                    });
                  });                  
                }
                break;
                default:
                output(callback, "Une erreur s'est produite: ",jar);
              } //fin de partie à supprimer pour identification à chaque commande
    
}

var output = function ( callback, output, jar ) {
	console.log(output);
  //console.log(jar);
  
  sendURL(baseURL+logoutURL,jar,callback,function(body){
    var resp = JSON.parse(body);
    if (resp.success)
    {
      sessionid = null;
      jar = null;
      console.log("Déconnexion OK");
    }
  });
  
	callback({ 'tts' : output});
}
