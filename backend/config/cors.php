<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
<<<<<<< Updated upstream

    'allowed_origins' => ['http://localhost:3000'],

=======
    // We explicitly allow your frontend URL here
    'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
>>>>>>> Stashed changes
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];