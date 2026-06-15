import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { queryOne } from '../../utils/query.util';
import { signToken } from '../../utils/jwt.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { SignupBody, LoginBody, User, UserPublic } from '../../config/types';

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role }: SignupBody = req.body;
    if (!name || !email || !password) {
      sendError(res, 'Name, email, and password are required.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    if (role && !['contributor', 'maintainer'].includes(role)) {
      sendError(
        res,
        'Role must be either contributor or maintainer.',
        null,
        StatusCodes.BAD_REQUEST
      );
      return;
    }

    const existing = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing) {
      sendError(res, 'An account with this email already exists.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role ?? 'contributor';

    const newUser = await queryOne<UserPublic>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashedPassword, userRole]
    );

    sendSuccess(res, 'User registered successfully', newUser, StatusCodes.CREATED);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginBody = req.body;
    if (!email || !password) {
      sendError(res, 'Email and password are required.', null, StatusCodes.BAD_REQUEST);
      return;
    }
    const user = await queryOne<User>(
      'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      sendError(res, 'Invalid email or password.', null, StatusCodes.UNAUTHORIZED);
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password.', null, StatusCodes.UNAUTHORIZED);
      return;
    }
    const token = signToken({ id: user.id, name: user.name, role: user.role });
    sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
