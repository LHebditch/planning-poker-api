import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyEventMultiValueQueryStringParameters,
} from "aws-lambda";

export type WSLambdaHandler = (
  e: APIGatewayProxyWebsocketEventV2 & {
    multiValueQueryStringParameters: APIGatewayProxyEventMultiValueQueryStringParameters | null;
  }
) => Promise<APIGatewayProxyResult>;

export type WSPaylod = {
  action: string;
  content?: object;
};

export type DBEntry = {
  _pk: string; // connection/{conn-id}
  _sk: string; // static = CONNECTION
  gsi1: string; // the session id
  _ttl: number;
  userId: string;
  displayName: string;
};

export type Member = {
  connectionId: string;
  userId: string;
  displayName: string;
};
