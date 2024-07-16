import { getAllInSession, getByConnectionId } from "../../lib/dynamo-service";
import { WSLambdaHandler, WSPaylod } from "../../lib/models";
import { notifyAll } from "../../lib/websocket-service";

type SubmitEstimationpayload = {
  estimation: string;
};

const estimations = [
  "0",
  "0.5",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "20",
  "40",
  "100",
  "coffeebreak",
  "?",
];

export const handler: WSLambdaHandler = async (event) => {
  const body = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;
  const { content } = body as WSPaylod;
  const { estimation } = content as SubmitEstimationpayload;

  try {
    validateEstimation(estimation);
    const connectionDetails = await getByConnectionId(connectionId);
    const membersInsession = await getAllInSession(connectionDetails.sessionId);
    await notifyAll(
      membersInsession.filter((m) => m.connectionId != connectionId),
      "estimationsubmitted",
      {
        userId: connectionDetails.userId,
        estimation,
      }
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

const validateEstimation = (e: string): boolean => {
  if (estimations.includes(e)) {
    return;
  }
  throw new Error("Invalid estmation value: " + e);
};
