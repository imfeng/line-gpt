/* eslint-disable @typescript-eslint/no-var-requires */
import express, { Request, Response } from 'express';
import { ChatGPTAPI } from 'chatgpt'
import { Client, middleware, MiddlewareConfig } from '@line/bot-sdk'
import * as dotenv from "dotenv";
dotenv.config();

const chatAiKey: string = process.env.OPENAI_API_KEY || '';
let chatgpt: any; // = new ChatGPTAPI({ apiKey: chatAiKey })
load();
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});
const lineConfig = lineClient.config;

const app: express.Application = express();
app.use(express.json()) // middleware que transforma la req.body a un json

const port: number = Number(process.env.PORT) || 3000;

app.get('/', middleware(lineConfig as MiddlewareConfig), async (req: Request, res: Response) => {
  try {
    const result = await Promise.all(req.body.events.map(handleEvent));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});


let currentGptRes: any = null
async function handleEvent(event: any) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  let opt: any = {};
  if(currentGptRes) {
    opt = {
      conversationId: currentGptRes?.conversationId,
      parentMessageId: currentGptRes?.id
    }
  }
  const res = await chatgpt.sendMessage(event.message.text, opt)

  return lineClient.replyMessage(event.replyToken, {
    type: "text",
    text: res.text,
  });
}

async function load() {
  // To use ESM in CommonJS, you can use a dynamic import
  const { ChatGPTAPI } = await import('chatgpt')

  chatgpt = new ChatGPTAPI({ apiKey: chatAiKey })
}