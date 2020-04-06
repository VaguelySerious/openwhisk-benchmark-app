#!/bin/bash
if [ ! -f action.zip ]; then
    zip -r action.zip index.js util
else
    zip -ur action.zip index.js util
fi
wsk -i action update tiles action.zip --kind nodejs:10 --web true
URL="https://localhost/api/v1/web/guest/default/tiles?x=5&y=3&z=3"
echo ''
echo $URL
#wsk -i action invoke --result tiles --param x 5 --param y 3 --param z 3
