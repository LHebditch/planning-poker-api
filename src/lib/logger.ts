import { Logger as _Logger } from "@aws-lambda-powertools/logger";
export type Logger = _Logger;
export const NewLogger = (): Logger => {
  const logger = new _Logger();

  return logger;
};
