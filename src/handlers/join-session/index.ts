import {
  connectToSession,
  disconnectFromDBSession,
  getAllInSession,
} from "../../lib/dynamo-service";
import { WSLambdaHandler, WSPaylod } from "../../lib/models";
import {
  forceDisconnect,
  notifyAll,
  notifyUser,
} from "../../lib/websocket-service";

export type JoinSessionPayload = {
  sessionId: string;
  userId: string;
  displayName: string;
};

/**
 * When a user requests to connect to a session
 */
export const handler: WSLambdaHandler = async (event) => {
  const body = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;
  const { content } = body as WSPaylod;
  const contentData = content as JoinSessionPayload;

  try {
    const { userId, sessionId, displayName } = contentData;
    // TODO assert on this data
    await connectToSession(connectionId, sessionId, userId, displayName);
    const membersInRoom = await getAllInSession(sessionId);
    const otherMembersInRoom = membersInRoom.filter(
      (m) => m.connectionId != connectionId
    );
    await notifyAll(otherMembersInRoom, "userjoined", {
      userId,
      displayName,
    });
    await notifyUser(connectionId, {
      action: "sessioninfo",
      data: otherMembersInRoom.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
      })),
    });
  } catch (e: unknown) {
    console.error(e);
    await forceDisconnect(connectionId);
    await disconnectFromDBSession(connectionId);
    // do we need to remove from dynamo? or does the _ttl handle cleanup?
  }

  return {
    statusCode: 200,
    body: "",
  };
};
