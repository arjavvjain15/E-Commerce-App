# Event-Driven Order Processing with AWS SQS, DLQ, and SES

This guide documents the architecture, setup commands, local testing steps, and production best practices for the AWS SQS and DLQ order processing pipeline.

---

## 1. Architectural Concepts & Rationale

### Why SQS (Simple Queue Service)?
- **Decoupling**: By placing orders in a queue, we decouple the critical order entry flow (saving the order and clearing the shopping cart) from down-stream validation, inventory booking, payment processing, or fulfillment services.
- **Resilience / Buffer Management**: During peak traffic events (such as flash sales), traffic spikes won't crash our database. SQS buffers incoming orders, allowing background workers to process them at a stable, controlled rate (throttling).

### Why Retries & Visibility Timeout?
- **Visibility Timeout**: When a worker pulls a message from SQS, SQS hides the message from other workers for a specified period (the visibility timeout, e.g. 30 seconds). If the worker processes the message successfully, it deletes the message.
- **Retry Mechanism**: If the worker encounters an error (e.g. database downtime, address validation error), it throws an exception and does *not* delete the message. When the visibility timeout expires, the message automatically becomes visible again in the queue for another worker to retry.

### Why DLQ (Dead-Letter Queue)?
- **Poison Pill Mitigation**: If a message has a malformed structure or an inherently unresolvable validation error (like an address that is too short), retrying it infinitely wastes CPU cycles and blocks the queue.
- **Isolate & Alert**: SQS routes messages that fail processing after a specified number of attempts (`maxReceiveCount = 3`) to a Dead-Letter Queue (`order-dlq`). A separate worker pulls from the DLQ, logs the failure, and notifies the Admin immediately via AWS SES.

---

## 2. Folder Structure & Files Created

The event-driven integration is added to the backend codebase using the following layout:

```
backend/
├── package.json                   # SQS/SES dependencies & worker scripts
├── server.js                      # DB sync enabled on server boot
└── src/
    ├── config/
    │   └── aws.js                 # Shared SQS and SES clients configuration
    ├── utils/
    │   └── email.js               # SES SendEmailCommand helper utility
    ├── producers/
    │   └── order.producer.js      # Message producer targeting order-queue
    ├── workers/
    │   ├── order.worker.js        # Main SQS queue polling worker/consumer
    │   └── dlq.worker.js          # SQS DLQ fail notifier consumer worker
    └── models/
        └── order.model.js         # Altered status ENUM ("confirmed" added)
```

---

## 3. Configuration & SQS Queue Creation Commands

Use the following AWS CLI commands to create and configure the SQS queues and Redrive Policy.

### Step 1: Create the Dead-Letter Queue (DLQ)
Create the queue and retrieve its ARN (needed for the main queue's redrive policy):
```bash
aws sqs create-queue --queue-name order-dlq
```
Get the DLQ ARN:
```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.ap-south-1.amazonaws.com/123456789012/order-dlq \
  --attribute-names QueueArn
```

### Step 2: Create the Main Order Queue with Redrive Policy
Create a JSON file named `redrive-policy.json` (replace DLQ ARN with yours):
```json
{
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:ap-south-1:123456789012:order-dlq\",\"maxReceiveCount\":3}",
  "VisibilityTimeout": "30"
}
```
Create the main queue applying this configuration:
```bash
aws sqs create-queue \
  --queue-name order-queue \
  --attributes file://redrive-policy.json
```

---

## 4. Required Environment Variables

Add the following environment variables to your backend `.env` file:

```env
# AWS Authentication Credentials
AWS_REGION=ap-south-1
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Queue Endpoints
ORDER_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/123456789012/order-queue
ORDER_DLQ_URL=https://sqs.ap-south-1.amazonaws.com/123456789012/order-dlq

# Notification Configurations
SES_SENDER_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 5. Error Handling Strategy & Failure Resilience

1. **Transaction Placement Safety**:
   The SQS message dispatch is located **outside** the database transaction block. If MySQL writing fails, SQS never receives a ghost message.
2. **Worker Graceful Errors**:
   The worker uses try/catch blocks. If processing fails, the worker logs the error but **does not delete the message**, triggering SQS retries automatically after the visibility timeout.
3. **No Database Blockers**:
   If an order message points to a deleted database record, the worker logs a warning and deletes the message, preventing database reference inconsistencies from jamming the queue.

---

## 6. Local Testing Steps

### Step 1: Alter Database Column
Ensure the database table is updated in MySQL command line to support the new `confirmed` status:
```sql
ALTER TABLE `Orders` MODIFY COLUMN `status` ENUM('draft', 'pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';
```

### Step 2: Launch Workers
Open separate terminal instances and launch the background consumers:
```bash
# Terminal 1: Launch main queue worker
npm run worker:order

# Terminal 2: Launch dead-letter queue worker
npm run worker:dlq
```

### Step 3: Trigger Valid Order Checkout
1. Place an order from the e-commerce client UI or make a POST request to `/api/orders/checkout` with a valid address (e.g. `"123 Shopping Plaza, Sector 4"`).
2. Observe the main SQS worker console logs:
   - Processes the message.
   - Finds it valid.
   - Updates status to `confirmed`.
   - Deletes message from the queue.

### Step 4: Trigger Invalid Order Checkout (DLQ & SES Flow)
1. Place an order with an invalid address (e.g. `"Short Rd"`).
2. The main SQS worker receives the message, fails validation, and throws an error.
3. The message is retried 3 times.
4. After 3 retries, the message moves to `order-dlq`.
5. The DLQ worker retrieves the message, triggers an AWS SES email alert to the admin, and deletes the message from the DLQ.

---

## 7. Production Best Practices

1. **Visibility Timeout vs Execution Time**:
   Ensure `VisibilityTimeout` (default 30s) is always greater than the maximum time your worker takes to process a single message (e.g. database timeouts). Otherwise, another worker will pull the message before the first one finishes, causing double processing.
2. **Backoff Retries**:
   Configure a Visibility Retry Backoff (e.g., using SQS Message Delay or SQS queue attributes) to prevent hammering the database continuously during transient DB outages.
3. **IAM Least Privilege**:
   For production IAM roles, limit permissions exclusively to:
   - `sqs:ReceiveMessage`, `sqs:DeleteMessage`, and `sqs:GetQueueAttributes` for the workers.
   - `sqs:SendMessage` for the Express backend server.
   - `ses:SendEmail` for the DLQ worker.
