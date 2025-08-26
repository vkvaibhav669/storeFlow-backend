# Task assignment & notifications — testing and deployment guide

This file explains how to test the new assignment feature and how to enable the different modes (embedded tasks vs collection), email worker, and sockets.

## Files added
- models/Task.js (optional top-level task collection)
- models/Notification.js (already added)
- models/User.js (added assignedTasks & notifications fields — merge into your existing model)
- routes/tasksRoutes.js (endpoints)
- workers/emailWorker.js (Bull worker for emails)
- scripts/migrate_tasks_to_collection.js (migration script)
- lib/socketQueueSetup.js (helper to wire socket.io & Bull)
- TESTING.md (this file)

## Environment variables
- USE_TASK_COLLECTION=true|false (default false)
  - true -> uses models/Task collection and new migration script
  - false -> keeps using embedded project.tasks
- REDIS_URL (e.g. redis://127.0.0.1:6379) for Bull queue
- EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, EMAIL_SMTP_SECURE
- EMAIL_FROM (sender address)
- MONGODB_URI for migration script (scripts/migrate_tasks_to_collection.js)

## How to wire into your server
1. Install dependencies:
   - npm i bull nodemailer minimist
2. In your server entrypoint (e.g. server.js) add:
   - const { setupSocketAndQueue } = require('./lib/socketQueueSetup');
   - const { io, emailQueue } = setupSocketAndQueue(server, app);
   This exposes `io` as app.get('io') and `emailQueue` as app.get('emailQueue') used by the routes.

## Running the email worker
- Start a Redis instance (or use a hosted Redis).
- Run the worker in a separate terminal / process:
  - REDIS_URL=redis://127.0.0.1:6379 EMAIL_SMTP_HOST=... EMAIL_SMTP_USER=... EMAIL_SMTP_PASS=... node workers/emailWorker.js

## Testing flows locally (suggested)
1. Start the app with USE_TASK_COLLECTION=false (default) to ensure embedded tasks flow works:
   - npm run dev (or your start script)
2. Create a project and a user via your existing API or seeding scripts.
3. Call POST /projects/:projectId/tasks/assign
   Request body example:
   {
     "name": "Investigate payment failure",
     "description": "Customer payment fails intermittently",
     "assignedToId": "<userId>",
     "assignedToName": "Jane Doe",
     "priority": "high",
     "status": "todo"
   }
4. Check responses:
   - status 201, payload includes created embedded task and notification object.
5. Verify side effects:
   - Notification document created in notifications collection.
   - User.notifications array contains the notification id.
   - User.assignedTasks contains an entry (if you merged the User model).
   - If socket.io client connected and joined the user room, an event 'notification' should be received.
   - If REDIS_URL + email worker running, a job should be enqueued and the worker should send the email.

## Testing top-level Task collection mode
1. Set USE_TASK_COLLECTION=true in your environment.
2. (Optional) Run migration script to move embedded tasks to collection:
   - First run dry-run:
     NODE_ENV=production node scripts/migrate_tasks_to_collection.js --dry-run
   - Then run without dry-run to create Task documents and mark embedded tasks migrated:
     NODE_ENV=production node scripts/migrate_tasks_to_collection.js
3. Start app and worker as above.
4. Create new assignments -> they will create Task documents in tasks collection.

## Notes & safety
- Always run the migration script on a staging copy first or take DB backups.
- The migration marks embedded tasks with `_migrated` and `_migratedTo`. You can decide to remove embedded tasks after verifying migration.
- Merge the User model carefully: if your repository already has a User schema, add `assignedTasks` and `notifications` fields, or adapt the update logic in routes/tasksRoutes.js.

## Suggested PR body
This PR adds:
- Task assignment endpoint and user-assigned tasks listing.
- Notification model and notification creation on assignment.
- Optional top-level Task collection and migration script.
- Email worker (Bull + nodemailer) example and helper to wire queue + socket.io.
- Testing instructions in TESTING.md.

Run `npm install bull nodemailer minimist` and configure REDIS_URL and SMTP env vars to enable background email jobs.
