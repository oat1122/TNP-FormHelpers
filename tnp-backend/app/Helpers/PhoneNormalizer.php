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

    /**
     * Format a Thai phone number to standard display:
     *   - 10 digits starting with 0  → 0XX-XXX-XXXX (mobile + most landline)
     *   - 9 digits starting with 0   → 0X-XXX-XXXX (Bangkok 02)
     *   - other lengths              → returned unchanged
     *
     * Accepts already-formatted input (will normalize to standard format).
     */
    public static function formatThai(?string $value): string
    {
        $raw = (string) ($value ?? '');
        $digits = self::digitsOnly($raw);

        if (strlen($digits) === 10 && $digits[0] === '0') {
            return substr($digits, 0, 3).'-'.substr($digits, 3, 3).'-'.substr($digits, 6, 4);
        }

        if (strlen($digits) === 9 && $digits[0] === '0') {
            return substr($digits, 0, 2).'-'.substr($digits, 2, 3).'-'.substr($digits, 5, 4);
        }

        return $raw;
    }

    /**
     * Format a comma/space/slash-separated phone string. Splits on common
     * separators, formats each part with formatThai(), joins with ", ".
     */
    public static function formatThaiList(?string $value): string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '') {
            return '';
        }

        $parts = array_filter(preg_split('/[,\s\/|]+/', $raw));
        $formatted = array_map([self::class, 'formatThai'], $parts);

        return implode(', ', $formatted);
    }
}
