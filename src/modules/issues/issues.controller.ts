import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { queryOne, queryMany } from '../../utils/query.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import {
  AuthRequest,
  Issue,
  IssueWithReporter,
  IssueReporter,
  CreateIssueBody,
  UpdateIssueBody,
  IssueQueryParams,
} from '../../config/types';

const attachReporters = async (issues: Issue[]): Promise<IssueWithReporter[]> => {
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

  const reporters = await queryMany<IssueReporter & { id: number }>(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds as unknown as string]
  );

  const reporterMap = new Map<number, IssueReporter>();
  reporters.forEach((r) => {
    reporterMap.set(r.id, { id: r.id, name: r.name, role: r.role });
  });


  return issues.map(({ reporter_id, ...issue }) => ({
    ...issue,
    reporter: reporterMap.get(reporter_id) ?? { id: reporter_id, name: 'Unknown', role: 'contributor' },
  }));
};

export const createIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, type }: CreateIssueBody = req.body;
    const reporterId = req.user!.id;

    if (!title || !description || !type) {
      sendError(res, 'Title, description, and type are required.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    if (title.length > 150) {
      sendError(res, 'Title must not exceed 150 characters.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    if (description.length < 20) {
      sendError(res, 'Description must be at least 20 characters.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    if (!['bug', 'feature_request'].includes(type)) {
      sendError(res, 'Type must be either bug or feature_request.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    const newIssue = await queryOne<Issue>(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      [title, description, type, reporterId]
    );

    sendSuccess(res, 'Issue created successfully', newIssue, StatusCodes.CREATED);
  } catch (err) {
    next(err);
  }
};

export const getAllIssues = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sort = 'newest', type, status }: IssueQueryParams = req.query as IssueQueryParams;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (type) {
      if (!['bug', 'feature_request'].includes(type)) {
        sendError(res, 'Invalid type filter.', null, StatusCodes.BAD_REQUEST);
        return;
      }
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (status) {
      if (!['open', 'in_progress', 'resolved'].includes(status)) {
        sendError(res, 'Invalid status filter.', null, StatusCodes.BAD_REQUEST);
        return;
      }
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const issues = await queryMany<Issue>(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
       FROM issues ${whereClause} ${orderClause}`,
      params
    );
    const issuesWithReporters = await attachReporters(issues);

    sendSuccess(res, 'Issues retrieved successfully', issuesWithReporters);
  } catch (err) {
    next(err);
  }
};

export const getIssueById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const issue = await queryOne<Issue>(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
       FROM issues WHERE id = $1`,
      [id]
    );

    if (!issue) {
      sendError(res, 'Issue not found.', null, StatusCodes.NOT_FOUND);
      return;
    }
    const reporter = await queryOne<IssueReporter>(
      'SELECT id, name, role FROM users WHERE id = $1',
      [issue.reporter_id]
    );

    const { reporter_id, ...issueData } = issue;
    void reporter_id; 

    sendSuccess(res, 'Issue retrieved successfully', {
      ...issueData,
      reporter: reporter ?? { id: issue.reporter_id, name: 'Unknown', role: 'contributor' },
    });
  } catch (err) {
    next(err);
  }
};


export const updateIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type }: UpdateIssueBody = req.body;
    const { id: userId, role: userRole } = req.user!;

    const issue = await queryOne<Issue>(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
       FROM issues WHERE id = $1`,
      [id]
    );

    if (!issue) {
      sendError(res, 'Issue not found.', null, StatusCodes.NOT_FOUND);
      return;
    }

    if (userRole === 'contributor') {
      if (issue.reporter_id !== userId) {
        sendError(
          res,
          'You can only update your own issues.',
          null,
          StatusCodes.FORBIDDEN
        );
        return;
      }

      if (issue.status !== 'open') {
        sendError(
          res,
          'You can only update issues with open status.',
          null,
          StatusCodes.CONFLICT
        );
        return;
      }
    }

    if (title !== undefined) {
      if (title.trim().length === 0) {
        sendError(res, 'Title cannot be empty.', null, StatusCodes.BAD_REQUEST);
        return;
      }
      if (title.length > 150) {
        sendError(res, 'Title must not exceed 150 characters.', null, StatusCodes.BAD_REQUEST);
        return;
      }
    }

    if (description !== undefined && description.length < 20) {
      sendError(res, 'Description must be at least 20 characters.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    if (type !== undefined && !['bug', 'feature_request'].includes(type)) {
      sendError(res, 'Type must be either bug or feature_request.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    const updates: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (updates.length === 0) {
      sendError(res, 'No valid fields provided for update.', null, StatusCodes.BAD_REQUEST);
      return;
    }

    params.push(id);

    const updatedIssue = await queryOne<Issue>(
      `UPDATE issues SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
      params
    );

    sendSuccess(res, 'Issue updated successfully', updatedIssue);
  } catch (err) {
    next(err);
  }
};


export const deleteIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const issue = await queryOne<Issue>('SELECT id FROM issues WHERE id = $1', [id]);

    if (!issue) {
      sendError(res, 'Issue not found.', null, StatusCodes.NOT_FOUND);
      return;
    }

    await queryOne('DELETE FROM issues WHERE id = $1', [id]);

    sendSuccess(res, 'Issue deleted successfully');
  } catch (err) {
    next(err);
  }
};
