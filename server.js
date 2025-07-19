const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const cors=require("cors");
const sqlite3=require("sqlite3").verbose();
const path=require("path");
const fs=require("fs");
const app=express();
const server=http.createServer(app);
const io=new Server(server);

// Database setup
const db = new sqlite3.Database("telemetry.db", (err) => 
{
  if (err) return console.error("DB Connection Error:", err.message);
  console.log("Connected to the SQLite DataBase");
});

db.run(`CREATE TABLE IF NOT EXISTS telemetry (
  timestamp TEXT PRIMARY KEY,
  altitude REAL,
  acceleration REAL,
  x REAL,
  y REAL,
  z REAL,
  pressure REAL,
  temperature REAL,
  latitude REAL,
  longitude REAL
)`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Handle telemetry POST data
app.post("/data", (req, res) => {
  const data = req.body;
  const timestamp = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO telemetry (timestamp, altitude, acceleration, x, y, z, pressure, temperature, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    timestamp,
    data.altitude,
    data.acceleration,
    data.x,
    data.y,
    data.z,
    data.pressure,
    data.temperature,
    data.latitude,
    data.longitude
  );

  stmt.finalize();
  io.emit("telemetry", data);
  res.json({ status: "received" });
});

// this is used to export the sqlite database into a csv file
app.get("/export", (req, res) => {
  const filePath = path.join(__dirname, "telemetry_export.csv");
  const header = "Timestamp,Altitude,Acceleration,X,Y,Z,Pressure,Temperature,Latitude,Longitude\n";
  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(header);

  db.each(
    "SELECT * FROM telemetry",
    (err, row) => {
      if (err) return console.error(err);
      const line = `${row.timestamp},${row.altitude},${row.acceleration},${row.x},${row.y},${row.z},${row.pressure},${row.temperature},${row.latitude},${row.longitude}\n`;
      writeStream.write(line);
    },
    () => {
      writeStream.end(()=>{
        res.download(filePath, "telemetry_export.csv", (err) => {
          if (err) console.error("Download error:", err);
        });
      });
    }
  );
});

// Serve index.html
app.get("/",(req,res)=> 
{res.sendFile(path.join(__dirname, "index.html"));});

server.listen(5000,()=>
{console.log(`Rocket Telemetry running on http://localhost:5000`);});