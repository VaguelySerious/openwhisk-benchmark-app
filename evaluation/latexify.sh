#!/bin/bash
cat results.tsv | sed 's/\t/\&/g' | sed 's/$/\\\\ \\hline/g'

