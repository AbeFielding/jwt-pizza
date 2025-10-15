import { expect } from '../fixtures/coverage';

type RoleName = 'admin' | 'franchisee' | 'diner';

export type InitOpts = {
  loggedInEmail?: string | null;
  roles?: RoleName[];
  menu?: Array<{ id: number; title: string; image: string; price: number; description: string }>;
};

export async function basicInit(page: any, opts: InitOpts = {}) {
  // Default mock menu
  const menu = opts.menu ?? [
    { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
    { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
  ];

  const rolesFromOpts = (opts.roles ?? ['diner']).map((r) => ({ role: r }));

  const validUsers: Record<string, any> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: 'diner' }] },
    'admin@jwt.com': { id: '1', name: 'Admin User', email: 'admin@jwt.com', password: 'admin', roles: rolesFromOpts },
    'fran@jwt.com': { id: '2', name: 'Fran User', email: 'fran@jwt.com', password: 'fran', roles: [{ role: 'franchisee', objectId: '2' }] },
  };

  // a working list for the Users table mock
  let mockUsers: any[] = [
    { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] },
    { id: 5, name: 'Buddy', email: 'b@jwt.com', roles: [{ role: 'admin' }] },
  ];

  let loggedInUser = opts.loggedInEmail ? validUsers[opts.loggedInEmail] ?? null : null;

  if (loggedInUser) {
    await page.addInitScript((t: string) => localStorage.setItem('token', t), 'abcdef');
  }

  // --- AUTH ---
  await page.route('*/**/api/auth', async (route: any) => {
    const method = route.request().method();
    if (method !== 'PUT') return route.fulfill({ status: 200, json: {} }); // logout/refresh
    const body = route.request().postDataJSON() || {};
    const user = validUsers[body.email];
    expect(method).toBe('PUT');
    if (!user || user.password !== body.password) {
      return route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
    }
    loggedInUser = user;
    return route.fulfill({ json: { user, token: 'abcdef' } });
  });

  // --- REGISTER ---
  await page.route('*/**/api/register', async (route: any) => {
    const body = route.request().postDataJSON() || {};
    if (!body.email || !body.password) {
      return route.fulfill({ status: 400, json: { error: 'Bad Request' } });
    }
    return route.fulfill({ status: 201, json: { ok: true } });
  });

  // --- CURRENT USER ---
  await page.route('*/**/api/user/me', async (route: any) => {
    expect(route.request().method()).toBe('GET');
    return route.fulfill({ json: loggedInUser ?? null });
  });

  // --- USER DELETE (DELETE /api/user/:id) ---
  await page.route(/\/api\/user\/\d+$/, async (route: any) => {
    if (route.request().method() !== 'DELETE') {
      return route.fallback();
    }
    const pathname = new URL(route.request().url()).pathname;
    const m = pathname.match(/\/api\/user\/(\d+)$/);
    if (!m) {
      return route.fulfill({ status: 400, body: JSON.stringify({ message: 'bad request' }) });
    }
    const id = Number(m[1]);
    mockUsers = mockUsers.filter((u) => Number(u.id) !== id);
    return route.fulfill({ status: 200, body: JSON.stringify({ message: 'user deleted' }) });
  });

  // --- UPDATE USER (PUT /api/user/:id) ---
  await page.route(/\/api\/user\/\d+$/, async (route: any) => {
    const method = route.request().method();
    if (method !== 'PUT') {
      // IMPORTANT: allow other handlers (like DELETE above) to catch it
      return route.fallback();
    }

    const body = route.request().postDataJSON() || {};
    if (!loggedInUser) {
      return route.fulfill({ status: 401, json: { message: 'unauthorized' } });
    }

    if (body.email && body.email !== loggedInUser.email) {
      delete validUsers[loggedInUser.email];
    }

    loggedInUser = { ...loggedInUser, ...body };
    validUsers[loggedInUser.email] = loggedInUser;

    return route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
  });

  // --- USERS LIST (GET /api/user) ---
  await page.route(/\/api\/user(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    const url = new URL(route.request().url());
    const pageParam = Number(url.searchParams.get('page') || '1');
    const limitParam = Number(url.searchParams.get('limit') || '10');
    const nameParam = (url.searchParams.get('name') || '*').trim();
    const needle = nameParam === '*' || nameParam === '' ? null : nameParam.toLowerCase();

    let filtered = mockUsers;
    if (needle) {
      filtered = mockUsers.filter((u) => (u.name || '').toLowerCase().includes(needle));
    }

    const start = Math.max(0, (pageParam - 1) * limitParam);
    const slice = filtered.slice(start, start + limitParam);
    const more = start + limitParam < filtered.length;

    return route.fulfill({ status: 200, body: JSON.stringify({ users: slice, more }) });
  });

  // --- MENU ---
  await page.route('*/**/api/order/menu', async (route: any) => {
    expect(route.request().method()).toBe('GET');
    return route.fulfill({ json: menu });
  });

  // --- FRANCHISE LIST (admin) ---
  await page.route(/\/api\/franchise(\?.*)?$/, async (route: any) => {
    return route.fulfill({
      json: {
        franchises: [
          {
            id: '2',
            name: 'LotaPizza',
            stores: [
              { id: '4', name: 'Lehi' },
              { id: '5', name: 'Springville' },
              { id: '6', name: 'American Fork' },
            ],
          },
        ],
        more: false,
      },
    });
  });

  // --- FRANCHISE OF-USER (franchisee) ---
  await page.route(/\/api\/franchise\/of-user(\?.*)?$/, async (route: any) => {
    return route.fulfill({
      json: {
        franchise: {
          id: '2',
          name: 'LotaPizza',
          admins: [{ email: 'fran@jwt.com', id: '2', name: 'Fran User' }],
          stores: [
            { id: '4', name: 'Lehi' },
            { id: '5', name: 'Springville' },
          ],
        },
      },
    });
  });

  // --- FRANCHISE BY ID ---
  await page.route(/\/api\/franchise\/2(\?.*)?$/, async (route: any) => {
    return route.fulfill({
      json: [
        {
          id: '2',
          name: 'LotaPizza',
          stores: [
            { id: '4', name: 'Lehi' },
            { id: '5', name: 'Springville' },
          ],
        },
      ],
    });
  });

  // --- ORDER (consolidated) ---
  await page.route(/\/api\/order(?!\/menu)(\/.*)?(\?.*)?$/, async (route: any) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        json: {
          orders: [
            {
              id: 'o1',
              items: [
                { menuId: 1, description: 'Veggie', price: 0.0038 },
                { menuId: 2, description: 'Pepperoni', price: 0.0042 },
              ],
              total: 0.008,
              storeId: '4',
              status: 'Delivered',
              createdAt: '2025-01-01T12:00:00Z',
            },
          ],
          more: false,
        },
      });
    }
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON() || {};
      return route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
    }
    return route.fulfill({ status: 200, json: {} });
  });

  // --- ORDER VERIFY ---
  await page.route('*/**/api/order/verify', async (route: any) => {
    const body = route.request().postDataJSON() || {};
    return route.fulfill({ json: { verified: !!body?.orderId } });
  });

  // --- DOCS ---
  await page.route('**/api/docs', async (route: any) => {
    return route.fulfill({ json: { endpoints: [] } });
  });

  await page.goto('/');
}
