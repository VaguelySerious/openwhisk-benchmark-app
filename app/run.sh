#!/bin/bash
mv index0.js index.js
if [ ! -f action-0.zip ]; then
    zip -r action-0.zip index.js util node_modules
else
    zip -ur action-0.zip index.js util node_modules
fi
wsk -i action update tiles-0 action-0.zip --kind nodejs:10 --web true
mv index.js index0.js

mv index1.js index.js
if [ ! -f action-1.zip ]; then
    zip -r action-1.zip index.js util node_modules
else
    zip -ur action-1.zip index.js util node_modules
fi
wsk -i action update tiles-1 action-1.zip --kind nodejs:10 --web true
mv index.js index1.js

mv index2.js index.js
if [ ! -f action-2.zip ]; then
    zip -r action-2.zip index.js util node_modules
else
    zip -ur action-2.zip index.js util node_modules
fi
wsk -i action update tiles-2 action-2.zip --kind nodejs:10 --web true
mv index.js index2.js

mv index3.js index.js
if [ ! -f action-3.zip ]; then
    zip -r action-3.zip index.js util node_modules
else
    zip -ur action-3.zip index.js util node_modules
fi
wsk -i action update tiles-3 action-3.zip --kind nodejs:10 --web true
mv index.js index3.js



# URL="https://localhost/api/v1/web/guest/default/tiles?x=5&y=3&z=3"
# echo ''
# echo $URL
#wsk -i action invoke --result tiles --param x 5 --param y 3 --param z 3

