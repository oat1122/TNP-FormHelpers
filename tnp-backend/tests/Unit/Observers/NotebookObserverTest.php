<?php

namespace Tests\Unit\Observers;

use App\Models\Notebook;
use App\Observers\NotebookObserver;
use Tests\TestCase;

class NotebookObserverTest extends TestCase
{
    private NotebookObserver $observer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->observer = new NotebookObserver;
    }

    public function test_creating_queue_lead_without_manage_by_is_not_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => null,
        ]);

        $this->observer->creating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_creating_queue_lead_with_manage_by_is_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
        ]);

        $this->observer->creating($notebook);

        $this->assertTrue($notebook->nb_is_fresh_queue);
    }

    public function test_creating_standard_workflow_is_never_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_STANDARD,
            'nb_manage_by' => 5,
        ]);

        $this->observer->creating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_assigned_lead_without_status_or_followup_keeps_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_status' => null,
            'nb_next_followup_note' => null,
        ]);

        $this->observer->updating($notebook);

        $this->assertTrue($notebook->nb_is_fresh_queue);
    }

    public function test_updating_with_status_filled_clears_fresh_flag(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_status' => 'พิจารณา',
        ]);

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_with_followup_date_clears_fresh_flag(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_next_followup_date' => '2026-05-15',
        ]);

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_with_followup_note_clears_fresh_flag(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_next_followup_note' => 'โทรกลับพรุ่งนี้',
        ]);

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_whitespace_only_status_treated_as_no_status(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_status' => '   ',
        ]);

        $this->observer->updating($notebook);

        $this->assertTrue($notebook->nb_is_fresh_queue);
    }

    public function test_updating_converted_lead_clears_fresh_flag(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
        ]);
        $notebook->nb_converted_at = now();

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_standard_workflow_never_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_STANDARD,
            'nb_manage_by' => 5,
        ]);

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_updating_queue_lead_without_manage_by_never_fresh(): void
    {
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => null,
        ]);

        $this->observer->updating($notebook);

        $this->assertFalse($notebook->nb_is_fresh_queue);
    }

    public function test_revert_status_to_empty_brings_back_fresh_flag(): void
    {
        // Edge case: sales กรอก status แล้วลบกลับเป็นว่าง → flag กลับมา
        // (known edge case; documented in plan as accepted behavior for now)
        $notebook = new Notebook([
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_manage_by' => 5,
            'nb_status' => '',
            'nb_next_followup_note' => '',
        ]);

        $this->observer->updating($notebook);

        $this->assertTrue($notebook->nb_is_fresh_queue);
    }
}
