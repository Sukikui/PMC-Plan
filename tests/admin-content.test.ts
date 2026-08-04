import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { GET } from '@/app/api/admin/content/route';
import { listContentManagement } from '@/lib/content-management/query';

jest.mock('@/lib/content-management/query', () => ({
  listContentManagement: jest.fn(),
}));

const mockedAuth = auth as jest.Mock;
const mockedListContentManagement = listContentManagement as jest.Mock;

describe('admin content API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockedListContentManagement.mockResolvedValue({
      items: [],
      pagination: {
        page: 2,
        pageSize: 7,
        total: 21,
        totalPages: 4,
      },
    });
  });

  it('returns a validated paginated content page', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/admin/content?type=portal&page=2&query=valny&filter=linked',
    ));

    expect(response.status).toBe(200);
    expect(mockedListContentManagement).toHaveBeenCalledWith({
      filter: 'linked',
      page: 2,
      query: 'valny',
      type: 'portal',
    });
    expect((await response.json()).pagination.total).toBe(21);
  });

  it('rejects missing or invalid content parameters', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/admin/content?filter=invalid',
    ));

    expect(response.status).toBe(400);
    expect(mockedListContentManagement).not.toHaveBeenCalled();
  });

  it('removes access while previewing User mode', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/admin/content?type=space',
      {
        headers: {
          cookie: [
            'pmc-plan-admin-debug=true',
            'pmc-plan-admin-mode=user',
          ].join('; '),
        },
      },
    ));

    expect(response.status).toBe(403);
    expect(mockedListContentManagement).not.toHaveBeenCalled();
  });
});
