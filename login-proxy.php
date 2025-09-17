<?php
// Enhanced login proxy with session persistence.
// - Forwards PS login requests (act=name,pass,challstr, etc.) to official login server.
// - Mirrors upstream login cookie (sid=...) into a same-origin cookie (ps_sid) so browsers can "remember" login.
// - Replays ps_sid to upstream on future requests so `upkeep` returns logged-in state.

// CORS headers are harmless here; for same-origin usage they don't affect behavior.
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

// ----- Upstream configuration -----
$targetBase = 'https://play.pokemonshowdown.com';
$serverId = 'server-pokemondnd-xyz';
$target = $targetBase . '/~~' . rawurlencode($serverId) . '/action.php';

// ----- Read incoming form data -----
$postFields = $_POST; // application/x-www-form-urlencoded
if (!$postFields) {
    // Fallback: read raw body if PHP didn't parse it
    parse_str(file_get_contents('php://input'), $postFields);
}
$act = isset($postFields['act']) ? strtolower($postFields['act']) : '';

// If logging out, clear our mirrored cookie early for responsiveness
if ($act === 'logout') {
    // Expire our local cookie immediately
    setcookie('ps_sid', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

// ----- Prepare upstream request -----
$ch = curl_init($target);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
// Include upstream headers in output so we can parse Set-Cookie
curl_setopt($ch, CURLOPT_HEADER, true);
// Set a short timeout to fail fast
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
// Forward a user-agent for traceability
curl_setopt($ch, CURLOPT_USERAGENT, 'PS-LoginProxy/1.1 (+server-pokemondnd-xyz)');

// Replay upstream cookie from our mirrored cookie if present
$cookieHdrs = [];
if (!empty($_COOKIE['ps_sid'])) {
    $cookieHdrs[] = 'sid=' . $_COOKIE['ps_sid'];
}
if ($cookieHdrs) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Cookie: ' . implode('; ', $cookieHdrs),
    ]);
}

$raw = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($raw === false) {
    header('Content-Type: text/plain; charset=utf-8');
    http_response_code(502);
    echo 'Proxy error: ' . $err;
    exit;
}

// Split headers/body
$headerEnd = strpos($raw, "\r\n\r\n");
if ($headerEnd === false) {
    $headersPart = '';
    $body = $raw;
} else {
    $headersPart = substr($raw, 0, $headerEnd);
    $body = substr($raw, $headerEnd + 4);
}

// Mirror upstream Set-Cookie(sid=...) into a first-party cookie so it persists across reloads
foreach (explode("\r\n", $headersPart) as $line) {
    if (stripos($line, 'Set-Cookie:') === 0) {
        // Example: Set-Cookie: sid=abcdef; Path=/; HttpOnly; Secure; SameSite=Lax
        if (preg_match('/sid=([^;]+)/i', $line, $m)) {
            $sid = $m[1];
            if ($sid === 'deleted' || $sid === '') {
                // Upstream cleared cookie
                setcookie('ps_sid', '', [
                    'expires' => time() - 3600,
                    'path' => '/',
                    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);
            } else {
                // Persist for ~30 days (matches typical PS behavior)
                setcookie('ps_sid', $sid, [
                    'expires' => time() + 60 * 60 * 24 * 30,
                    'path' => '/',
                    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);
            }
        }
    }
}

// Pass through upstream status if useful (normally 200)
if ($code && $code !== 200) {
    http_response_code($code);
}
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
echo $body;
