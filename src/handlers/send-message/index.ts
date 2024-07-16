import { getAllInSession, getByConnectionId } from "../../lib/dynamo-service";
import { WSLambdaHandler, WSPaylod } from "../../lib/models";
import { notifyAll } from "../../lib/websocket-service";

type SendMessagePayload = {
  action: string;
  content?: object;
};

export const handler: WSLambdaHandler = async (event) => {
  const body = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;
  const { content } = body as WSPaylod;
  const payload = content as SendMessagePayload;

  try {
    const connectionDetails = await getByConnectionId(connectionId);
    const membersInsession = await getAllInSession(connectionDetails.sessionId);
    await notifyAll(
      membersInsession.filter((m) => m.connectionId != connectionId),
      payload.action,
      payload.content
    );
  } catch (e: unknown) {
    console.error(e);
    throw new Error("failed to submit estimation");
  }

  return {
    statusCode: 200,
    body: "",
  };
};
