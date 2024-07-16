import { DynamoDB } from "aws-sdk";
import { DBEntry, Member } from "./models";
const client = new DynamoDB.DocumentClient();

export const connectToSession = async (
  id: string,
  sessionId: string,
  userId: string,
  displayName: string
) => {
  console.log("create dynamo entry for connection");
  const item: DBEntry = {
    _pk: `connection/${id}`,
    _sk: "CONNECTION",
    gsi1: sessionId, // we can query this gsi to get all people in the session
    _ttl: Math.floor((new Date().getTime() + 24 * 60 * 60 * 1000) / 1000), // just in case
    userId,
    displayName,
  };

  await client
    .put({
      TableName: process.env.CONNECTION_TABLE as string,
      Item: item,
    })
    .promise();
};

export const disconnectFromDBSession = async (id: string) => {
  await client
    .delete({
      TableName: process.env.CONNECTION_TABLE as string,
      Key: {
        _pk: `connection/${id}`,
        _sk: "CONNECTION",
      },
    })
    .promise();
};

export const getAllInSession = async (sessionId: string): Promise<Member[]> => {
  console.log("get list of other members in session");
  const { Items } = await client
    .query({
      TableName: process.env.CONNECTION_TABLE as string,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1 = :gsi1",
      ExpressionAttributeValues: {
        ":gsi1": sessionId,
      },
    })
    .promise();

  // this should be safer!
  return (Items as DBEntry[]).map(({ _pk, ...user }) => ({
    ...user,
    connectionId: _pk.split("/")[1], // extract connectionId from _pk
  }));
};

export const getByConnectionId = async (connectionId: string) => {
  console.log("get connection details");
  const { Item } = await client
    .get({
      TableName: process.env.CONNECTION_TABLE as string,
      Key: {
        _pk: `connection/${connectionId}`,
        _sk: "CONNECTION",
      },
    })
    .promise();

  if (!!Item) {
    const { gsi1, ...item } = Item as DBEntry;
    return {
      ...item,
      sessionId: gsi1,
    };
  }

  throw new Error("failed to find entry for connection id");
};
