import { Stack, StackProps, aws_apigatewayv2, aws_iam } from "aws-cdk-lib";
import { Lambda, DynamoTable } from "neon-cdk-standards";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serviceName = "open-planning";

    const openPlanningTable = DynamoTable({
      stack: this,
      name: "open-planning-table",
      useTTL: true,
    });

    const lambdaOptions = {
      stack: this,
      serviceName,
    };

    const webSocketApi = new aws_apigatewayv2.WebSocketApi(
      this,
      "open-planning-api",
      {
        apiName: "open-planning-api",
        description: "web socket api for open-planning website",
      }
    );

    new aws_apigatewayv2.WebSocketStage(this, "open-planinng-ws-api-dev", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    const webSocketApiProps = {
      API_ID: webSocketApi.apiId,
      REGION: props?.env?.region ?? "",
      API_STAGE: "dev",
    };

    // ======= //
    // LAMBDAS //
    // ======= //

    const connectLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/connect/index.ts",
      name: "ws-connect",
      env: {},
    });

    const disconnectLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/disconnect/index.ts",
      name: "ws-disconnect",
      env: {
        ...webSocketApiProps,
        CONNECTION_TABLE: openPlanningTable.tableName,
      },
    });
    openPlanningTable.grantReadWriteData(disconnectLambda);
    webSocketApi.grantManageConnections(disconnectLambda);

    const joinSessionLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/join-session/index.ts",
      name: "ws-join-sesssion",
      env: {
        CONNECTION_TABLE: openPlanningTable.tableName,
        ...webSocketApiProps,
      },
    });
    openPlanningTable.grantReadWriteData(joinSessionLambda);
    webSocketApi.grantManageConnections(joinSessionLambda);

    const submitEstimationLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/submit-estimation/index.ts",
      name: "ws-submit-estimation",
      env: {
        CONNECTION_TABLE: openPlanningTable.tableName,
        ...webSocketApiProps,
      },
    });
    openPlanningTable.grantReadData(submitEstimationLambda);
    webSocketApi.grantManageConnections(submitEstimationLambda);

    const kickUserLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/kick-user/index.ts",
      name: "ws-kick-user",
      env: {
        CONNECTION_TABLE: openPlanningTable.tableName,
        ...webSocketApiProps,
      },
    });
    openPlanningTable.grantReadWriteData(kickUserLambda);
    webSocketApi.grantManageConnections(kickUserLambda);

    const sendMessageLambda = Lambda({
      ...lambdaOptions,
      codePath: "../src/handlers/send-message/index.ts",
      name: "ws-send-message",
      env: {
        CONNECTION_TABLE: openPlanningTable.tableName,
        ...webSocketApiProps,
      },
    });
    openPlanningTable.grantReadWriteData(sendMessageLambda);
    webSocketApi.grantManageConnections(sendMessageLambda);

    // ========== //
    // API ROUTES //
    // ========== //

    // route for connection
    webSocketApi.addRoute("$connect", {
      integration: new WebSocketLambdaIntegration("Connect", connectLambda),
    });

    // route for disconnection logic
    // handles every disconnect even forced
    webSocketApi.addRoute("$disconnect", {
      integration: new WebSocketLambdaIntegration(
        "Disconnect",
        disconnectLambda
      ),
    });

    // route for when the user wants to join the session
    webSocketApi.addRoute("joinsession", {
      integration: new WebSocketLambdaIntegration(
        "JoinSession",
        joinSessionLambda
      ),
    });

    // route for when the user wants to submit an estimation
    webSocketApi.addRoute("submitestimation", {
      integration: new WebSocketLambdaIntegration(
        "SubmitEstimation",
        submitEstimationLambda
      ),
    });

    webSocketApi.addRoute("kickuser", {
      integration: new WebSocketLambdaIntegration("KickUser", kickUserLambda),
    });

    webSocketApi.addRoute("sendmessage", {
      integration: new WebSocketLambdaIntegration(
        "SendMessage",
        sendMessageLambda
      ),
    });

    // ====== //
    // PARAMS //
    // ====== //
    // create param items for important things like table and apiId

    // ======= //
    // OUTPUTS //
    // ======= //
  }
}
