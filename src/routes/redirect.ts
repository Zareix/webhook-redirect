import { ApiError, RedirectError } from './../models/Error';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import express, { NextFunction, Request, Response } from 'express';
import hash from 'object-hash';
const router = express.Router();

const redirectRequest = async (webhook: AxiosRequestConfig): Promise<any> => {
  const hashed = hash({ date: new Date(), webhook });
  console.log(
    hashed +
      ` | Request ${webhook.method?.toUpperCase()} sent to ${webhook.url}` +
      (webhook.params
        ? `?${Object.entries(webhook.params)
            .map((x) => `${x[0]}=${x[1]}`)
            .join('&')}`
        : '')
  );
  try {
    const res = (await axios.request(webhook)).data;
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
    const webhookResponse = await redirectRequest(req.body);
    if (webhookResponse instanceof RedirectError) {
      next(webhookResponse);
      return;
    }
    res.status(200).send({
      statusCode: 200,
      statusText: 'Redirected request',
      redirectResponse: webhookResponse,
    });
  }
);

export default router;
