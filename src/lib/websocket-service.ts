import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { Member } from "./models";

const buildApiEndpoint = () => {
  return `https://${process.env.API_ID}.execute-api.${process.env.REGION}.amazonaws.com/${process.env.API_STAGE}`;
};

const apiClient = new ApiGatewayManagementApiClient({
  endpoint: buildApiEndpoint(),
});

/**
 * Send disconnect request to connection
 * Doing this will trigger the disconnect route and therefore update DB accordingly
 */
export const forceDisconnect = async (connectionId: string) => {
  await apiClient.send(
    new DeleteConnectionCommand({
      ConnectionId: connectionId,
    })
  );
};

export const notifyUser = async (connectionId: string, data?: object) => {
  await apiClient.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: data ? JSON.stringify(data) : undefined,
    })
  );
};

/**
 * Notify all OTHER users in a session
 *
 * @param sessionId the id of the session to notify
 * @param connectionId the connection id of user trigggering notification
 * @param action action to perform
 * @param data data to send
 */
export const notifyAll = async (
  usersToNotify: Member[],
  action: string,
  data?: object
) => {
  const connectionIds = usersToNotify.map((i) => i.connectionId);
  console.log(`notifying ${connectionIds.length} other user(s) of ${action}`);
  const notifyRequests = [];
  for (let m of connectionIds) {
    notifyRequests.push(notifyUser(m, { action, data }));
  }

  try {
    await Promise.all(notifyRequests);
  } catch (e) {
    console.warn(
      `failed to notify all other members on ${action}. this could be because they have disconnected at identical time`
    );
  }
};
