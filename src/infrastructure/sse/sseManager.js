class SSEManager {
    constructor() {
        this.clients = new Map();
    }
    newClientConnection = (userId, res) => {
        const stringId = userId.toString();
        if(!this.clients.has(stringId)) this.clients.set(stringId, new Set());
        this.clients.get(stringId).add(res);
    };
    removeClientConnection = (userId,res) => {
        const stringId = userId.toString();
        if(this.clients.has(stringId)) {
            this.clients.get(stringId).delete(res);
            if(this.clients.get(stringId).size == 0) this.clients.delete(stringId);
        }
    };
    sendNotification = (userId, payload) => {
        const stringId = userId.toString();
        if(this.clients.has(stringId)) {
            for( const client of this.clients.get(stringId)) {
                client.write(`data: ${JSON.stringify(payload)}\n\n`);
            }
        }
        
    };

}
module.exports = new SSEManager();