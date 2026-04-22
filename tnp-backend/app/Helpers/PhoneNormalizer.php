<?php

namespace App\Helpers;

class PhoneNormalizer
{
    public static function digitsOnly(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return (string) preg_replace('/[^0-9]/', '', $value);
    }
}
