from locust import HttpLocust, TaskSet, task, between
from locust.contrib.fasthttp import FastHttpLocust
from random import randint
from math import ceil

def gridrequest(self):
    z = randint(1, 8)
    width = 2 ** z
    amount = 6 # for a 6x6 request
    if width <= amount:
        xoffset = 0
        yoffset = 0
    else:
        xoffset = randint(0, width - amount)
        yoffset = randint(0, ceil(float(width) * 0.7) - amount)
    for a in range(6):
        for b in range(6):
            x = a + xoffset
            y = b + yoffset
            # Make sure we don't go out of bounds on lower zoom levels
            if x >= width or y >= width:
                return
            print(f"{z}/{x}/{y}.png")
            # self.client.get(baseURL + f"?z={z}&x={x}&y={y}&binary=true")
            
for i in range(1000):
    gridrequest('')
    print('')
