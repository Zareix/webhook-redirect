import { AxiosRequestConfig } from 'axios';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';

import { ApiError } from './../models/Error';

const AUTH_TOKEN = process.env.TOKEN ?? '';

type DomainAuthorization = {
  paths: { path: string; methods: string | string[] }[];
};

const getAuthorizedDomains = () =>
  JSON.parse(fs.readFileSync('authorizedDomains.json').toString());

const verifyDomain = (url: string, method?: string) => {
  const AUTHORIZED_DOMAINS = getAuthorizedDomains();
  const requestUrl = new URL(url);

  const authorizedDomain: DomainAuthorization =
    AUTHORIZED_DOMAINS[requestUrl.hostname];
  if (!authorizedDomain) {
    throw new ApiError('Domain unauthorized', 403);
  }

  const authorizedPath = authorizedDomain.paths.find((p) =>
    requestUrl.pathname.startsWith(p.path)
  );
  if (!authorizedPath) {
    throw new ApiError('Path unauthorized', 403);
  }

  if (!method) {
    throw new ApiError('No method specified', 400);
  }
  const authorizedMethod = authorizedPath.methods.includes(method);
  if (!authorizedMethod) {
    throw new ApiError('Method unauthorized', 405);
  }

  return true;
};

const redirectAuth = (
  req: Request<any, any, AxiosRequestConfig>,
  _res: Response,
  next: NextFunction
) => {
  const token = req.query.token ?? req.headers.authorization?.split(' ')[1];

  if (token !== AUTH_TOKEN) {
    throw new ApiError('Unauthorized', 401);
  }
  if (!req.body.url) {
    throw new ApiError('No url specified', 400);
  }

  if (!verifyDomain(req.body.url, req.body.method)) {
    throw new ApiError('Unauthorized', 401);
  }

  next();
};

const githubAuth = (req: Request, _res: Response, next: NextFunction) => {
  const sig = Buffer.from(req.get('x-hub-signature-256') || '', 'utf8');
  const hmac = crypto.createHmac('sha256', AUTH_TOKEN);

  const digest = Buffer.from(
    'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'),
    'utf8'
  );

  if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
    throw new ApiError('Unauthorized', 401);
  }

  if (!req.query.url || typeof req.query.url !== 'string') {
    throw new ApiError('No redirect URL specified', 400);
  }

  if (!verifyDomain(req.query.url, 'post')) {
    throw new ApiError('Unauthorized', 401);
  }

  next();
};

export default { redirectAuth, githubAuth };
