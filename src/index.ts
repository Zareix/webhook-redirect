import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

if (!process.env.TOKEN) throw new Error('No env TOKEN set');
if (!fs.existsSync('authorizedDomains.json')) {
  throw new Error("File 'authorizedDomains.json' does not exists");
}

const app = express();
const port = 3001;

import redirect from './routes/redirect';
import github from './routes/github';
import authHandler from './middleware/authentification';
import { ApiError, RedirectError } from './models/Error';

if (process.env.NODE_ENV === 'production') {
  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 10,
    })
  );
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get('/api/health', (req, res) => {
  res.status(200).send({ message: 'Running', healthy: true });
});

app.use('/api/redirect', authHandler.redirectAuth, redirect);

app.use('/api/github', authHandler.githubAuth, github);

// Error handler middleware
app.use((err, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  if (err instanceof ApiError) {
    res.status(statusCode).json({
      statusCode: err?.statusCode,
      statusText: err?.message,
      responseData: err?.data,
    });
  } else if (err instanceof RedirectError) {
    res.status(500).json({
      statusCode: 500,
      statusText: 'Redirected successfully but got error in response',
      responseError: {
        statusCode: err?.statusCode,
        statusText: err?.message,
        responseData: err?.data,
      },
    });
  }
  return;
});
