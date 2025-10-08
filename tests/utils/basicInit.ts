// tests/utils/basicInit.ts
import { expect } from '../fixtures/coverage';

type RoleName = 'admin' | 'franchisee' | 'diner';

export type InitOpts = {
  loggedInEmail?: string | null;
  roles?: RoleName[];
  menu?: Array<{ id: number; title: string; image: string; price: number; description: string }>;
};

export async function basicInit(page: any, opts: InitOpts = {}) {
  // Keep menu IDs as NUMBERS (your UI compares numerically)
  const menu = opts.menu ?? [
    { id: 1, title: 'Veggie',    image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
    { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
  ];

  const rolesFromOpts = (opts.roles ?? ['diner']).map(r => ({ role: r }));

  const validUsers: Record<string, any> = {
    'd@jwt.com':     { id: '3', name: 'Kai Chen',   email: 'd@jwt.com',     password: 'a',     roles: [{ role: 'diner' }] },
    'admin@jwt.com': { id: '1', name: 'Admin User', email: 'admin@jwt.com', password: 'admin', roles: rolesFromOpts },
    'fran@jwt.com':  { id: '2', name: 'Fran User',  email: 'fran@jwt.com',  password: 'fran',  roles: [{ role: 'franchisee' }] },
  };

  let loggedInUser = opts.loggedInEmail ? (validUsers[opts.loggedInEmail] ?? null) : null;

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

  // --- MENU (specific endpoint; must NOT be shadowed) ---
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

  // Optional: some apps fetch by id after "of-user"
  await page.route(/\/api\/franchise\/2(\?.*)?$/, async (route: any) => {
    return route.fulfill({
      json: {
        id: '2',
        name: 'LotaPizza',
        stores: [
          { id: '4', name: 'Lehi' },
          { id: '5', name: 'Springville' },
        ],
      },
    });
  });

  // --- ORDER (consolidated) ---
  // IMPORTANT: exclude '/api/order/menu' using negative lookahead so we don't break the Menu page
  await page.route(/\/api\/order(?!\/menu)(\/.*)?(\?.*)?$/, async (route: any) => {
    const method = route.request().method();
    if (method === 'GET') {
      // History / list response (used by diner dashboards)
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
      // Create order response
      const orderReq = route.request().postDataJSON() || {};
      return route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
    }
    // Others
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
