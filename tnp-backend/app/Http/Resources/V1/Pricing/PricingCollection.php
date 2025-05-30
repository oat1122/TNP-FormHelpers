<?php

namespace App\Http\Resources\V1\Pricing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PricingCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request)
    {
        return parent::toArray($request);
    }
    
}
