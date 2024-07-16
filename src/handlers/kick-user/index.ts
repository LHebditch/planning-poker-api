import { getAllInSession, getByConnectionId } from "../../lib/dynamo-service";
import { WSLambdaHandler, WSPaylod } from "../../lib/models";
import { forceDisconnect } from "../../lib/websocket-service";

type KickUserPayload = {
  userId: string; // the id of the user to kick
};

export const handler: WSLambdaHandler = async (event) => {
  const body = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;
  const { content } = body as WSPaylod;
  const { userId } = content as KickUserPayload;

  try {
    const connectionDetails = await getByConnectionId(connectionId);
    const membersInsession = await getAllInSession(connectionDetails.sessionId);
    const memberToKick = membersInsession.filter((m) => m.userId === userId)[0];
    if (!memberToKick) {
      throw new Error("Could not find member to kick");
    }
    await forceDisconnect(memberToKick.connectionId);
  } catch (e: unknown) {
    console.error(e);
    throw new Error("failed to kick member");
  }

  return {
    statusCode: 200,
    body: "",
  };
};
