// Migration script to move embedded StoreProject.tasks to top-level Task collection.
// Usage:
//  - Dry run: NODE_ENV=production node scripts/migrate_tasks_to_collection.js --dry-run
//  - Execute:  NODE_ENV=production node scripts/migrate_tasks_to_collection.js
//
// Safety notes:
//  - The script marks embedded tasks with `_migrated: true` and `_migratedTo: <TaskId>` after creating top-level tasks.
//  - Always run with --dry-run first and backup your DB or run on a staging copy.
const mongoose = require('mongoose');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const dryRun = Boolean(argv['dry-run'] || argv.dryrun || false);

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/storeflow';

async function run() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', mongoUri);

  const StoreProject = require('../models/StoreProject');
  const Task = require('../models/Task');

  const projects = await StoreProject.find({ 'tasks.0': { $exists: true } }).lean();
  console.log(`Found ${projects.length} projects with embedded tasks`);

  let totalCreated = 0;
  for (const proj of projects) {
    const projectId = proj._id;
    for (const t of (proj.tasks || [])) {
      // Skip already migrated
      if (t._migrated) continue;

      const doc = {
        projectId,
        name: t.name || t.title || 'Untitled Task',
        description: t.description || '',
        assignedToId: t.assignedToId || t.assigneeId || null,
        assignedToName: t.assignedToName || t.assigneeName || '',
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        department: t.department || '',
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        tags: t.tags || []
      };

      console.log(`Would create task for project ${projectId}:`, doc.name);
      if (!dryRun) {
        const created = await Task.create(doc);
        totalCreated++;
        // mark embedded task as migrated with pointer to new task id
        await StoreProject.updateOne(
          { _id: projectId, 'tasks._id': t._id },
          { $set: { 'tasks.$._migrated': true, 'tasks.$._migratedTo': created._id } }
        );
      }
    }
  }

  console.log(dryRun ? 'Dry run complete. No documents were created.' : `Migration complete. Created ${totalCreated} tasks.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
