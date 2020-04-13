import os.path
from random import randint
from math import ceil

cov = {}
ycoords = {}
minZoom = 1
maxZoom = 10
gridWidth = 6
samples = 6000
filename = f'seq_{samples}_{maxZoom}.txt'

# set to 0.7 to avoid north/south poles
yAxisCutoff = 0.8  # out of 1

def getSizes(zoomLevel):
    width = 2 ** zoomLevel
    height = ceil(float(width) * yAxisCutoff)
    if width <= gridWidth and height <= gridWidth:
        return width, width
    return (width, height)

def gridrequest():
    z = randint(minZoom, maxZoom)
    [width, height] = getSizes(z)
    tiles = []

    size = gridWidth
    if width <= gridWidth and height <= gridWidth:
        height = width
        size = width
        
    xoffset = randint(0, width - size)
    yoffset = randint(width - height, height)
    if yoffset > height - size:
        yoffset = height - size

    if not z in cov:
        cov[z] = {}

    for a in range(size):
        for b in range(size):
            x = a + xoffset
            y = b + yoffset
            # For coverage report
            tileName = f"z={z}&x={x}&y={y} {z}/{x}/{y}.png"
            # tileName = f"{z}/{x}/{y}.png"
            tiles.append(tileName)

            # Coverage information
            if not tileName in cov[z]:
                cov[z][tileName] = 0
            cov[z][tileName] += 1

            if z == maxZoom:
                if not y in ycoords:
                    ycoords[y] = 0
                ycoords[y] += 1
    return tiles


res = []
for i in range(samples):
    grid = gridrequest()
    if grid is not None:
        res.append(grid)

y = list(ycoords.keys())
y.sort()

if maxZoom in cov:
    print(f"Y-Axis coverage on max zoom from {y[0]} to {y[-1]}: {round(100*(y[-1]-y[0] + 1)/y[-1], 1)}%")
else:
    print(f"Y-Axis coverage on max zoom: 0%")
print("Coverage by zoom level")
for z in range(minZoom, maxZoom + 1):
    [width, height] = getSizes(z)
    height -= (width - height)
    if not z in cov:
        print(f"\tz={z}: 0/{width*height} (0%)")
        continue
    c = list(cov[z].keys())
    print(f"\tz={z}: {len(c)}/{width*height} ({round(100*len(c)/(width*height), 1)}%)")
print(f"File saved as {filename}")

with open(filename, 'w') as file:
    for grid in res:

        # Skip grids where one tile doesn't exist
        valid = []
        for tile in grid:
            tileFilename = tile.split(' ')[1]
            if os.path.isfile('/home/peter/data/geonames/tiles/' + tileFilename):
                valid.append(tile)
        if len(valid) < 12:
            continue

        for tile in valid:
            file.write(tile)
            file.write('\n')
        if grid is not res[-1]:
            file.write('\n')
