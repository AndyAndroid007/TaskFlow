const express = require('express')
const app = express();

app.use(express.json());

app.get("/", (req,res) => {
    res.send("Express Server is Running");
});

const port = 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Express is running on port ${port}`);
});

