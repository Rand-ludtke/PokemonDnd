<?php
// Simple login proxy: forwards form data to official login server to avoid CORS.
// Expects same POST fields that the PS client normally sends (act, name, pass, challstr, etc.)
// Returns raw response body from upstream.

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Method Not Allowed";
    exit;
}

$targetBase = 'https://play.pokemonshowdown.com';
$serverId = 'server-pokemondnd-xyz';
$target = $targetBase . '/~~' . rawurlencode($serverId) . '/action.php';

// Build context for POST
$postFields = $_POST; // relies on standard application/x-www-form-urlencoded form submission

// Fallback: if raw input but no parsed POST (edge case of different content-type)
if (!$postFields) {
    parse_str(file_get_contents('php://input'), $postFields);
}

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
// Set a short timeout to fail fast
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
// Forward a user-agent for traceability
curl_setopt($ch, CURLOPT_USERAGENT, 'PS-LoginProxy/1.0 (+server-pokemondnd-xyz)');

$response = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

header('Content-Type: text/plain; charset=utf-8');
if ($response === false) {
    http_response_code(502);
    echo 'Proxy error: ' . $err;
    exit;
}
// Pass through upstream status if useful (normally 200)
if ($code && $code !== 200) {
    http_response_code($code);
}
echo $response;
