<?php

namespace App\View\Components;

use App\Services\CompanyLogoService;
use Illuminate\View\Component;

class CompanyLogo extends Component
{
    public $companyId;
    public $logoPath;
    public $logoUrl;
    public $cssClass;
    public $alt;
    public $forPdf;

    /**
     * Create a new component instance.
     *
     * @param string|null $companyId
     * @param string $cssClass
     * @param string $alt
     * @param bool $forPdf
     */
    public function __construct($companyId = null, $cssClass = 'logo-img', $alt = 'logo', $forPdf = false)
    {
        $this->companyId = $companyId;
        $this->cssClass = $cssClass;
        $this->alt = $alt;
        $this->forPdf = $forPdf;

        if ($forPdf) {
            $this->logoPath = CompanyLogoService::getLogoPath($companyId);
        } else {
            $this->logoUrl = CompanyLogoService::getLogoUrl($companyId);
        }
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.company-logo');
    }
}
