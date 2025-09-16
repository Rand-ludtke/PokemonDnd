/** @type {import('../play.pokemonshowdown.com/src/client-main').PSConfig} */
var Config = Config || {};

/* version */ Config.version = "0";

Config.bannedHosts = ['cool.jit.su', 'pokeball-nixonserver.rhcloud.com'];

Config.whitelist = [
	'wikipedia.org'

	// The full list is maintained outside of this repository so changes to it
	// don't clutter the commit log. Feel free to copy our list for your own
	// purposes; it's here: https://play.pokemonshowdown.com/config/config.js

	// If you would like to change our list, simply message Zarel on Smogon or
	// Discord.
];

// `defaultserver` specifies the server to use when the domain name in the
// address bar is `Config.routes.client`.
Config.defaultserver = {
 id: 'server-pokemondnd-xyz',
 protocol: 'https',
 host: 'server.pokemondnd.xyz',
 port: 443,
 httpport: 443,
 altport: 0,
 prefix: '/showdown',
 registered: false
};

Config.roomsFirstOpenScript = function () {
};

Config.customcolors = {
	'zarel': 'aeo'
};
/*** Begin automatically generated configuration ***/
Config.version = "0.11.2 (322528ff)";

Config.routes = {
	root: 'server.pokemondnd.xyz',
	// Use official play domain as client route so crossdomain iframe (crossdomain.php) is hosted there
	client: 'play.pokemonshowdown.com',
	dex: 'dex.pokemonshowdown.com',
	replays: 'replay.pokemonshowdown.com',
	users: 'pokemonshowdown.com/users',
	teams: 'teams.pokemonshowdown.com',
};
/*** End automatically generated configuration ***/

// --- Custom overrides for deployment ---
// Point login queries (action.php) at the official login server so we don't need a local action.php
// and avoid 405 errors from https://www.pokemondnd.xyz/~~server-pokemondnd-xyz/action.php
// We use the server's own id so challstr/auth flow remains consistent with our custom server.
Config.loginserver = 'play.pokemonshowdown.com';
Config.loginserverid = 'server-pokemondnd-xyz';
// Ensure we still connect to our own battle server despite changing routes.client
// (client-connection code respects Config.server if already defined)
Config.server = Config.defaultserver;
