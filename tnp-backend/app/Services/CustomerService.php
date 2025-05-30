<?php

namespace App\Services;

use App\Models\Worksheet\Customer;
use Illuminate\Support\Facades\DB;
use DateTime;
use Carbon\Carbon;

class CustomerService
{
    public function groupByCustomer()
    {
        $query = Customer::query()
            ->select([
                'customer_name',
                'company_name',
                'customer_tel',
                'customer_email',
            ])
            ->groupBy(
                'customer_name',
                'company_name',
                'customer_tel',
                'customer_email',
            )
            ->get();

        return $query;
    }

    // ฟังก์ชันสำหรับการคำนวณเวลาติดตามลูกค้า
    public function setRecallDatetime($default_recall_datetime)
    {
        $datetime = new DateTime();
        $datetime->modify('+' . $default_recall_datetime);
        $datetime->setTime(23, 59, 59);
        return $datetime;
    }

    // generate customer number
    public static function genCustomerNo(string $lastCustomerNumber = null): string
    {
        $currentYear = Carbon::now()->year;
        $yearStr = (string) $currentYear;

        if ($lastCustomerNumber) {
            $lastYear = substr($lastCustomerNumber, 0, 4);
            $lastId = (int) substr($lastCustomerNumber, 4);

            if ($lastYear == $yearStr) {
                $nextId = $lastId + 1;
            } else {
                $nextId = 1;
            }
        } else {
            $nextId = 1;
        }

        $customerId = $yearStr . sprintf("%06d", $nextId); // Pad with zeros
        return $customerId;
    }
}
