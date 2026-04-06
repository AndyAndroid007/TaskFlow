const SSEManager = require('../infrastructure/sse/sseManager');
subscribe = (req, res) => {
    const user = req.user.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write(':connected\n\n');

    SSEManager.newClientConnection(user, res);

    req.on('close', () => {
        SSEManager.removeClientConnection(user, res);
    });
}
module.exports = {subscribe}