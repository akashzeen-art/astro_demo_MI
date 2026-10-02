<?php
/**
 * OpenAI chat completions proxy — deployed with the static frontend.
 * Avoids CORS and keeps the API key off the client bundle.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => ['message' => 'Method not allowed']]);
    exit;
}

$OPENAI_API_KEY = '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';

$body = file_get_contents('php://input');
if ($body === false || $body === '') {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Empty request body']]);
    exit;
}

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $OPENAI_API_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 120,
]);

$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'Proxy failed: ' . $error]]);
    exit;
}

http_response_code($status ?: 500);
echo $response;
