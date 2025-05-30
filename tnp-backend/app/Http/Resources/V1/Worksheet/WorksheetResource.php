<?php

namespace App\Http\Resources\V1\Worksheet;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\WorksheetService;

class WorksheetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->load('user', 'customer', 'fabric', 'shirtPattern', 'shirtScreen', 'exampleQty', 'poloDetail', 'nwsCreatedBy');
       
        $worksheetService = new WorksheetService;
        $status_result = $worksheetService->convertStatus($this->worksheet_id);
        $pattern_type = optional($this->shirtPattern)->pattern_type;
        $fabric_custom_data = optional($this->fabric)->fabricCustoms?->toArray() ?? [];
        $fabric_custom_result = $worksheetService->extractFabricCustomColor($fabric_custom_data);
        $crewneck_color = optional($this->fabric)->crewneck_color;
        $crewneck_selected = $crewneck_color != '' ? '1' : '0';
        $example_data = optional($this->exampleQty)?->toArray() ?? [];
        $example_qty_result = $worksheetService->filterExampleShirtByType($example_data, $this->worksheet_id, $pattern_type);
        $polo_embroider_data = optional($this->poloDetail)->poloEmbroiders?->toArray() ?? [];
        $polo_embroider_result = $worksheetService->transformData($polo_embroider_data, ['polo_embroider_id', 'embroider_position', 'embroider_size']);
        $images_r = $this->images ? url('storage/images/worksheet/' . $this->images) : '';
        $shirt_sizes_data = optional($this->shirtPattern)->shirtSizes?->toArray() ?? [];
        $pattern_sizes_r = $worksheetService->filterShirtPatternByType($shirt_sizes_data, $this->pattern_id, $this->worksheet_id);

        $data = [
            'worksheet_id' => $this->worksheet_id,
            'work_id' => $this->work_id,
            'work_name' => $this->work_name,
            'due_date' => $this->due_date,
            'exam_date' => $this->exam_date,
            'total_quantity' => $this->total_quantity,
            'worksheet_note' => $this->worksheet_note ?? '',
            'type_shirt' => $this->type_shirt,
            'size_tag' => $this->size_tag ?? '',
            'packaging' => $this->packaging ?? '',
            'shirt_detail' => $this->shirt_detail ?? '',
            'status' => $status_result,
            'date_created' => $this->date_created,
            'deleted' => $this->deleted,
            'creator_name' => $this->creator_name ?? '',
            'manager_name' => $this->manager_name ?? '',
            'production_name' => $this->production_name ?? '',
            'images' => $images_r,
            // Sales data
            'user_id' => optional($this->user)->user_id,
            'sales_name' => ucfirst($this->nwsCreatedBy?->username),
            // Customer data
            'cus_id' => optional($this->customer)->cus_id,
            'cus_name' => optional($this->customer)->cus_name ?? '',
            'cus_company' => optional($this->customer)->cus_company ?? '',
            'cus_address' => optional($this->customer)->cus_address ?? '',
            'cus_tel_1' => optional($this->customer)->cus_tel_1 ?? '',
            'cus_email' => optional($this->customer)->cus_email ?? '',
            // Fabric data
            'fabric_id' => $this->fabric_id,
            'fabric_name' => optional($this->fabric)->fabric_name,
            'fabric_no' => optional($this->fabric)->fabric_no ?? '',
            'fabric_color' => optional($this->fabric)->fabric_color,
            'fabric_color_no' => optional($this->fabric)->fabric_color_no ?? '',
            'crewneck_selected' => $crewneck_selected,
            'crewneck_color' => optional($this->fabric)->crewneck_color ?? '',
            'fabric_factory' => optional($this->fabric)->fabric_factory,
            'fabric_custom_color' => $fabric_custom_result,
            // Pattern data
            'pattern_id' => $this->pattern_id,
            'pattern_name' => optional($this->shirtPattern)->pattern_name,
            'pattern_type' => (string) $pattern_type,
            'pattern_sizes' => $pattern_sizes_r,
            // Shirt screen data
            'screen_id' => $this->screen_id,
            'screen_point' => optional($this->shirtScreen)->screen_point ?? '',
            'screen_flex' => optional($this->shirtScreen)->screen_flex ?? '',
            'screen_dft' => optional($this->shirtScreen)->screen_dft ?? '',
            'screen_label' => optional($this->shirtScreen)->screen_label ?? '',
            'screen_embroider' => optional($this->shirtScreen)->screen_embroider ?? '',
            'screen_detail' => optional($this->shirtScreen)->screen_detail ?? '',
            // Example quantity data
            'example_quantity' => $example_qty_result,

            'nws_created_date' => $this->nws_created_date ?? null,
            'nws_created_by' => $this->nws_created_by ?? '',
            'nws_updated_date' => $this->nws_updated_date ?? null,
            'nws_updated_by' => $this->nws_updated_by ?? '',
        ];

        // Polo data
        if ($this->type_shirt === 'polo-shirt') {
            $poloData = [
                'polo_detail_id' => optional($this->poloDetail)->polo_detail_id ?? '',
                'collar' => optional($this->poloDetail)->collar ?? '',
                'collar_type' => optional($this->poloDetail)->collar_type ?? '',
                'other_collar_type' => optional($this->poloDetail)->other_collar_type ?? '',
                'collar_type_detail' => optional($this->poloDetail)->collar_type_detail ?? '',
                'placket' => optional($this->poloDetail)->placket ?? '',
                'other_placket' => optional($this->poloDetail)->other_placket ?? '',
                'outer_placket' => optional($this->poloDetail)->outer_placket ? true : false,
                'outer_placket_detail' => optional($this->poloDetail)->outer_placket_detail ?? '',
                'inner_placket' => optional($this->poloDetail)->inner_placket ? true : false,
                'inner_placket_detail' => optional($this->poloDetail)->inner_placket_detail ?? '',
                'button' => optional($this->poloDetail)->button ?? '',
                'other_button' => optional($this->poloDetail)->other_button ?? '',
                'button_color' => optional($this->poloDetail)->button_color ?? '',
                'sleeve' => optional($this->poloDetail)->sleeve ?? '',
                'sleeve_detail' => optional($this->poloDetail)->sleeve_detail ?? '',
                'pocket' => optional($this->poloDetail)->pocket ?? '',
                'pocket_detail' => optional($this->poloDetail)->pocket_detail ?? '',
                'bottom_hem' => optional($this->poloDetail)->bottom_hem ? true : false,
                'bottom_hem_detail' => optional($this->poloDetail)->bottom_hem_detail ?? '',
                'back_seam' => optional($this->poloDetail)->back_seam ? true : false,
                'back_seam_detail' => optional($this->poloDetail)->back_seam_detail ?? '',
                'side_vents' => optional($this->poloDetail)->side_vents ? true : false,
                'side_vents_detail' => optional($this->poloDetail)->side_vents_detail ?? '',
                'polo_embroider' => $polo_embroider_result,
            ];
            $data = array_merge($data, $poloData);
        }

        return $data;
    }
}
