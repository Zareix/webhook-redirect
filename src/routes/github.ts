import hash from 'object-hash';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import express, { NextFunction, Request, Response } from 'express';

import { ApiError, RedirectError } from './../models/Error';

const router = express.Router();

const redirectGithubRequest = async (url: string) => {
  const hashed = hash({ date: new Date(), url });
  console.log(hashed + ` | Request from Github redirected to ${url}`);
  try {
    const res = (await axios.post(url)).data;
    console.log(hashed + ' | Got :', res);
    return res;
  } catch (error) {
    const errRes = (error as AxiosError).response;
    console.error(
      hashed + ` | Got error ${errRes?.status} : ${errRes?.statusText}`,
      errRes?.data
    );
    return new RedirectError(errRes?.statusText, errRes?.status, errRes?.data);
  }
};

router.post(
  '/',
  async (
    req: Request<any, any, AxiosRequestConfig>,
    res: Response,
    next: NextFunction
  ) => {
    if (typeof req.query.url !== 'string') {
      throw new ApiError('No Url specified', 400);
    }
    redirectGithubRequest(req.query.url).then((data) => {
      if (data instanceof RedirectError) {
        next(data);
        return;
      }
    });
    res.status(200).send({
      message: 'Webhook redirected to ' + req.query.url,
    });
  }
);

export default router;
