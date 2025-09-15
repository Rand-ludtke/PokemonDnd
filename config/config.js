/** @type {import('../src/client-main').PSConfig} */
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
 id: 'myserver',
 protocol: 'https',
 host: 'server.pokemondnd.xyz',
 port: 443,
 httpport: 443,
 altport: 0,
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
 client: 'server.pokemondnd.xyz',
 dex: 'dex.pokemonshowdown.com',
 replays: 'replay.pokemonshowdown.com',
 users: 'pokemonshowdown.com/users',
 teams: 'teams.pokemonshowdown.com',
};
/*** End automatically generated configuration ***/