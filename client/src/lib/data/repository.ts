import type { Result, RequestConfig, PaginatedResponse, ListParams, RepositoryContext } from "./types";

function buildQueryString(params: ListParams): Record<string, string | number | boolean | readonly string[] | undefined> {
  const query: Record<string, string | number | boolean | readonly string[] | undefined> = {};

  if (params.pagination?.page) query.page = params.pagination.page;
  if (params.pagination?.limit) query.limit = params.pagination.limit;
  if (params.pagination?.cursor) query.cursor = params.pagination.cursor;

  if (params.sort && params.sort.length > 0) {
    query.sort = params.sort.map((s) => `${s.field}:${s.direction}`);
  }

  if (params.filters && params.filters.length > 0) {
    params.filters.forEach((f, i) => {
      query[`filter[${i}][field]`] = f.field;
      query[`filter[${i}][operator]`] = f.operator;
      query[`filter[${i}][value]`] = String(f.value);
    });
  }

  if (params.search) query.search = params.search;

  return query;
}

export function createRepository(context: RepositoryContext) {
  const { client, basePath } = context;

  async function getById<T>(id: string | number, requestConfig?: RequestConfig): Promise<Result<T>> {
    return client.get<T>(`${basePath}/${id}`, requestConfig);
  }

  async function list<T>(params?: ListParams, requestConfig?: RequestConfig): Promise<Result<readonly T[]>> {
    const queryParams = params ? buildQueryString(params) : undefined;
    return client.get<readonly T[]>(basePath, {
      ...requestConfig,
      params: { ...queryParams, ...requestConfig?.params },
    });
  }

  async function listPaginated<T>(
    params?: ListParams,
    requestConfig?: RequestConfig,
  ): Promise<Result<PaginatedResponse<T>>> {
    const queryParams = params ? buildQueryString(params) : undefined;
    return client.get<PaginatedResponse<T>>(`${basePath}/paginated`, {
      ...requestConfig,
      params: { ...queryParams, ...requestConfig?.params },
    });
  }

  async function create<TRequest, TResponse>(
    body: TRequest,
    requestConfig?: RequestConfig,
  ): Promise<Result<TResponse>> {
    return client.post<TResponse>(basePath, body, requestConfig);
  }

  async function update<TRequest, TResponse>(
    id: string | number,
    body: TRequest,
    requestConfig?: RequestConfig,
  ): Promise<Result<TResponse>> {
    return client.put<TResponse>(`${basePath}/${id}`, body, requestConfig);
  }

  async function patch<TRequest, TResponse>(
    id: string | number,
    body: Partial<TRequest>,
    requestConfig?: RequestConfig,
  ): Promise<Result<TResponse>> {
    return client.patch<TResponse>(`${basePath}/${id}`, body, requestConfig);
  }

  async function remove<T>(id: string | number, requestConfig?: RequestConfig): Promise<Result<T>> {
    return client.delete<T>(`${basePath}/${id}`, requestConfig);
  }

  return {
    getById,
    list,
    listPaginated,
    create,
    update,
    patch,
    remove,
    getClient: () => client,
    getBasePath: () => basePath,
  };
}

export type Repository = ReturnType<typeof createRepository>;
