from tornado import ioloop, httpclient
from datetime import datetime
import sys

baseURL = 'https://a52536df617ec4dd58b03d164387a6f0-1682332530.eu-central-1.elb.amazonaws.com:443/api/v1/web/default/default'
actionName = '/tiles-0'

i = 0

def handle_request(res):
    now = str(datetime.now())[11:19]
    time = int(round(res.request_time * 1000, 0))

    try:
      body = res.buffer.read().decode('UTF-8').strip().replace(" ", "").replace('\n','').replace('\r', '')
      sys.stderr.write('.')
    except:
      body = '{"error":"true"}'
      sys.stderr.write('x')
    print now, str(time) + 'ms', body
    global i
    i -= 1
    if i == 0:
      sys.stderr.write('\nDone\n')
      ioloop.IOLoop.instance().stop()

http_client = httpclient.AsyncHTTPClient(max_clients=30)
total = 1000

sys.stderr.write('Starting\n')
for line in open('seq.txt'):
  if line.strip():
    url = baseURL + actionName + '?' + line.split(' ')[0]
    i += 1
    http_client.fetch(url, handle_request, method='GET', validate_cert=False, connect_timeout=600, request_timeout=1200)
    total -= 1
    if total <= 0:
      break

ioloop.IOLoop.instance().start()
