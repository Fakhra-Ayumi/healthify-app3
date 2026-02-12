import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../src/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your_temporary_secret_key';

// Minimal mock helpers — no Express, no DB
const mockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res;
};

describe('Unit: Auth Middleware', () => {

  it('should return 401 when no token is provided', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    expect(res.statusCode).to.equal(401);
    expect(res.body.message).to.include('Access denied');
    expect(nextCalled).to.be.false;
  });

  it('should return 401 when Authorization header has no Bearer token', () => {
    const req: any = { headers: { authorization: 'Token abc' } };
    const res = mockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    // 'Token abc'.split(' ')[1] → 'abc', but jwt.verify will fail → 403
    // Actually: split on ' ' gives ['Token', 'abc'], token = 'abc', jwt.verify fails → 403
    expect([401, 403]).to.include(res.statusCode);
    expect(nextCalled).to.be.false;
  });

  it('should return 403 for an invalid/expired token', () => {
    const req: any = { headers: { authorization: 'Bearer totallyinvalid' } };
    const res = mockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.include('Invalid token');
    expect(nextCalled).to.be.false;
  });

  it('should call next() and attach req.user for a valid token', () => {
    const payload = { userId: 'abc123' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    expect(nextCalled).to.be.true;
    expect(req.user).to.have.property('userId', 'abc123');
  });

  it('should reject an expired token', () => {
    const token = jwt.sign({ userId: 'x' }, JWT_SECRET, { expiresIn: '0s' });
    // Small delay so the token is actually expired
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    // jwt.sign with 0s expires immediately
    authenticateToken(req, res, () => { nextCalled = true; });

    expect(res.statusCode).to.equal(403);
    expect(nextCalled).to.be.false;
  });
});
