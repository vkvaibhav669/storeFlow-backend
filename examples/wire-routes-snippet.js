// In your app initialization (app.js/server.js)
const notesRouter = require('./routes/notes');
const approvalsRouter = require('./routes/approvals');

app.use('/api/notes', notesRouter);
app.use('/api/approvals', approvalsRouter);
