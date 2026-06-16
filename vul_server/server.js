const http = require("http");
const url = require("url");
const { exec } = require("child_process");

const server = http.createServer((req, res) => {
    const q = url.parse(req.url, true);

    if (q.pathname === "/cmd") {
        const cmd = q.query.cmd;

        console.log("Received:", cmd);

        let output = `Simulated execution of: ${cmd}`;

        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end(output);

    } else {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("NetRecon Demo Server Running on port 3000");
    }
});

server.listen(3000, () => {
    console.log("Server running on http://127.0.0.1:3000");
});