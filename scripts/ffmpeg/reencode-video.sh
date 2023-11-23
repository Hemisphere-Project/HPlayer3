#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )


# Re-encode MOV/MP4 to 1080p MP4 video
#
mkdir -p output
for FILE in *.{mov,mp4}; do 
    if test -f "$FILE"; then
        OUTFILE="${FILE%%.*}".mp4
        echo "Converting $FILE to $OUTFILE"

        # Re-encode video    
        ffmpeg -y -i "$FILE" -c:v libx264 -pix_fmt yuv420p -profile:v baseline \
        -vf "fps=25, scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -movflags +faststart -c:a aac -b:a 192k -shortest ./output/"$OUTFILE"

        # run make-titles.sh
        "$SCRIPT_DIR"/make-titles.sh

        # run make-images.sh
        "$SCRIPT_DIR"/make-images.sh
    fi
done

