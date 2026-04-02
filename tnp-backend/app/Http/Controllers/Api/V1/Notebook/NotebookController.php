<?php

namespace App\Http\Controllers\Api\V1\Notebook;

use App\Helpers\UserSubRoleHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Notebook\CustomerCareSourceIndexRequest;
use App\Http\Requests\V1\Notebook\ConvertNotebookRequest;
use App\Http\Requests\V1\Notebook\NotebookIndexRequest;
use App\Http\Requests\V1\Notebook\ReserveNotebookRequest;
use App\Http\Requests\V1\Notebook\StoreNotebookLeadRequest;
use App\Http\Requests\V1\Notebook\StoreNotebookRequest;
use App\Http\Requests\V1\Notebook\StoreCustomerCareNotebookRequest;
use App\Http\Requests\V1\Notebook\UpdateNotebookRequest;
use App\Http\Resources\V1\Notebook\NotebookResource;
use App\Models\MasterCustomer;
use App\Models\Notebook;
use App\Repositories\NotebookRepositoryInterface;
use App\Services\Notebook\NotebookService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotebookController extends Controller
{
    public function __construct(
        protected NotebookRepositoryInterface $notebookRepository,
        protected NotebookService $notebookService
    ) {}

    public function index(NotebookIndexRequest $request): JsonResponse
    {
        $filters = $request->filters();

        if (! $request->shouldPaginate()) {
            $notebooks = $this->notebookRepository->getFilteredCollection($filters, $request->user());

            return response()->json($this->transformCollection($notebooks, $request));
        }

        $paginator = $this->notebookRepository->getFilteredPaginated($filters, $request->user());
        $paginator->setCollection(collect($this->transformCollection($paginator->getCollection(), $request)));

        return response()->json($paginator);
    }

    public function store(StoreNotebookRequest $request): JsonResponse
    {
        $notebook = $this->notebookService->create($request->validated(), $request->user());

        return response()->json($this->transformItem($notebook, $request), 201);
    }

    public function storeCustomerCare(StoreCustomerCareNotebookRequest $request): JsonResponse
    {
        try {
            $notebook = $this->notebookService->createCustomerCare($request->validated(), $request->user());

            return response()->json($this->transformItem($notebook, $request), 201);
        } catch (AuthorizationException $exception) {
            return $this->forbiddenResponse($exception->getMessage());
        } catch (\DomainException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function storeLead(StoreNotebookLeadRequest $request): JsonResponse
    {
        try {
            $notebook = $this->notebookService->createLead($request->validated(), $request->user());

            return response()->json($this->transformItem($notebook, $request), 201);
        } catch (AuthorizationException $exception) {
            return $this->forbiddenResponse($exception->getMessage());
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $notebook = $this->notebookRepository->findWithRelationsOrFail($id);
            $this->notebookService->authorizeAccess($request->user(), $notebook, 'view');

            return response()->json($this->transformItem($notebook, $request));
        } catch (AuthorizationException $exception) {
            return $this->forbiddenResponse($exception->getMessage());
        }
    }

    public function update(UpdateNotebookRequest $request, string $id): JsonResponse
    {
        $notebook = $this->notebookService->update($id, $request->validated(), $request->user());

        return response()->json($this->transformItem($notebook, $request));
    }

    public function convert(ConvertNotebookRequest $request, string $id): JsonResponse
    {
        try {
            $notebook = $this->notebookService->convert($id, $request->validated(), $request->user());

            return response()->json($this->transformItem($notebook, $request));
        } catch (\DomainException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function customerCareSources(CustomerCareSourceIndexRequest $request): JsonResponse
    {
        try {
            $filters = $request->validated();
            $source = $filters['source'];
            $paginator = $this->notebookService->searchCustomerCareSources($filters, $request->user());
            $paginator->setCollection(collect($paginator->getCollection())
                ->map(fn ($item) => $this->transformCustomerCareSourceItem($item, $source))
                ->values());

            return response()->json($paginator);
        } catch (AuthorizationException $exception) {
            return $this->forbiddenResponse($exception->getMessage());
        }
    }

    public function reserve(ReserveNotebookRequest $request, string $id): JsonResponse
    {
        try {
            $notebook = $this->notebookService->reserve($id, $request->user());

            return response()->json($this->transformItem($notebook, $request));
        } catch (\DomainException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function selfReport(NotebookIndexRequest $request): JsonResponse
    {
        if (! UserSubRoleHelper::canExportNotebookSelfReport($request->user())) {
            return $this->forbiddenResponse('Unauthorized: You do not have permission to export this notebook report.');
        }

        $filters = $request->filters();
        $filters['include'] = 'histories';

        $leadAdditions = $this->notebookRepository->getSelfReportLeadAdditions($filters, $request->user());
        $activityItems = $this->notebookRepository->getSelfReportActivityItems($filters, $request->user());

        return response()->json([
            'lead_additions' => $this->transformCollection($leadAdditions, $request),
            'activity_items' => $this->transformCollection($activityItems, $request),
            'meta' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'exported_at' => now()->toISOString(),
            ],
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $this->notebookService->delete($id, $request->user());

            return response()->json(['message' => 'Deleted successfully']);
        } catch (AuthorizationException $exception) {
            return $this->forbiddenResponse($exception->getMessage());
        }
    }

    protected function transformCollection(iterable $notebooks, Request $request): array
    {
        return collect($notebooks)
            ->map(fn ($notebook) => $this->transformItem($notebook, $request))
            ->all();
    }

    protected function transformItem($notebook, Request $request): array
    {
        return (new NotebookResource($notebook))->resolve($request);
    }

    protected function transformCustomerCareSourceItem(mixed $item, string $source): array
    {
        if ($source === Notebook::SOURCE_TYPE_CUSTOMER && $item instanceof MasterCustomer) {
            $contactPerson = trim(($item->cus_firstname ?? '').' '.($item->cus_lastname ?? ''));

            return [
                'id' => $item->cus_id,
                'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
                'source_customer_id' => $item->cus_id,
                'label' => $item->cus_company ?: ($item->cus_name ?: $contactPerson ?: '-'),
                'company' => $item->cus_company,
                'customer_name' => $item->cus_name,
                'contact_person' => $contactPerson !== '' ? $contactPerson : ($item->cus_name ?: null),
                'phone' => $item->cus_tel_1,
                'email' => $item->cus_email,
                'is_online' => (int) ($item->cus_channel ?? 0) === 2,
                'updated_at' => $item->cus_updated_date?->toISOString(),
                'created_at' => $item->cus_created_date?->toISOString(),
            ];
        }

        return [
            'id' => (string) $item->id,
            'source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'source_notebook_id' => $item->id,
            'label' => $item->nb_customer_name,
            'company' => $item->nb_customer_name,
            'customer_name' => $item->nb_customer_name,
            'contact_person' => $item->nb_contact_person,
            'phone' => $item->nb_contact_number,
            'email' => $item->nb_email,
            'is_online' => (bool) $item->nb_is_online,
            'nb_date' => $item->nb_date?->toDateString(),
            'updated_at' => $item->updated_at?->toISOString(),
            'created_at' => $item->created_at?->toISOString(),
        ];
    }

    protected function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 403);
    }
}
