<?php

namespace App\Http\Controllers\Api\V1\Notebook;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Notebook\ConvertNotebookRequest;
use App\Http\Requests\V1\Notebook\NotebookIndexRequest;
use App\Http\Requests\V1\Notebook\StoreNotebookRequest;
use App\Http\Requests\V1\Notebook\UpdateNotebookRequest;
use App\Http\Resources\V1\Notebook\NotebookResource;
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

    protected function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 403);
    }
}
