4 main files
*   index.html
*   script.js
*   server.js
*   style.css


* Create a package.json file using npm init -y
* Install required libraries using
   npm install express socket.io cors sqlite3
* Run the node.js file using
    node server.js
    you can view the dashboard at the url : http://localhost:5000

* I simulate the data flow through an Application called PostMan, through which i can send the data as if it were coming from the electronics and the delay between each transmission. The sample dataset is stored in testdata_50.json

* For maps I have incorporated Leafet, which is a lightweight javascript map library and it updates the lcoation of the rocket with the latitude and longitudes transmitted from the GPS. The location status is changed to NO-GO if the co-ordinate is not trasnmitted for 3 minutes.