import { WSLambdaHandler } from "../../lib/models";

export const handler: WSLambdaHandler = async () => {
  // i dont think we want any default behavior on connection atm
  // if someone connects to this websocket i still want them
  // to request to join a planning session seperately

  // maybe we can create a scheduled event which will trigger a lambda that
  // disconnects this connectionId if it has not joined a session?

  return {
    statusCode: 200,
    body: "",
  };
};
