#!/bin/bash
if [ ! -f test.zip ]; then
    zip -r test.zip *
else
    zip -ur test.zip *
fi
wsk -i action update test test.zip --kind nodejs:10
wsk -i action invoke --result test --param x 5 --param y 3 --param z 3
