const { ECSClient, UpdateServiceCommand } = require("@aws-sdk/client-ecs");

const ecs = new ECSClient({});

exports.handler = async (event) => {
  const cluster = event.cluster;
  const service = event.service;
  const desiredCount = parseInt(event.desired_count, 10);

  console.log(`Scaling service ${service} in cluster ${cluster} to ${desiredCount}`);

  try {
    const command = new UpdateServiceCommand({
      cluster,
      service,
      desiredCount
    });

    const result = await ecs.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Service scaled", result }),
    };
  } catch (err) {
    console.error("Error updating ECS service:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to update service", error: err.message }),
    };
  }
};