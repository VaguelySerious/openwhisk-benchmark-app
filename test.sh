wsk -i action update /guest/test test.js --kind nodejs:10 --web true
curl --insecure "https://localhost/api/v1/web/guest/default/test"

