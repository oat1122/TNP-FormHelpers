<?php

namespace App\Services;

use App\Models\MaxSupply;

class MaxSupplyService
{
    public function create(array $data): MaxSupply
    {
        return MaxSupply::create($data);
    }

    public function update(MaxSupply $maxSupply, array $data): MaxSupply
    {
        $maxSupply->update($data);
        return $maxSupply;
    }
}
