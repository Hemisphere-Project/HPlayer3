#!/bin/bash


mkdir -p output
for FILE in *.{mov,mp4,mp3}; do 
    if test -f "$FILE"; then
        TEXT="${FILE%%.*}".txt
        if test -f "$TEXT"; then
            cp "$TEXT" ./output/"$TEXT"
        else
            echo "<div class="title">"${FILE%%.*}"</div>" > ./output/"$TEXT"
            echo "<div class="subtitle"></div>" >> ./output/"$TEXT"
        fi
    fi
done