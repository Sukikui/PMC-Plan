export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function getPagination(searchParams: URLSearchParams, defaultSize = 24) {
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get('pageSize')) || defaultSize),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function toPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
