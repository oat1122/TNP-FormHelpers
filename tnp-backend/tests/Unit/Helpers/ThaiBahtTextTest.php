<?php

namespace Tests\Unit\Helpers;

use App\Helpers\AccountingHelper;
use Tests\TestCase;

/**
 * Edge cases for AccountingHelper::numberToThaiBaht().
 *
 * The Thai numerical reading system has irregular forms that must be preserved:
 *   - "เอ็ด" instead of "หนึ่ง" for the units digit when the tens digit is non-zero
 *   - "ยี่" instead of "สอง" for "twenty" (20–29)
 *   - dropped "หนึ่ง" prefix for "ten" (10–19, reads as "สิบ" not "หนึ่งสิบ")
 *   - "ล้าน" recursion for numbers > 999,999
 *   - "ถ้วน" suffix when satang is zero
 */
class ThaiBahtTextTest extends TestCase
{
    public function test_zero(): void
    {
        $this->assertSame('ศูนย์บาทถ้วน', AccountingHelper::numberToThaiBaht(0));
    }

    public function test_one(): void
    {
        $this->assertSame('หนึ่งบาทถ้วน', AccountingHelper::numberToThaiBaht(1));
    }

    public function test_ten_drops_หนึ่ง_prefix(): void
    {
        $this->assertSame('สิบบาทถ้วน', AccountingHelper::numberToThaiBaht(10));
        $this->assertSame('สิบเอ็ดบาทถ้วน', AccountingHelper::numberToThaiBaht(11));
    }

    public function test_twenty_uses_ยี่(): void
    {
        $this->assertSame('ยี่สิบบาทถ้วน', AccountingHelper::numberToThaiBaht(20));
        $this->assertSame('ยี่สิบเอ็ดบาทถ้วน', AccountingHelper::numberToThaiBaht(21));
    }

    public function test_hundred_one_uses_เอ็ด(): void
    {
        $this->assertSame('หนึ่งร้อยเอ็ดบาทถ้วน', AccountingHelper::numberToThaiBaht(101));
    }

    public function test_with_satang(): void
    {
        $this->assertSame('ยี่สิบบาทห้าสิบสตางค์', AccountingHelper::numberToThaiBaht(20.50));
        $this->assertSame('หนึ่งบาทยี่สิบห้าสตางค์', AccountingHelper::numberToThaiBaht(1.25));
    }

    public function test_million_recursion(): void
    {
        $this->assertSame('หนึ่งล้านบาทถ้วน', AccountingHelper::numberToThaiBaht(1_000_000));
        $this->assertSame('หนึ่งล้านบาทถ้วน', AccountingHelper::numberToThaiBaht(1_000_000.0));
    }

    public function test_thousand_two_hundred_thirty_four_decimal_fifty_six(): void
    {
        $this->assertSame(
            'หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบหกสตางค์',
            AccountingHelper::numberToThaiBaht(1234.56)
        );
    }

    public function test_rounds_to_two_decimals(): void
    {
        // number_format(... , 2) truncates the 3rd decimal — 1.999 → "2.00"
        $this->assertSame('สองบาทถ้วน', AccountingHelper::numberToThaiBaht(1.999));
    }

    public function test_accepts_integer_string_via_float_cast(): void
    {
        // The implementation casts to (float) — strings work via PHP's coercion
        $this->assertSame('ห้าสิบบาทถ้วน', AccountingHelper::numberToThaiBaht((float) '50'));
    }
}
