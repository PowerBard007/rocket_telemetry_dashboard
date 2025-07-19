const socket = io();//initializes socketio connection to the server

const charts={};
let chartConfigs=[
  { id:"altitude", label:"Altitude(m)", color:"#00ffff" },
  { id:"acceleration", label:"Acceleration(m/s²)", color:"#00ff99" },
  { id:"x", label:"X-Orientation", color:"#ff6666" },
  { id:"y", label:"Y-Orientation", color:"#ffcc66" },
  { id:"z", label:"Z-Orientation", color:"#6699ff" },
  { id:"temperature", label:"Temperature(°C)", color:"#ff4da6" },
  { id:"pressure", label:"Pressure(hPa)", color:"#66ffcc" }
];// creates chart.js instances

chartConfigs.forEach(({ id, label, color }) => {
  const ctx = document.getElementById(`${id}-chart`).getContext("2d");
  charts[id] = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label, data: [], borderColor: color, fill: false }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: false },
        y: { beginAtZero: true }
      }
    },
    plugins: {
  legend: {
    display: false
  }
}
  });
});//configures the line chart


let map = L.map("location-map").setView([11.0625, 76.9815], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let marker = L.marker([11.0625, 76.9815]).addTo(map);// setting up leaflet and a marker on it


let firstDataTime=null;
let lastDataTime=Date.now();
let goStatus={telemetry:false,avionics:false,propulsion:false };//variable for monitoring rocket status

socket.on("telemetry", (data) => 
{
  const now = new Date();
  lastDataTime =Date.now();
  if(!firstDataTime) 
    firstDataTime = now;

  updateTimeElapsed();
  updateConnectionStatus();
  updateGoNoGo(true);

  // Set value tiles
  updateValue("altitude",data.altitude, "m");
  updateValue("acceleration",data.acceleration, "m/s²");
  updateValue("x-orientation",data.x);
  updateValue("y-orientation",data.y);
  updateValue("z-orientation",data.z);
  updateValue("temperature",data.temperature);
  updateValue("pressure",data.pressure);

  // Update chart ui
  const timeLabel=now.toLocaleTimeString();
  for(let key of ["altitude","acceleration","x","y","z","temperature","pressure"]) {
    if(data[key]!==undefined) 
    {
      let chart=charts[key];
      chart.data.labels.push(timeLabel);
      chart.data.datasets[0].data.push(data[key]);
      if (chart.data.labels.length>30) 
      {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }
      chart.update();
    }
  }


  if(data.latitude&&data.longitude) 
  {
    marker.setLatLng([data.latitude,data.longitude]);
    map.setView([data.latitude,data.longitude]);
    updateGoNoGo(true,"tracking");
  }
});//listens for telemetry data via websockets and updates fronend dashbaord

function updateValue(id,val,suffix="") 
{
  if(val!==undefined)
  {
    const el= document.getElementById(id);
    if(el) 
      el.innerText=`${val}${suffix}`;
  }
}// updates value if elemtn exits in dom and value exists

function updateTimeElapsed() 
{
  if(!firstDataTime) 
    return;
  const elapsed= Math.floor((Date.now()-firstDataTime.getTime())/1000);
  const min=Math.floor(elapsed/60);
  const sec=elapsed%60;
  document.getElementById("time").innerText=`Time>${min}min${sec}sec`;
}// updates the time elapsed 

function updateConnectionStatus()
{
  const status=(Date.now()-lastDataTime<180000)?"Connected":"Not Connected";
  document.getElementById("connection").innerText=`Connection>${status}`;
}// updates the connection status based on last received data

function updateGoNoGo(isReceiving,system=null)
{
  const systems=system?[system]:["telemetry","avionics","propulsion"];
  systems.forEach(sys => {
    const id=`${sys}-status`;
    const el=document.getElementById(id);
    if(!el) 
      return;
    if(isReceiving) 
    {
      el.innerText="GO";
      el.classList.remove("no-go");
      el.classList.add("go");
    } 
    else 
    {
      el.innerText="NO GO";
      el.classList.remove("go");
      el.classList.add("no-go");
    }
  });
}//visually updates the system status

setInterval(()=> 
{
  if (Date.now()-lastDataTime>3000) {
    updateGoNoGo(false);
  }
  updateConnectionStatus();
  updateTimeElapsed();
},1000);//checks done evry 1 sec on the dashboard 


const exportBtn=document.getElementById("export-btn");
if (exportBtn){
  exportBtn.addEventListener("click",()=>{
    window.open("/export","_blank");
  });
}//exporting the data as csv file, when button is clicked, it opens the /exports url