import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { GET } from '@/app/api/account/content/route';
import { listContentManagement } from '@/lib/content-management/query';

jest.mock('@/lib/content-management/query', () => ({
  listContentManagement: jest.fn(),
}));

const mockedAuth = auth as jest.Mock;
const mockedListContentManagement = listContentManagement as jest.Mock;

describe('account content API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });
    mockedListContentManagement.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 7,
        total: 0,
        totalPages: 1,
      },
    });
  });

  it('scopes content to the authenticated manager', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/account/content?type=space',
    ));

    expect(response.status).toBe(200);
    expect(mockedListContentManagement).toHaveBeenCalledWith({
      filter: 'all',
      managerId: 'user-1',
      page: 1,
      query: '',
      type: 'space',
    });
  });

  it('requires an authenticated Discord account', async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(new NextRequest(
      'http://localhost/api/account/content?type=place',
    ));

    expect(response.status).toBe(401);
    expect(mockedListContentManagement).not.toHaveBeenCalled();
  });
});
