#!/bin/bash

# Build preview images
#
mkdir -p output
for FILE in *.{mov,mp4,mp3}; do 
    if test -f "$FILE"; then
        echo "Thumbnail for $FILE"

        IMAGEOUT="${FILE%%.*}".jpg

        # if image exists, letter-box image to 480p jpg
        for IMAGE in "${FILE%%.*}".{jpg,jpeg,png}; do 
            if test -f "$IMAGE"; then
                echo "Converting $IMAGE"
                ffmpeg -y -i "$IMAGE" -vf "scale=720:480:force_original_aspect_ratio=decrease,pad=720:480:(ow-iw)/2:(oh-ih)/2" ./output/"$IMAGEOUT"
            fi
        done

        # if image missing, create image from video
        if test ! -f ./output/"$IMAGEOUT"; then
        
            ffmpeg -y -i "$FILE" -vframes 1 -vf "scale=720:480:force_original_aspect_ratio=decrease,pad=720:480:(ow-iw)/2:(oh-ih)/2" ./output/"$IMAGEOUT"
        fi
    fi
done
