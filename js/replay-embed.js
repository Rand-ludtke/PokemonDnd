// Minimal placeholder replay embed template for custom deployment.
// The build script (build-tools/update) replaces domain references and cachebusts this file.
// If you customize the replay embedding UI, edit this template and rebuild.
(function(){
	// Basic stub: expose a createReplayEmbed function expected by downstream code (if any).
	window.createReplayEmbed = function(replayId){
		var container = document.getElementById('replay-embed');
		if(!container){
			container = document.createElement('div');
			container.id = 'replay-embed';
			document.body.appendChild(container);
		}
		container.innerHTML = 'Replay placeholder for ' + replayId + '. (Customize replay-embed.template.js)';
	};
})();
