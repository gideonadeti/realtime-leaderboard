import { AttachUserMiddleware } from './attach-user.middleware';

describe('AttachUserMiddleware', () => {
  it('should be defined', () => {
    expect(new AttachUserMiddleware()).toBeDefined();
  });
});
