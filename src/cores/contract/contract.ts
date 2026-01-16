import { initContract } from '@ts-rest/core';

const c = initContract();

export const userContract = c.router({
  getUsers: {
    method: 'GET',
    path: '/users/test',
    responses: {
      200: c.type<string>(),
    },
    summary: 'Test contract',
  },
});
