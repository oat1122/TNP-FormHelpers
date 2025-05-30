<?php

namespace App\Services;

class UserService
{
    public function extractBaseUsernames(string $username)
    {
        $parts = preg_split('/[-_]/', $username);
        return $parts[0];
    }
}
