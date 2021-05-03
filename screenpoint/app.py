from flask import Flask, request, jsonify
import screenpoint
import cv2
import os
import calendar
import time

UPLOAD_FOLDER = os.path.join('static', 'uploads')

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/point_screen', methods=['GET', 'POST'])
def point_screen():
    if request.method == 'POST':

        # NOT THE BEST WAY TO GO ABOUT THIS, BUT I'M TOO BUSY TO FIND A BETTER SOLUTION

        #form data
        screen_file = request.files['screen']
        view_file = request.files['view']

        # Save photos locally
        ts = calendar.timegm(time.gmtime())
        screen_file_name = "screen-" + "-" + str(ts) + "." + screen_file.filename.split(".")[-1]
        view_file_name = "view-" + "-" + str(ts) + "." + view_file.filename.split(".")[-1]

        screen_image_path = os.path.join(app.config['UPLOAD_FOLDER'], screen_file_name)
        view_image_path = os.path.join(app.config['UPLOAD_FOLDER'], view_file_name)

        screen_file.save(screen_image_path)
        view_file.save(view_image_path)

        # Load input images.
        screen = cv2.imread(screen_image_path, 0)
        view = cv2.imread(view_image_path, 0)

        # Project view centroid to screen space.
        # x and y are the coordinate of the `view` centroid in `screen` space.
        x, y = screenpoint.project(view, screen)
        coords = {"x": int(x), "y": int(y)}

        # Delete the photos before exiting
        os.remove(screen_image_path)
        os.remove(view_image_path)

    
        return jsonify(coords)



    # This is temporary
    return """
        <form method="post" action="/point_screen" enctype="multipart/form-data">

            <label for="screen">Upload your screen image:</label>
            <input type="file" id="screen" name="screen" accept="image/*" required />

            <label for="view">Upload your view image:</label>
            <input type="file" id="view" name="view" accept="image/*" required />

            <button type="submit">Submit</button
        </form>
        """



if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)