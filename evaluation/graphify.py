import numpy as np
import pandas as pd
import datetime as dt
import matplotlib.pyplot as plt

no = pd.read_csv('graphs/clientGraph-no-1.csv', names=['latency','hit'])
tmp = pd.read_csv('graphs/clientGraph-tmp-2.csv', names=['latency','hit'])
loc = pd.read_csv('graphs/clientGraph-loc-3.csv', names=['latency','hit'])
ext = pd.read_csv('graphs/clientGraph-ext-3.csv', names=['latency','hit'])

for df in [no,tmp,loc,ext]:
    df['latency'][df['latency'] >= 150] = 150
    #df['hit'][df['hit'] == 0] = '#00f'
    #df['hit'][df['hit'] == 1] = '#f00'
#no['latency'][no['latency'] >= 150] = 150
#no['hit'][no['hit'] == 0] = '#00f'
#no['hit'][no['hit'] == 1] = '#f00'
#tmp['latency'][tmp['latency'] >= 150] = 150
#tmp['hit'][tmp['hit'] == 0] = '#00f'
#tmp['hit'][tmp['hit'] == 1] = '#f00'

#fig, axs = plt.subplots(2, 2)
fig, axs = plt.subplots(4)
#axs[0,0].bar(np.linspace(0,4740,4741), height=no['latency'], color=no['hit'])
#axs[0,0].set_title('No caching')
#axs[0,1].bar(np.linspace(0,4474,4475), height=tmp['latency'], color=df['hit'])
#axs[0,1].set_title('Function-scope caching')
#axs[1,0].bar(np.linspace(0,3887,3888), height=loc['latency'], color=df['hit'])
#axs[1,0].set_title('Machine-scope caching')
#axs[1,1].bar(np.linspace(0,3469,3470), height=ext['latency'], color=df['hit'])
#axs[1,1].set_title('Global-scope caching')
axs[0].bar(np.linspace(0,4740,4741), height=no['latency'])
axs[0].set_title('No caching')
axs[1].bar(np.linspace(0,4474,4475), height=tmp['latency'])
axs[1].set_title('Function-scope caching')
axs[2].bar(np.linspace(0,3887,3888), height=loc['latency'])
axs[2].set_title('Machine-scope caching')
axs[3].bar(np.linspace(0,3469,3470), height=ext['latency'])
axs[3].set_title('Global-scope caching')
axs[3].set_xlabel('Request #')
fig.text(0.00, 0.5, 'Latency [ms]', va='center', rotation='vertical')
fig.set_size_inches(12,14)
fig.tight_layout()
plt.show()

