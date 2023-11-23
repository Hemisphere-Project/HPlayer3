#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Convert IMAGE to JPG

# rename all .jpeg into .jpg
for f in *.jpeg; do 
    mv -- "$f" "${f%.jpeg}.jpg"
done

# Convert all png to jpg
for f in *.png; do 
    echo "Converting $f"
    convert "$f" "${f%.png}.jpg"
done

# Convert MP3/4 to MP4 with still-image
#
mkdir -p output
for FILE in *.mp*; do 
    echo "Converting $FILE"
	IMAGE="${FILE%%.*}".jpg
    IMAGE1080="${FILE%%.*}"-1080.jpg
	OUT="${FILE%%.*}".mp4
	if test -f "$IMAGE"; then

        # letter-box image to 1080p
        ffmpeg -y -i "$IMAGE" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" "$IMAGE1080"
        
        # create video with still image
        ffmpeg -y -loop 1 -i "$IMAGE1080" -i "$FILE" -map 0 -map 1:a -c:v libx264 -pix_fmt yuv420p -profile:v baseline -vf "fps=25" -movflags +faststart -c:a aac -b:a 192k -shortest ./output/"$OUT"

    else 
        echo "No image $IMAGE for $FILE"
	fi

    # run make-titles.sh
    "$SCRIPT_DIR"/make-titles.sh

    # run make-images.sh
    "$SCRIPT_DIR"/make-images.sh
done

