<?php

namespace App\Services;

use App\Models\PricingRequest;
use DateTime;
use Illuminate\Support\Facades\DB;

class PricingService
{

    public function generatePricingNo()
    {
        // init priceing no when start new month
        $result_pricing_no = 1;
        $date_now = new DateTime();
        $year = $date_now->format('Y');
        $month = $date_now->format('m');
        $prefix_pricing_no = 'P' . $year . '-' . $month;

        $max_id = PricingRequest::where('pr_no', 'LIKE', '%' . $prefix_pricing_no . '%')
            ->orderBy('pr_created_date', 'desc')
            ->max(DB::raw('CAST(SUBSTRING_INDEX(pr_no, "-", -1) AS UNSIGNED)'));

        $result_pricing_no = $max_id ? $max_id + 1 : 1;

        // Format the result
        $init_id_with_zero = str_pad($result_pricing_no, 4, '0', STR_PAD_LEFT);
        $result = $prefix_pricing_no . '-' . $init_id_with_zero;

        return $result;
    }

    public function resultWithNoteType($data_query, $note_type)
    {
        $result = [];
        $data = $data_query->where('prn_note_type', $note_type);

        if (count($data) > 0) {

            foreach($data as $item) {
                $note_data = [
                    'prn_id' => $item->prn_id ?? '',
                    'prn_pr_id' => $item->prn_pr_id ?? '',
                    'prn_text' => $item->prn_text ?? '',
                    'prn_note_type' => $item->prn_note_type ?? '',
                    'prn_created_date' => $item->prn_created_date ?? '',
                    'prn_created_by' => $item->prn_created_by ?? '',
                    'created_name' => $item->prnCreatedBy->user_nickname ?? '',
                ];

                $result[] = $note_data;
            }
        }
        return $result;
    }
}
