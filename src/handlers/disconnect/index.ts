import {
  disconnectFromDBSession,
  getAllInSession,
  getByConnectionId,
} from "../../lib/dynamo-service";
import { WSLambdaHandler } from "../../lib/models";
import { notifyAll } from "../../lib/websocket-service";

export const handler: WSLambdaHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    const connectionIfo = await getByConnectionId(connectionId);
    const otherMembersInRoom = await getAllInSession(connectionIfo.sessionId);
    await notifyAll(
      otherMembersInRoom.filter((m) => m.connectionId != connectionId),
      "userleft",
      {
        userId: connectionIfo.userId,
      }
    );
    await disconnectFromDBSession(connectionId);
  } catch (e: unknown) {
    console.log(e);
    return {
      statusCode: 500,
      body: "Something's gone wrong",
    };
  }
  return {
    statusCode: 200,
    body: "",
  };
};
